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

// 检测单个字符是否是汉字
function isKanjiChar(char: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
}

// 检测是否是假名
function isKana(char: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(char);
}

// 检测是否是标点符号或特殊字符
function isPunctuation(char: string): boolean {
  return /[。、！？「」『』（）・…～\s.,!?()[\]{}:;'"〜]/.test(char);
}

// 检测是否是平假名
function isHiragana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309f;
}

// 检测是否是片假名
function isKatakana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

// 检测是否是英数字
function isAlphanumeric(char: string): boolean {
  return /[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]/.test(char);
}

// 检测是否是连字符（用于合并英文单词如J-POP）
function isHyphen(char: string): boolean {
  return /[-ー]/.test(char);
}

/**
 * 按标点分词后数组一一对应的注音算法
 * 核心思路：
 * 1. 按标点符号分词，得到两个数组
 * 2. 数组元素一一对应处理
 * 3. 在每个段落内部，使用假名边界来分配reading
 */
function alignKanjiWithReading(text: string, reading: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  
  // 如果没有汉字且没有英文数字,直接返回原文本
  if (!hasKanji(text) && !/[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]/.test(text)) {
    return [<span key="0">{text}</span>];
  }
  
  // 如果没有读音,直接返回原文本
  if (!reading) {
    return [<span key="0">{text}</span>];
  }
  
  // 按标点符号分词
  const originalSegments: string[] = [];
  const readingSegments: string[] = [];
  
  let currentSeg = '';
  for (const char of text) {
    if (isKana(char) || isKanjiChar(char) || isAlphanumeric(char) || isHyphen(char)) {
      currentSeg += char;
    } else {
      if (currentSeg) {
        originalSegments.push(currentSeg);
        currentSeg = '';
      }
      originalSegments.push(char); // 标点单独作为一个元素
    }
  }
  if (currentSeg) {
    originalSegments.push(currentSeg);
  }
  
  // 同样处理reading
  currentSeg = '';
  for (const char of reading) {
    if (isKana(char) || isKanjiChar(char) || isAlphanumeric(char) || isHyphen(char)) {
      currentSeg += char;
    } else {
      if (currentSeg) {
        readingSegments.push(currentSeg);
        currentSeg = '';
      }
      readingSegments.push(char);
    }
  }
  if (currentSeg) {
    readingSegments.push(currentSeg);
  }
  
  // 第三步：数组一一对应处理
  let keyIndex = 0;
  
  // 辅助函数：片假名转平假名
  function katakanaToHiragana(str: string): string {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
  }
  
  // 辅助函数：在reading中查找假名位置
  function findKanaInReading(segReading: string, kana: string, startPos: number): number {
    const hiraganaKana = katakanaToHiragana(kana);
    for (let i = startPos; i <= segReading.length - hiraganaKana.length; i++) {
      const segment = katakanaToHiragana(segReading.substring(i, i + hiraganaKana.length));
      if (segment === hiraganaKana) {
        return i;
      }
    }
    return -1;
  }
  
  // 处理单个段落
  function processSegment(origSeg: string, readSeg: string): React.ReactNode[] {
    const segResult: React.ReactNode[] = [];
    if (!hasKanji(origSeg)) {
      segResult.push(<span key={keyIndex++}>{origSeg}</span>);
      return segResult;
    }
    
    let segReadingPos = 0;
    let i = 0;
    
    while (i < origSeg.length) {
      const char = origSeg[i];
      
      if (isKana(char)) {
        const kanaPos = findKanaInReading(readSeg, char, segReadingPos);
        if (kanaPos !== -1) {
          segReadingPos = kanaPos + 1;
        }
        segResult.push(<span key={keyIndex++}>{char}</span>);
        i++;
      } else if (isKanjiChar(char)) {
        let kanjiBlock = char;
        let j = i + 1;
        while (j < origSeg.length && isKanjiChar(origSeg[j])) {
          kanjiBlock += origSeg[j];
          j++;
        }
        
        let nextKana = '';
        let nextKanaPos = j;
        while (nextKanaPos < origSeg.length && !isKana(origSeg[nextKanaPos])) {
          nextKanaPos++;
        }
        if (nextKanaPos < origSeg.length) {
          nextKana = origSeg[nextKanaPos];
        }
        
        let kanjiReading = '';
        if (nextKana) {
          const nextPos = findKanaInReading(readSeg, nextKana, segReadingPos);
          if (nextPos !== -1 && nextPos > segReadingPos) {
            kanjiReading = readSeg.substring(segReadingPos, nextPos);
            segReadingPos = nextPos;
          }
        } else {
          kanjiReading = readSeg.substring(segReadingPos);
          segReadingPos = readSeg.length;
        }
        
        if (kanjiReading) {
          segResult.push(
            <ruby key={keyIndex++} className="japanese-ruby">
              {kanjiBlock}
              <rt>{kanjiReading}</rt>
            </ruby>
          );
        } else {
          segResult.push(<span key={keyIndex++}>{kanjiBlock}</span>);
        }
        
        i = j;
      } else {
        segResult.push(<span key={keyIndex++}>{char}</span>);
        i++;
      }
    }
    
    return segResult;
  }
  
  for (let i = 0; i < originalSegments.length; i++) {
    const origSeg = originalSegments[i];
    const readSeg = readingSegments[i] || '';
    
    if (origSeg.length === 1 && !isKana(origSeg) && !isKanjiChar(origSeg)) {
      result.push(<span key={keyIndex++}>{origSeg}</span>);
    } else {
      result.push(...processSegment(origSeg, readSeg));
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
  // 如果没有汉字或没有读音,直接返回文本
  if (!hasKanji(text) || !reading) {
    return <span className={`japanese-text ${className}`}>{text}</span>;
  }
  
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
