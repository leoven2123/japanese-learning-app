import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Ruby组件 - 用于显示日语汉字的振假名注音
 * 
 * @example
 * <Ruby kanji="日本語" reading="にほんご" />
 * 
 * 渲染为:
 * <ruby>
 *   日本語
 *   <rt>にほんご</rt>
 * </ruby>
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
 * 
 * 支持两种格式:
 * 1. 方括号格式: "日本語[にほんご]を学[まな]ぶ"
 * 2. 圆括号格式: "日本語(にほんご)を学(まな)ぶ"
 * 
 * 如果文本不包含注音标记但包含汉字，会自动调用API获取读音
 */

interface AutoRubyProps {
  /** 带有振假名标记的日语文本 */
  text: string;
  /** 自定义类名 */
  className?: string;
}

// 检查文本是否包含汉字
function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// 检查文本是否已有注音标记
function hasRubyMarkers(text: string): boolean {
  // 方括号格式: 漢字[かんじ]
  // 圆括号格式: 漢字(かんじ) - 括号内必须是假名
  return /[\u4e00-\u9faf\u3400-\u4dbf]+[\[\(][ぁ-んァ-ン]+[\]\)]/.test(text);
}

// 解析带注音标记的文本
function parseRubyText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // 匹配 汉字[假名] 或 汉字(假名) 格式
  // 汉字部分必须是汉字，假名部分必须是平假名或片假名
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
              // 这里我们使用一个简单的方法：为每个汉字词组添加注音
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

/**
 * 尝试将原文和读音对齐，生成带注音的文本
 * 这是一个简化版本，对于复杂情况可能不够准确
 */
function buildRubyText(original: string, reading: string): string {
  // 如果原文没有汉字，直接返回
  if (!hasKanji(original)) {
    return original;
  }

  // 简单策略：找出汉字部分，用读音中对应的假名替换
  // 这需要更复杂的算法，这里使用简化版本
  
  // 分割原文为汉字块和非汉字块
  const parts: { text: string; isKanji: boolean }[] = [];
  let currentPart = "";
  let currentIsKanji = false;
  
  for (const char of original) {
    const charIsKanji = hasKanji(char);
    if (currentPart === "" || charIsKanji === currentIsKanji) {
      currentPart += char;
      currentIsKanji = charIsKanji;
    } else {
      parts.push({ text: currentPart, isKanji: currentIsKanji });
      currentPart = char;
      currentIsKanji = charIsKanji;
    }
  }
  if (currentPart) {
    parts.push({ text: currentPart, isKanji: currentIsKanji });
  }

  // 尝试从reading中提取对应的假名
  let readingIndex = 0;
  let result = "";
  
  for (const part of parts) {
    if (!part.isKanji) {
      // 非汉字部分，尝试在reading中找到对应位置
      const partInReading = reading.indexOf(part.text, readingIndex);
      if (partInReading !== -1) {
        // 汉字部分的读音是从上次位置到这个位置
        if (partInReading > readingIndex && result.length > 0) {
          // 需要回溯添加读音
        }
        readingIndex = partInReading + part.text.length;
      }
      result += part.text;
    } else {
      // 汉字部分，需要添加读音
      // 找到下一个非汉字部分在reading中的位置
      const nextNonKanji = parts[parts.indexOf(part) + 1];
      let kanjiReading = "";
      
      if (nextNonKanji && !nextNonKanji.isKanji) {
        const nextPos = reading.indexOf(nextNonKanji.text, readingIndex);
        if (nextPos !== -1) {
          kanjiReading = reading.substring(readingIndex, nextPos);
          readingIndex = nextPos;
        }
      } else {
        // 最后一个部分或下一个也是汉字
        kanjiReading = reading.substring(readingIndex);
        readingIndex = reading.length;
      }
      
      if (kanjiReading) {
        result += `${part.text}(${kanjiReading})`;
      } else {
        result += part.text;
      }
    }
  }
  
  return result;
}

/**
 * 从词汇数据生成带振假名的显示
 * 
 * 如果有expression(汉字)和reading(假名),自动生成Ruby标注
 * 如果只有假名,直接显示假名
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
 * 用于已知汉字和读音的情况
 */
export function SimpleRuby({ text, reading }: { text: string; reading: string }) {
  if (!hasKanji(text)) {
    return <span>{text}</span>;
  }
  
  return <Ruby kanji={text} reading={reading} />;
}
