import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Ruby组件 - 用于显示日语汉字的振假名注音
 */

interface RubyProps {
  /** 日语汉字文本 */
  kanji: string;
  /** 假名读音 */
  reading: string;
  /** 自定义类名 */
  className?: string;
}

export function Ruby({ kanji, reading, className = "" }: RubyProps) {
  return (
    <ruby className={`ruby-text ${className}`}>
      {kanji}
      <rt className="ruby-annotation">{reading}</rt>
    </ruby>
  );
}

/**
 * 自动解析日语文本并添加振假名
 */

interface AutoRubyProps {
  /** 带有振假名标记的日语文本 */
  text: string;
  /** 自定义类名 */
  className?: string;
}

// 检查字符是否是汉字
function isKanjiChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

// 检查文本是否包含汉字
function hasKanji(text: string): boolean {
  for (const char of text) {
    if (isKanjiChar(char)) return true;
  }
  return false;
}

// 检查字符是否是假名（平假名或片假名）
function isKana(char: string): boolean {
  const code = char.charCodeAt(0);
  // 平假名: 0x3040-0x309F, 片假名: 0x30A0-0x30FF
  return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
}

// 检查字符是否是日语标点符号或特殊字符
function isPunctuation(char: string): boolean {
  const punctuations = '「」『』（）()【】〈〉《》。、！？!?・…―ー～〜';
  return punctuations.includes(char);
}

// 检查文本是否已有注音标记
function hasRubyMarkers(text: string): boolean {
  // 方括号格式: 漢字[かんじ] 或 圆括号格式: 漢字(かんじ)
  return /[\u4e00-\u9faf\u3400-\u4dbf]+[\[\(][ぁ-んァ-ン]+[\]\)]/.test(text);
}

// 解析带注音标记的文本
function parseRubyText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // 匹配 汉字[假名] 或 汉字(假名) 格式
  const regex = /([\u4e00-\u9faf\u3400-\u4dbf]+)[\[\(]([ぁ-んァ-ン]+)[\]\)]/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // 添加匹配之前的普通文本
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyIndex++}`}>{text.substring(lastIndex, match.index)}</span>);
    }

    // 添加Ruby标注
    parts.push(
      <Ruby key={`ruby-${keyIndex++}`} kanji={match[1]} reading={match[2]} />
    );

    lastIndex = regex.lastIndex;
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${keyIndex++}`}>{text.substring(lastIndex)}</span>);
  }

  return parts;
}

export function AutoRuby({ text, className = "" }: AutoRubyProps) {
  const [rubyText, setRubyText] = useState<string>(text);
  const [isLoading, setIsLoading] = useState(false);
  
  // 获取读音的mutation
  const getReadingMutation = trpc.ai.getReading.useMutation();

  useEffect(() => {
    // 如果文本已有注音标记，直接使用
    if (hasRubyMarkers(text)) {
      setRubyText(text);
      return;
    }
    
    // 如果文本包含汉字但没有注音标记，调用API获取
    if (hasKanji(text) && !isLoading) {
      setIsLoading(true);
      getReadingMutation.mutate(
        { text },
        {
          onSuccess: (data) => {
            if (data?.reading && data.reading !== text) {
              // API返回的是纯假名，需要构建注音格式
              const annotatedText = buildRubyText(text, data.reading);
              setRubyText(annotatedText);
            }
            setIsLoading(false);
          },
          onError: () => {
            setIsLoading(false);
          }
        }
      );
    }
  }, [text]);

  // 如果有注音标记，解析并渲染
  if (hasRubyMarkers(rubyText)) {
    return <span className={`auto-ruby ${className}`}>{parseRubyText(rubyText)}</span>;
  }

  // 否则直接显示文本
  return <span className={`auto-ruby ${className}`}>{rubyText}</span>;
}

// 检查字符是否是平假名
function isHiragana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309f;
}

// 检查字符是否是片假名
function isKatakana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

/**
 * 改进的汉字-假名对齐算法
 * 核心思路：只对汉字添加注音，平假名和片假名都不加注音
 */
