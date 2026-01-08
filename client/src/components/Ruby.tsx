import React from "react";

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
 * 输入格式: "日本語[にほんご]を学[まな]ぶ"
 * 输出: 带有ruby标签的React元素
 */

interface AutoRubyProps {
  /** 带有振假名标记的日语文本,格式: 汉字[假名] */
  text: string;
  /** 自定义类名 */
  className?: string;
}

export function AutoRuby({ text, className = "" }: AutoRubyProps) {
  // 解析文本中的 汉字[假名] 格式
  const parts: React.ReactNode[] = [];
  const regex = /([^\[\]]+)\[([^\[\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加匹配之前的普通文本
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // 添加Ruby标注
    parts.push(
      <Ruby key={match.index} kanji={match[1]} reading={match[2]} className={className} />
    );

    lastIndex = regex.lastIndex;
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="auto-ruby">{parts}</span>;
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
  const hasKanji = /[\u4e00-\u9faf]/.test(expression);
  if (!hasKanji) {
    return <span className={className}>{expression}</span>;
  }

  // 有汉字,使用Ruby标注
  return <Ruby kanji={expression} reading={reading} className={className} />;
}
