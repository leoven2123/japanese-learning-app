import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// 检测文本是否主要是日语
function isJapaneseText(text: string): boolean {
  // 日语字符：平假名、片假名、汉字
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
  // 如果日语字符占比超过30%，认为是日语
  return japaneseChars.length > 0 && (japaneseChars.length / text.length) > 0.3;
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
  const voicesLoadedRef = useRef(false);
  const currentResolveRef = useRef<(() => void) | null>(null);

  // 查找最佳日语语音
  const findBestJapaneseVoice = useCallback((availableVoices: SpeechSynthesisVoice[]) => {
    // 筛选日语语音
    const japaneseVoices = availableVoices.filter(voice => 
      voice.lang === 'ja-JP' || 
      voice.lang === 'ja' || 
      voice.lang.startsWith('ja-') ||
      voice.name.toLowerCase().includes('japanese')
    );
    
    if (japaneseVoices.length === 0) {
      console.warn('No Japanese voices found. Available voices:', 
        availableVoices.map(v => `${v.name} (${v.lang})`).join(', '));
      return null;
    }

    // 按优先级排序
    // 1. Google日语女声
    let bestVoice = japaneseVoices.find(v => 
      v.name.toLowerCase().includes('google') && 
      v.lang === 'ja-JP' &&
      v.name.toLowerCase().includes('female')
    );
    
    // 2. Google日语语音
    if (!bestVoice) {
      bestVoice = japaneseVoices.find(v => 
        v.name.toLowerCase().includes('google') && v.lang === 'ja-JP'
      );
    }
    
    // 3. Microsoft日语语音
    if (!bestVoice) {
      bestVoice = japaneseVoices.find(v => 
        v.name.toLowerCase().includes('microsoft') && v.lang === 'ja-JP'
      );
    }
    
    // 4. 任何ja-JP语音
    if (!bestVoice) {
      bestVoice = japaneseVoices.find(v => v.lang === 'ja-JP');
    }
    
    // 5. 任何日语语音
    if (!bestVoice) {
      bestVoice = japaneseVoices[0];
    }
    
    console.log('Selected Japanese voice:', bestVoice?.name, bestVoice?.lang);
    return bestVoice;
  }, []);

  useEffect(() => {
    // 检查浏览器是否支持Web Speech API
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    setIsSupported(true);
    
    // 加载可用的语音
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      if (availableVoices.length === 0) {
        // 语音列表尚未加载，稍后重试
        return;
      }
      
      if (voicesLoadedRef.current) {
        // 已经加载过了
        return;
      }
      
      voicesLoadedRef.current = true;
      
      const bestVoice = findBestJapaneseVoice(availableVoices);
      japaneseVoiceRef.current = bestVoice;
      
      // 保存所有日语语音供调试
      const japaneseVoices = availableVoices.filter(v => 
        v.lang.startsWith('ja') || v.name.toLowerCase().includes('japanese')
      );
      setVoices(japaneseVoices.length > 0 ? japaneseVoices : availableVoices);
      
      console.log('Available Japanese voices:', japaneseVoices.map(v => `${v.name} (${v.lang})`));
    };

    // 立即尝试加载
    loadVoices();
    
    // 监听语音列表变化
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // 某些浏览器需要延迟加载
    const timer1 = setTimeout(loadVoices, 100);
    const timer2 = setTimeout(loadVoices, 500);
    const timer3 = setTimeout(loadVoices, 1000);

    return () => {
      window.speechSynthesis?.cancel();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [findBestJapaneseVoice]);

  // speak函数返回Promise，播放完成后resolve
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported || !text) {
        console.warn('Speech not supported or no text provided');
        resolve();
        return;
      }

      // 停止当前正在播放的语音
      window.speechSynthesis.cancel();
      
      // 如果有之前的resolve，先调用它
      if (currentResolveRef.current) {
        currentResolveRef.current();
        currentResolveRef.current = null;
      }

      // 清理文本中的注音标记
      // 例如: "私(わたし)は" -> "私は"
      // 也清理方括号格式: "私[わたし]は" -> "私は"
      let cleanText = text
        .replace(/\([ぁ-んァ-ン]+\)/g, '')  // 清理圆括号注音
        .replace(/\[[ぁ-んァ-ン]+\]/g, '')   // 清理方括号注音
        .trim();

      if (!cleanText) {
        console.warn('No text to speak after cleaning');
        resolve();
        return;
      }

      // 检测文本语言
      const isJapanese = isJapaneseText(cleanText);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // 设置语言
      utterance.lang = isJapanese ? 'ja-JP' : lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // 如果是日语文本，使用日语语音
      if (isJapanese) {
        // 尝试使用缓存的日语语音
        if (japaneseVoiceRef.current) {
          utterance.voice = japaneseVoiceRef.current;
          console.log('Using cached Japanese voice:', japaneseVoiceRef.current.name);
        } else {
          // 实时查找日语语音
          const availableVoices = window.speechSynthesis.getVoices();
          const japaneseVoice = findBestJapaneseVoice(availableVoices);
          if (japaneseVoice) {
            utterance.voice = japaneseVoice;
            japaneseVoiceRef.current = japaneseVoice;
            console.log('Found Japanese voice:', japaneseVoice.name);
          } else {
            console.warn('No Japanese voice available, using default');
          }
        }
      }

      // 保存resolve函数
      currentResolveRef.current = resolve;

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Speech started:', cleanText.substring(0, 30) + '...');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Speech ended');
        if (currentResolveRef.current === resolve) {
          currentResolveRef.current = null;
        }
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        if (currentResolveRef.current === resolve) {
          currentResolveRef.current = null;
        }
        // 即使出错也resolve，避免阻塞后续播放
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, lang, rate, pitch, volume, findBestJapaneseVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      // 调用当前的resolve
      if (currentResolveRef.current) {
        currentResolveRef.current();
        currentResolveRef.current = null;
      }
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
