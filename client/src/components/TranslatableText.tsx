import { useState } from "react";
import { Languages, X, Loader2, Volume2, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/hooks/useSpeech";
import { AutoRuby } from "@/components/Ruby";

interface TranslatableTextProps {
  /** 日语原文 */
  text: string;
  /** 可选的预设翻译，如果没有则调用AI翻译 */
  translation?: string;
  /** 可选的读音，用于振假名显示 */
  reading?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否显示振假名 */
  showRuby?: boolean;
  /** 子元素（如果需要自定义渲染原文） */
  children?: React.ReactNode;
}

interface VocabItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
}

interface GrammarItem {
  pattern: string;
  meaning: string;
  level: string;
  usage: string;
}

/**
 * 全局翻译插件组件
 * - hover日语句子时，在句末显示悬浮翻译按钮
 * - 点击按钮显示翻译和知识点
 * - hover翻译时显示隐藏按钮，点击隐藏翻译
 */
export function TranslatableText({
  text,
  translation: presetTranslation,
  reading,
  className,
  showRuby = true,
  children,
}: TranslatableTextProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslationHovered, setIsTranslationHovered] = useState(false);
  const { speak, isSpeaking } = useSpeech();

  // AI分析句子mutation
  const analyzeSentenceMutation = trpc.ai.analyzeSentence.useMutation();

  // 处理翻译按钮点击
  const handleTranslateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showTranslation) {
      // 如果已经显示翻译，则隐藏
      setShowTranslation(false);
    } else {
      // 显示翻译
      setShowTranslation(true);
      // 如果没有已分析的数据，调用AI分析
      if (!analyzeSentenceMutation.data && !analyzeSentenceMutation.isPending) {
        analyzeSentenceMutation.mutate({ sentence: text });
      }
    }
  };

  // 处理隐藏翻译按钮点击
  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranslation(false);
  };

  const analysis = analyzeSentenceMutation.data as {
    translation: string;
    vocabulary: VocabItem[];
    grammar: GrammarItem[];
  } | undefined;

  return (
    <div className={cn("relative", className)}>
      {/* 原文容器 */}
      <div
        className="relative inline-flex items-center gap-1 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 原文内容 */}
        <span className="japanese-text">
          {children || (showRuby ? <AutoRuby text={text} /> : text)}
        </span>

        {/* 悬浮翻译按钮 - 在句末显示 */}
        <button
          onClick={handleTranslateClick}
          className={cn(
            "inline-flex items-center justify-center flex-shrink-0",
            "w-6 h-6 rounded-full",
            "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
            "hover:from-blue-500/20 hover:to-purple-500/20",
            "text-blue-600 dark:text-blue-400",
            "border border-blue-200/50 dark:border-blue-700/50",
            "shadow-sm hover:shadow",
            "transition-all duration-300 ease-out",
            "opacity-0 scale-75 translate-x-1",
            (isHovered || showTranslation) && "opacity-100 scale-100 translate-x-0",
            showTranslation && "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-300 dark:border-blue-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          )}
          title={showTranslation ? "隐藏翻译" : "显示翻译和知识点"}
        >
          {analyzeSentenceMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : showTranslation ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <Languages className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 翻译和知识点内容 */}
      {showTranslation && (
        <div
          className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300"
          onMouseEnter={() => setIsTranslationHovered(true)}
          onMouseLeave={() => setIsTranslationHovered(false)}
        >
          <div className={cn(
            "relative rounded-xl overflow-hidden",
            "bg-gradient-to-br from-slate-50 to-blue-50/50",
            "dark:from-slate-900 dark:to-blue-900/20",
            "border border-slate-200/80 dark:border-slate-700/80",
            "shadow-lg shadow-blue-500/5"
          )}>
            {/* 加载状态 */}
            {analyzeSentenceMutation.isPending && (
              <div className="p-6 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                <span className="text-sm text-muted-foreground">正在分析...</span>
              </div>
            )}

            {/* 分析结果 */}
            {analysis && !analyzeSentenceMutation.isPending && (
              <div className="p-4 space-y-3">
                {/* 中文翻译 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Languages className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm leading-relaxed">{analysis.translation || presetTranslation || "暂无翻译"}</p>
                  </div>
                </div>

                {/* 重要词汇 */}
                {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-muted-foreground">重要词汇</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.vocabulary.slice(0, 5).map((vocab, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg",
                              "bg-emerald-50 dark:bg-emerald-900/20",
                              "border border-emerald-200/50 dark:border-emerald-700/50"
                            )}
                          >
                            <span className="font-medium text-sm japanese-text">{vocab.word}</span>
                            <span className="text-xs text-muted-foreground">{vocab.meaning}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 -mr-1"
                              onClick={() => speak(vocab.word)}
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 语法知识点 */}
                {analysis.grammar && analysis.grammar.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-muted-foreground">语法知识点</span>
                      </div>
                      <div className="space-y-2">
                        {analysis.grammar.slice(0, 3).map((gram, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "px-3 py-2 rounded-lg",
                              "bg-purple-50 dark:bg-purple-900/20",
                              "border border-purple-200/50 dark:border-purple-700/50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-medium">{gram.pattern}</span>
                              <Badge variant="secondary" className="text-xs">{gram.level}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{gram.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 隐藏按钮 */}
                <button
                  onClick={handleHideClick}
                  className={cn(
                    "absolute top-2 right-2",
                    "w-6 h-6 rounded-full",
                    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
                    "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                    "flex items-center justify-center",
                    "transition-all duration-200",
                    "opacity-0 scale-90",
                    isTranslationHovered && "opacity-100 scale-100",
                    "focus:outline-none"
                  )}
                  title="隐藏翻译"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 错误状态 */}
            {analyzeSentenceMutation.isError && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">分析失败</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => analyzeSentenceMutation.mutate({ sentence: text })}
                >
                  重试
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TranslatableText;