function buildRubyText(original: string, reading: string): string {
  // 如果原文没有汉字，直接返回
  if (!hasKanji(original)) {
    return original;
  }

  // 将原文分割为四类：汉字块、平假名块、片假名块、标点块
  type PartType = 'kanji' | 'hiragana' | 'katakana' | 'punct';
  interface Part {
    text: string;
    type: PartType;
  }
  
  const parts: Part[] = [];
  let currentText = '';
  let currentType: PartType | null = null;
  
  for (const char of original) {
    let charType: PartType;
    if (isKanjiChar(char)) {
      charType = 'kanji';
    } else if (isHiragana(char)) {
      charType = 'hiragana';
    } else if (isKatakana(char)) {
      charType = 'katakana';
    } else {
      charType = 'punct';
    }
    
    if (currentType === null) {
      currentText = char;
      currentType = charType;
    } else if (charType === currentType) {
      currentText += char;
    } else {
      parts.push({ text: currentText, type: currentType });
      currentText = char;
      currentType = charType;
    }
  }
  if (currentText && currentType) {
    parts.push({ text: currentText, type: currentType });
  }

  // 构建结果
  let result = '';
  let readingPos = 0;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.type === 'punct') {
      // 标点符号直接添加，不影响reading位置
      result += part.text;
    } else if (part.type === 'hiragana') {
      // 平假名部分：在reading中找到对应位置并跳过，不加注音
      const kanaInReading = findKanaInReading(reading, part.text, readingPos);
      if (kanaInReading !== -1) {
        readingPos = kanaInReading + part.text.length;
      }
      result += part.text;
    } else if (part.type === 'katakana') {
      // 片假名部分：在reading中找到对应位置并跳过，不加注音
      const kanaInReading = findKanaInReading(reading, part.text, readingPos);
      if (kanaInReading !== -1) {
        readingPos = kanaInReading + part.text.length;
      }
      result += part.text;
    } else {
      // 汉字部分：找到下一个假名部分作为边界
      let nextKanaPart: Part | null = null;
      for (let j = i + 1; j < parts.length; j++) {
        if (parts[j].type === 'hiragana' || parts[j].type === 'katakana') {
          nextKanaPart = parts[j];
          break;
        }
      }
      
      let kanjiReading = '';
      
      if (nextKanaPart) {
        // 在reading中查找下一个假名部分的位置
        const nextPos = findKanaInReading(reading, nextKanaPart.text, readingPos);
        if (nextPos !== -1 && nextPos > readingPos) {
          kanjiReading = reading.substring(readingPos, nextPos);
          readingPos = nextPos;
        }
      } else {
        // 没有后续假名，取剩余的reading
        kanjiReading = reading.substring(readingPos);
        readingPos = reading.length;
      }
      
      // 验证读音是否有效
      if (kanjiReading && isValidReading(kanjiReading)) {
        result += `${part.text}(${kanjiReading})`;
      } else {
        result += part.text;
      }
    }
  }
  
  return result;
}

/**
 * 在reading中查找假名序列的位置
 * 支持平假名和片假名的互相匹配
 */
function findKanaInReading(reading: string, target: string, startPos: number): number {
  // 将目标转换为平假名进行比较
  const targetHiragana = toHiragana(target);
  
  for (let i = startPos; i <= reading.length - target.length; i++) {
    const readingHiragana = toHiragana(reading.substring(i, i + target.length));
    if (readingHiragana === targetHiragana) {
      return i;
    }
  }
  
  return -1;
}

/**
 * 将片假名转换为平假名
 */
function toHiragana(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    // 片假名范围: 0x30A1-0x30F6 -> 平假名: 0x3041-0x3096
    if (code >= 0x30a1 && code <= 0x30f6) {
      result += String.fromCharCode(code - 0x60);
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 检查是否是有效的假名读音
 */
function isValidReading(reading: string): boolean {
  // 只包含平假名、片假名和长音符号
  for (const char of reading) {
    if (!isKana(char) && char !== 'ー' && char !== '・') {
      return false;
    }
  }
  return reading.length > 0;
}

/**
 * 从词汇数据生成带振假名的显示
 */

interface VocabRubyProps {
  /** 日语表达(可能包含汉字) */
  expression: string;
  /** 假名读音 */
  reading: string;
  /** 自定义类名 */
  className?: string;
}

export function VocabRuby({ expression, reading, className = "" }: VocabRubyProps) {
  // 如果expression和reading相同,说明没有汉字,直接显示
  if (expression === reading) {
    return <span className={className}>{expression}</span>;
  }

  // 如果expression只包含假名(没有汉字),直接显示
  if (!hasKanji(expression)) {
    return <span className={className}>{expression}</span>;
  }

  // 有汉字,使用Ruby标注
  return <Ruby kanji={expression} reading={reading} className={className} />;
}

/**
 * 简单的Ruby组件 - 直接显示汉字和读音
 */
export function SimpleRuby({ text, reading }: { text: string; reading: string }) {
  if (!hasKanji(text)) {
    return <span>{text}</span>;
  }
  
  return <Ruby kanji={text} reading={reading} />;
}
