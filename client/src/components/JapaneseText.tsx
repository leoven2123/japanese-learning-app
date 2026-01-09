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
 * 改进的汉字-假名对齐算法
 * 核心思路：只有平假名和片假名不加注音，其他内容（汉字、英文、数字等）都加注音
 * 每个需要注音的部分单独显示对应的注音
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
  
  // 第一步：将文本分割为不同类型的块
  type PartType = 'kanji' | 'hiragana' | 'katakana' | 'alphanumeric' | 'punct';
  interface Part {
    text: string;
    type: PartType;
  }
  
  // 基础分割
  const rawParts: Part[] = [];
  let currentText = '';
  let currentType: PartType | null = null;
  
  for (const char of text) {
    let charType: PartType;
    if (isKanjiChar(char)) {
      charType = 'kanji';
    } else if (isHiragana(char)) {
      charType = 'hiragana';
    } else if (isKatakana(char)) {
      charType = 'katakana';
    } else if (isAlphanumeric(char)) {
      charType = 'alphanumeric';
    } else {
      charType = 'punct';
    }
    
    if (currentType === null) {
      currentText = char;
      currentType = charType;
    } else if (charType === currentType) {
      currentText += char;
    } else {
      rawParts.push({ text: currentText, type: currentType });
      currentText = char;
      currentType = charType;
    }
  }
  if (currentText && currentType) {
    rawParts.push({ text: currentText, type: currentType });
  }
  
  // 第二步：合并被连字符分割的英数字块（如 J-POP → 合并为一个块）
  const parts: Part[] = [];
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    
    // 检查是否是 "alphanumeric + hyphen + alphanumeric" 模式
    if (part.type === 'alphanumeric' && 
        i + 2 < rawParts.length &&
        rawParts[i + 1].type === 'punct' &&
        isHyphen(rawParts[i + 1].text) &&
        rawParts[i + 2].type === 'alphanumeric') {
      // 合并三个部分
      parts.push({
        text: part.text + rawParts[i + 1].text + rawParts[i + 2].text,
        type: 'alphanumeric'
      });
      i += 2; // 跳过已处理的部分
    } else {
      parts.push(part);
    }
  }
  
  // 第三步：构建结果
  let keyIndex = 0;
  let readingPos = 0;
  
  // 辅助函数：在reading中查找假名位置
  function findKanaInReading(kana: string, startPos: number): number {
    // 将片假名转换为平假名进行比较
    const hiraganaKana = katakanaToHiragana(kana);
    
    for (let i = startPos; i <= reading.length - hiraganaKana.length; i++) {
      const segment = reading.substring(i, i + hiraganaKana.length);
      if (segment === hiraganaKana || segment === kana) {
        return i;
      }
    }
    return -1;
  }
  
  // 辅助函数：片假名转平假名
  function katakanaToHiragana(str: string): string {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
  }
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.type === 'punct') {
      // 标点符号直接添加
      result.push(<span key={keyIndex++}>{part.text}</span>);
    } else if (part.type === 'hiragana') {
      // 平假名部分：在reading中找到对应位置并跳过，不加注音
      const kanaInReading = findKanaInReading(part.text, readingPos);
      if (kanaInReading !== -1) {
        readingPos = kanaInReading + part.text.length;
      }
      result.push(<span key={keyIndex++}>{part.text}</span>);
    } else if (part.type === 'katakana') {
      // 片假名部分：在reading中找到对应位置并跳过，不加注音
      const kanaInReading = findKanaInReading(part.text, readingPos);
      if (kanaInReading !== -1) {
        readingPos = kanaInReading + part.text.length;
      }
      result.push(<span key={keyIndex++}>{part.text}</span>);
    } else {
      // 汉字或英数字部分：需要添加注音
      // 查找下一个假名部分作为边界
      let nextKanaPart: Part | null = null;
      for (let j = i + 1; j < parts.length; j++) {
        if (parts[j].type === 'hiragana' || parts[j].type === 'katakana') {
          nextKanaPart = parts[j];
          break;
        }
        // 如果遇到另一个需要注音的部分，停止查找
        if (parts[j].type === 'kanji' || parts[j].type === 'alphanumeric') {
          break;
        }
      }
      
      let partReading = '';
      
      if (nextKanaPart) {
        // 有后续假名，在reading中查找这个假名的位置
        const nextPos = findKanaInReading(nextKanaPart.text, readingPos);
        if (nextPos !== -1 && nextPos > readingPos) {
          partReading = reading.substring(readingPos, nextPos);
          readingPos = nextPos;
        }
      } else {
        // 没有后续假名，取剩余的reading
        partReading = reading.substring(readingPos);
        readingPos = reading.length;
      }
      
      // 渲染ruby元素
      if (partReading) {
        result.push(
          <ruby key={keyIndex++} className="japanese-ruby">
            {part.text}
            <rt>{partReading}</rt>
          </ruby>
        );
      } else {
        result.push(<span key={keyIndex++}>{part.text}</span>);
      }
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
