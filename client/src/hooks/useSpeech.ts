import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const {
    lang = 'ja-JP',
    rate = 0.9,
    pitch = 1.0,
    volume = 1.0,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const japaneseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    // 检查浏览器是否支持Web Speech API
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // 加载可用的语音
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        
        // 优先查找日语语音
        // 按优先级排序：Google日语 > 系统日语 > 其他日语
        const japaneseVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('ja')
        );
        
        // 按优先级选择最佳日语语音
        let bestVoice: SpeechSynthesisVoice | null = null;
        
        // 优先选择Google日语语音
        bestVoice = japaneseVoices.find(v => 
          v.name.toLowerCase().includes('google') && v.lang === 'ja-JP'
        ) || null;
        
        // 其次选择任何ja-JP语音
        if (!bestVoice) {
          bestVoice = japaneseVoices.find(v => v.lang === 'ja-JP') || null;
        }
        
        // 最后选择任何日语语音
        if (!bestVoice && japaneseVoices.length > 0) {
          bestVoice = japaneseVoices[0];
        }
        
        japaneseVoiceRef.current = bestVoice;
        setVoices(japaneseVoices.length > 0 ? japaneseVoices : availableVoices);
        
        // 调试日志
        if (process.env.NODE_ENV === 'development') {
          console.log('Available Japanese voices:', japaneseVoices.map(v => `${v.name} (${v.lang})`));
          console.log('Selected voice:', bestVoice?.name);
        }
      };

      // 立即尝试加载
      loadVoices();
      
      // 某些浏览器需要异步加载语音列表
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Chrome有时需要延迟加载
      setTimeout(loadVoices, 100);
    }

    return () => {
      // 清理:停止所有语音
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();

    // 清理文本中的注音标记（括号内的假名）
    // 例如: "私(わたし)は" -> "私は"
    const cleanText = text.replace(/\([ぁ-んァ-ン]+\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // 强制设置为日语
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // 使用已缓存的日语语音
    if (japaneseVoiceRef.current) {
      utterance.voice = japaneseVoiceRef.current;
    } else {
      // 如果没有缓存，尝试实时查找
      const availableVoices = window.speechSynthesis.getVoices();
      const japaneseVoice = availableVoices.find(voice => 
        voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
      );
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
        japaneseVoiceRef.current = japaneseVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    currentVoice: japaneseVoiceRef.current,
  };
}
