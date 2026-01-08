import React from "react";

interface RubyTextProps {
  text: string;
  reading: string;
  className?: string;
}

/**
 * RubyText组件 - 用于显示带注音的日语文本
 * 
 * 支持两种格式:
 * 1. 简单格式: text="日本語" reading="にほんご"
 * 2. 详细格式: text="日本語を学ぶ" reading="にほん|ご|を|まな|ぶ"
 * 
 * 组件会自动解析并为每个汉字或词组添加对应的假名注音
 */
export function RubyText({ text, reading, className = "" }: RubyTextProps) {
  // 如果reading包含分隔符,说明是详细格式
  const hasDetailedReading = reading.includes("|");
  
  if (!hasDetailedReading) {
    // 简单格式:整个文本使用一个注音
    return (
      <ruby className={`japanese-ruby ${className}`}>
        {text}
        <rt>{reading}</rt>
      </ruby>
    );
  }
  
  // 详细格式:解析文本和注音的对应关系
  const readings = reading.split("|");
  const chars = text.split("");
  
  // 如果readings数量和chars数量不匹配,降级为简单格式
  if (readings.length !== chars.length) {
    return (
      <ruby className={`japanese-ruby ${className}`}>
        {text}
        <rt>{reading.replace(/\|/g, "")}</rt>
      </ruby>
    );
  }
  
  return (
    <span className={`japanese-ruby-group ${className}`}>
      {chars.map((char, index) => {
        const charReading = readings[index];
        
        // 如果是平假名或片假名,不需要注音
        if (/^[\u3040-\u309F\u30A0-\u30FF]$/.test(char)) {
          return <span key={index} className="kana">{char}</span>;
        }
        
        // 汉字需要注音
        return (
          <ruby key={index} className="kanji-ruby">
            {char}
            <rt>{charReading}</rt>
          </ruby>
        );
      })}
    </span>
  );
}

/**
 * 解析日语文本并自动添加注音
 * 这个函数用于将"日本語(にほんご)"格式的文本转换为RubyText组件
 */
export function parseJapaneseWithReading(textWithReading: string): React.ReactNode {
  // 匹配格式: 汉字(假名)
  const regex = /([一-龯々〆ヵヶ]+)\(([ぁ-んァ-ヶー]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(textWithReading)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      parts.push(textWithReading.substring(lastIndex, match.index));
    }
    
    // 添加带注音的文本
    parts.push(
      <RubyText 
        key={match.index} 
        text={match[1]} 
        reading={match[2]} 
      />
    );
    
    lastIndex = regex.lastIndex;
  }
  
  // 添加剩余的文本
  if (lastIndex < textWithReading.length) {
    parts.push(textWithReading.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : textWithReading;
}
