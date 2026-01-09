import { useState, useEffect } from "react";
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
  
  // 获取读音的mutation
  const getReadingMutation = trpc.ai.getReading.useMutation();

  useEffect(() => {
    // 重置状态
    setRubyText(text);
    
    // 如果文本已有注音标记，直接使用
    if (hasRubyMarkers(text)) {
      return;
    }
    
    // 如果文本包含汉字但没有注音标记，调用API获取
    if (hasKanji(text)) {
      getReadingMutation.mutate(
        { text },
        {
          onSuccess: (data) => {
            if (data?.reading && data.reading !== text) {
              // API返回的reading保留了标点符号，构建注音格式
              const annotatedText = buildRubyText(text, data.reading);
              setRubyText(annotatedText);
            }
          },
          onError: (error) => {
            console.error('Failed to get reading:', error);
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

/**
 * 按标点分词后数组一一对应的注音算法
 * 核心思路：
 * 1. 后端API返回的reading保留标点符号
 * 2. 前端按标点分词，得到两个数组
 * 3. 数组元素一一对应处理
 */
function buildRubyText(original: string, reading: string): string {
  if (!hasKanji(original)) {
    return original;
  }

  // 按标点符号分词
  const originalSegments = splitByPunctuation(original);
  const readingSegments = splitByPunctuation(reading);

  // 数组一一对应处理
  let result = '';
  for (let i = 0; i < originalSegments.length; i++) {
    const origSeg = originalSegments[i];
    const readSeg = readingSegments[i] || '';

    // 判断是否是标点
    if (origSeg.length === 1 && !isKana(origSeg) && !isKanjiChar(origSeg)) {
      // 标点直接添加
      result += origSeg;
    } else {
      // 非标点，处理注音
      result += processSegment(origSeg, readSeg);
    }
  }

  return result;
}

// 按标点符号分词
function splitByPunctuation(text: string): string[] {
  const segments: string[] = [];
  let current = '';

  for (const char of text) {
    if (isKana(char) || isKanjiChar(char)) {
      current += char;
    } else {
      if (current) {
        segments.push(current);
        current = '';
      }
      segments.push(char); // 标点单独作为一个元素
    }
  }
  if (current) {
    segments.push(current);
  }

  return segments;
}

// 处理单个段落的注音
function processSegment(originalSeg: string, readingSeg: string): string {
  if (!hasKanji(originalSeg)) {
    // 纯假名，不需要注音
    return originalSeg;
  }

  let result = '';
  let readingPos = 0;
  let i = 0;

  while (i < originalSeg.length) {
    const char = originalSeg[i];

    if (isKana(char)) {
      // 假名：在reading中找到对应位置并跳过
      const kanaPos = findKanaInReading(readingSeg, char, readingPos);
      if (kanaPos !== -1) {
        readingPos = kanaPos + 1;
      }
      result += char;
      i++;
    } else if (isKanjiChar(char)) {
      // 汉字：收集连续的汉字块
      let kanjiBlock = char;
      let j = i + 1;
      while (j < originalSeg.length && isKanjiChar(originalSeg[j])) {
        kanjiBlock += originalSeg[j];
        j++;
      }

      // 查找下一个假名作为边界
      let nextKana = '';
      let nextKanaPos = j;
      while (nextKanaPos < originalSeg.length && !isKana(originalSeg[nextKanaPos])) {
        nextKanaPos++;
      }
      if (nextKanaPos < originalSeg.length) {
        nextKana = originalSeg[nextKanaPos];
      }

      let kanjiReading = '';
      if (nextKana) {
        // 有下一个假名，找到它在reading中的位置
        const nextPos = findKanaInReading(readingSeg, nextKana, readingPos);
        if (nextPos !== -1 && nextPos > readingPos) {
          kanjiReading = readingSeg.substring(readingPos, nextPos);
          readingPos = nextPos;
        }
      } else {
        // 没有下一个假名，取剩余的reading
        kanjiReading = readingSeg.substring(readingPos);
        readingPos = readingSeg.length;
      }

      if (kanjiReading && isValidReading(kanjiReading)) {
        result += kanjiBlock + '(' + kanjiReading + ')';
      } else {
        result += kanjiBlock;
      }

      i = j;
    } else {
      result += char;
      i++;
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

  // 使用buildRubyText生成带注音的文本
  const rubyText = buildRubyText(expression, reading);

  // 如果有注音标记，解析并渲染
  if (hasRubyMarkers(rubyText)) {
    return <span className={`vocab-ruby ${className}`}>{parseRubyText(rubyText)}</span>;
  }

  // 否则直接显示
  return <span className={className}>{rubyText}</span>;
}
