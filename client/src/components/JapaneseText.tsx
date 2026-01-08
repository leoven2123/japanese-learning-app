import React, { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

/**
 * JapaneseText组件 - 自动为日语汉字添加振假名注音
 * 
 * 使用方式:
 * <JapaneseText>日本語を学ぶ</JapaneseText>
 * 
 * 组件会自动检测文本中的汉字并通过API获取读音,然后显示带注音的文本
 */

interface JapaneseTextProps {
  children: string;
  className?: string;
  /** 是否显示注音,默认true */
  showFurigana?: boolean;
  /** 已知的读音(可选),格式: "にほんごをまなぶ" */
  reading?: string;
}

// 缓存已获取的读音
const readingCache = new Map<string, string>();

// 检测文本是否包含汉字
function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// 检测是否是假名
function isKana(char: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(char);
}

// 简单的汉字-假名对齐算法
function alignKanjiWithReading(text: string, reading: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  
  // 如果没有汉字,直接返回原文本
  if (!hasKanji(text)) {
    return [<span key="0">{text}</span>];
  }
  
  // 如果没有读音,直接返回原文本
  if (!reading) {
    return [<span key="0">{text}</span>];
  }
  
  // 尝试智能对齐
  let textIndex = 0;
  let readingIndex = 0;
  let keyIndex = 0;
  
  while (textIndex < text.length) {
    const char = text[textIndex];
    
    // 如果是假名,直接添加
    if (isKana(char)) {
      // 跳过reading中对应的假名
      if (readingIndex < reading.length && reading[readingIndex] === char) {
        readingIndex++;
      }
      result.push(<span key={keyIndex++}>{char}</span>);
      textIndex++;
      continue;
    }
    
    // 如果是汉字,找到连续的汉字块
    let kanjiBlock = "";
    while (textIndex < text.length && !isKana(text[textIndex]) && hasKanji(text[textIndex])) {
      kanjiBlock += text[textIndex];
      textIndex++;
    }
    
    if (kanjiBlock) {
      // 找到下一个假名在reading中的位置
      let nextKanaInText = "";
      if (textIndex < text.length && isKana(text[textIndex])) {
        nextKanaInText = text[textIndex];
      }
      
      // 从reading中提取对应的读音
      let kanjiReading = "";
      if (nextKanaInText) {
        // 找到reading中下一个匹配假名的位置
        const nextKanaPos = reading.indexOf(nextKanaInText, readingIndex);
        if (nextKanaPos > readingIndex) {
          kanjiReading = reading.substring(readingIndex, nextKanaPos);
          readingIndex = nextKanaPos;
        } else {
          // 无法对齐,使用剩余的reading
          kanjiReading = reading.substring(readingIndex);
          readingIndex = reading.length;
        }
      } else {
        // 没有下一个假名,使用剩余的reading
        kanjiReading = reading.substring(readingIndex);
        readingIndex = reading.length;
      }
      
      result.push(
        <ruby key={keyIndex++} className="japanese-ruby">
          {kanjiBlock}
          <rt>{kanjiReading}</rt>
        </ruby>
      );
    }
    
    // 处理其他字符(标点、数字等)
    if (textIndex < text.length && !isKana(text[textIndex]) && !hasKanji(text[textIndex])) {
      result.push(<span key={keyIndex++}>{text[textIndex]}</span>);
      textIndex++;
    }
  }
  
  return result;
}

export function JapaneseText({ 
  children, 
  className = "", 
  showFurigana = true,
  reading: providedReading 
}: JapaneseTextProps) {
  const text = children;
  const [reading, setReading] = useState<string | null>(providedReading || null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 获取读音的mutation
  const getReading = trpc.ai.getReading.useMutation();
  
  // 检查是否需要获取读音
  const needsReading = useMemo(() => {
    return showFurigana && hasKanji(text) && !providedReading && !readingCache.has(text);
  }, [text, showFurigana, providedReading]);
  
  useEffect(() => {
    // 如果已有提供的读音,使用它
    if (providedReading) {
      setReading(providedReading);
      return;
    }
    
    // 如果缓存中有,使用缓存
    if (readingCache.has(text)) {
      setReading(readingCache.get(text)!);
      return;
    }
    
    // 如果不需要读音(没有汉字或不显示注音),跳过
    if (!needsReading) {
      return;
    }
    
    // 获取读音
    setIsLoading(true);
    getReading.mutateAsync({ text })
      .then((result: { reading: string }) => {
        readingCache.set(text, result.reading);
        setReading(result.reading);
      })
      .catch(() => {
        // 获取失败,不显示注音
        setReading(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [text, providedReading, needsReading]);
  
  // 如果不显示注音或没有汉字,直接返回文本
  if (!showFurigana || !hasKanji(text)) {
    return <span className={`japanese-text ${className}`}>{text}</span>;
  }
  
  // 如果正在加载,显示原文本
  if (isLoading || !reading) {
    return <span className={`japanese-text ${className}`}>{text}</span>;
  }
  
  // 渲染带注音的文本
  const elements = alignKanjiWithReading(text, reading);
  
  return (
    <span className={`japanese-text-with-ruby ${className}`}>
      {elements}
    </span>
  );
}

/**
 * 静态版本 - 用于已知读音的情况,不需要API调用
 */
interface StaticJapaneseTextProps {
  text: string;
  reading: string;
  className?: string;
}

export function StaticJapaneseText({ text, reading, className = "" }: StaticJapaneseTextProps) {
  const elements = alignKanjiWithReading(text, reading);
  
  return (
    <span className={`japanese-text-with-ruby ${className}`}>
      {elements}
    </span>
  );
}

/**
 * 简单版本 - 整个文本使用一个注音
 */
interface SimpleRubyProps {
  text: string;
  reading: string;
  className?: string;
}

export function SimpleRuby({ text, reading, className = "" }: SimpleRubyProps) {
  // 如果没有汉字,直接返回文本
  if (!hasKanji(text)) {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <ruby className={`japanese-ruby ${className}`}>
      {text}
      <rt>{reading}</rt>
    </ruby>
  );
}
