import { useState, useCallback, useEffect } from 'react';

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

  useEffect(() => {
    // 检查浏览器是否支持Web Speech API
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // 加载可用的语音
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const japaneseVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('ja')
        );
        setVoices(japaneseVoices.length > 0 ? japaneseVoices : availableVoices);
      };

      loadVoices();
      
      // 某些浏览器需要异步加载语音列表
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // 优先使用日语语音
    const japaneseVoice = voices.find(voice => voice.lang.startsWith('ja'));
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang, rate, pitch, volume, voices]);

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
  };
}
