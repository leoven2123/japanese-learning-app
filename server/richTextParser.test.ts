import { describe, it, expect } from 'vitest';

/**
 * 解析带有 {{JP}}...{{/JP}} 标记的文本
 * 返回文本片段数组
 */
interface TextSegment {
  type: 'text' | 'japanese';
  content: string;
}

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
    
    // 添加日语内容
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
  
  return segments;
}

describe('RichTextWithJapanese Parser', () => {
  describe('parseJapaneseMarkers', () => {
    it('should return original text when no markers present', () => {
      const text = '这是一段普通的中文文本';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'text', content: text });
    });

    it('should parse single Japanese marker', () => {
      const text = '这是「{{JP}}はじめまして{{/JP}}」的用法';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: '这是「' });
      expect(result[1]).toEqual({ type: 'japanese', content: 'はじめまして' });
      expect(result[2]).toEqual({ type: 'text', content: '」的用法' });
    });

    it('should parse multiple Japanese markers', () => {
      const text = '{{JP}}こんにちは{{/JP}}是白天问候，{{JP}}こんばんは{{/JP}}是晚上问候';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ type: 'japanese', content: 'こんにちは' });
      expect(result[1]).toEqual({ type: 'text', content: '是白天问候，' });
      expect(result[2]).toEqual({ type: 'japanese', content: 'こんばんは' });
      expect(result[3]).toEqual({ type: 'text', content: '是晚上问候' });
    });

    it('should handle Japanese marker at the beginning', () => {
      const text = '{{JP}}おはよう{{/JP}}是早上好的意思';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'japanese', content: 'おはよう' });
      expect(result[1]).toEqual({ type: 'text', content: '是早上好的意思' });
    });

    it('should handle Japanese marker at the end', () => {
      const text = '晚安的日语是{{JP}}おやすみなさい{{/JP}}';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', content: '晚安的日语是' });
      expect(result[1]).toEqual({ type: 'japanese', content: 'おやすみなさい' });
    });

    it('should handle only Japanese marker', () => {
      const text = '{{JP}}ありがとうございます{{/JP}}';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'japanese', content: 'ありがとうございます' });
    });

    it('should trim whitespace in Japanese content', () => {
      const text = '这是{{JP}}  すみません  {{/JP}}的用法';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({ type: 'japanese', content: 'すみません' });
    });

    it('should handle complex mixed content', () => {
      const text = '在日本，{{JP}}はじめまして{{/JP}}（初次见面）和{{JP}}よろしくお願いします{{/JP}}（请多关照）是初次见面时的常用表达。';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ type: 'text', content: '在日本，' });
      expect(result[1]).toEqual({ type: 'japanese', content: 'はじめまして' });
      expect(result[2]).toEqual({ type: 'text', content: '（初次见面）和' });
      expect(result[3]).toEqual({ type: 'japanese', content: 'よろしくお願いします' });
      expect(result[4]).toEqual({ type: 'text', content: '（请多关照）是初次见面时的常用表达。' });
    });

    it('should handle empty Japanese marker', () => {
      const text = '这是{{JP}}{{/JP}}空的标记';
      const result = parseJapaneseMarkers(text);
      
      // Empty markers should be ignored
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', content: '这是' });
      expect(result[1]).toEqual({ type: 'text', content: '空的标记' });
    });

    it('should handle Japanese with kanji and reading', () => {
      const text = '{{JP}}初対面{{/JP}}（しょたいめん）表示第一次见面';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'japanese', content: '初対面' });
      expect(result[1]).toEqual({ type: 'text', content: '（しょたいめん）表示第一次见面' });
    });

    it('should handle multiline Japanese content', () => {
      const text = '例句：{{JP}}今日は\nいい天気ですね{{/JP}}';
      const result = parseJapaneseMarkers(text);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', content: '例句：' });
      expect(result[1]).toEqual({ type: 'japanese', content: '今日は\nいい天気ですね' });
    });
  });
});
