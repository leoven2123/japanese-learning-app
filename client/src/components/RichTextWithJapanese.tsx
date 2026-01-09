import { useMemo } from "react";
import { TranslatableText } from "@/components/TranslatableText";

interface RichTextWithJapaneseProps {
  /** 包含 {{JP}}...{{/JP}} 标记的文本 */
  text: string;
  /** 自定义类名 */
  className?: string;
}

interface TextSegment {
  type: 'text' | 'japanese';
  content: string;
}

/**
 * 解析带有 {{JP}}...{{/JP}} 标记的文本
 * 返回文本片段数组
 */
function parseJapaneseMarkers(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\{\{JP\}\}([\s\S]*?)\{\{\/JP\}\}/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // 添加标记前的普通文本
    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index);
      if (plainText) {
        segments.push({ type: 'text', content: plainText });
      }
    }
    
    // 添加日语内容（移除标记，只保留内容）
    const japaneseContent = match[1].trim();
    if (japaneseContent) {
      segments.push({ type: 'japanese', content: japaneseContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // 添加最后一段普通文本
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      segments.push({ type: 'text', content: remainingText });
    }
  }
  
  // 如果没有找到任何标记，返回原文作为普通文本
  if (segments.length === 0 && text) {
    segments.push({ type: 'text', content: text });
  }
  
  return segments;
}

/**
 * 富文本组件，支持日语部分的hover翻译
 * 
 * 使用方式：
 * <RichTextWithJapanese text="这是「{{JP}}はじめまして{{/JP}}」的用法" />
 * 
 * 日语部分会被包裹在TranslatableText组件中，支持hover翻译
 * {{JP}}和{{/JP}}标记不会显示在页面上，只用于识别日语部分
 */
export function RichTextWithJapanese({ text, className }: RichTextWithJapaneseProps) {
  const segments = useMemo(() => parseJapaneseMarkers(text || ''), [text]);
  
  // 如果没有日语标记，直接返回原文本
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'japanese') {
          // 日语部分使用TranslatableText组件，支持hover翻译
          return (
            <TranslatableText
              key={index}
              text={segment.content}
              showRuby={true}
              className="inline"
            />
          );
        }
        // 普通文本直接显示
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}

export { parseJapaneseMarkers };
