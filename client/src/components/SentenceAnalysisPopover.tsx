import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Volume2, BookOpen, Languages, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSpeech } from "@/hooks/useSpeech";
import { AutoRuby } from "@/components/Ruby";

interface SentenceAnalysisPopoverProps {
  /** 日语句子 */
  sentence: string;
  /** 触发按钮的样式 */
  buttonVariant?: "ghost" | "outline" | "secondary";
  /** 按钮大小 */
  buttonSize?: "icon" | "sm" | "default";
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

interface AnalysisResult {
  translation: string;
  vocabulary: VocabItem[];
  grammar: GrammarItem[];
}

/**
 * 句子分析弹窗组件
 * 点击后显示：中文翻译、重要词汇、语法知识点
 */
export function SentenceAnalysisPopover({ 
  sentence, 
  buttonVariant = "ghost",
  buttonSize = "icon"
}: SentenceAnalysisPopoverProps) {
  const [open, setOpen] = useState(false);
  const { speak, isSpeaking } = useSpeech();
  
  // 使用AI分析句子
  const analyzeSentenceMutation = trpc.ai.analyzeSentence.useMutation();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !analyzeSentenceMutation.data && !analyzeSentenceMutation.isPending) {
      analyzeSentenceMutation.mutate({ sentence });
    }
  };

  const analysis = analyzeSentenceMutation.data as AnalysisResult | undefined;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          title="查看翻译和知识点"
        >
          <Languages className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 max-h-[80vh] overflow-y-auto" align="end" side="bottom">
        {/* 标题栏 */}
        <div className="p-3 bg-primary/5 border-b sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">句子分析</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => speak(sentence)}
              disabled={isSpeaking}
              title="朗读句子"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 加载状态 */}
        {analyzeSentenceMutation.isPending && (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-muted-foreground">正在分析句子...</span>
          </div>
        )}

        {/* 分析结果 */}
        {analysis && !analyzeSentenceMutation.isPending && (
          <div className="p-4 space-y-4">
            {/* 中文翻译 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">中文翻译</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm">{analysis.translation}</p>
              </div>
            </div>

            {/* 重要词汇 */}
            {analysis.vocabulary && analysis.vocabulary.length > 0 && (
              <div>
                <Separator className="my-3" />
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">重要词汇</span>
                </div>
                <div className="space-y-2">
                  {analysis.vocabulary.map((vocab, index) => (
                    <div 
                      key={index} 
                      className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium japanese-text">
                            <AutoRuby text={vocab.word} />
                          </span>
                          {vocab.reading && vocab.reading !== vocab.word && (
                            <span className="text-xs text-muted-foreground">
                              ({vocab.reading})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {vocab.partOfSpeech}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => speak(vocab.word)}
                          >
                            <Volume2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{vocab.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 语法知识点 */}
            {analysis.grammar && analysis.grammar.length > 0 && (
              <div>
                <Separator className="my-3" />
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">语法知识点</span>
                </div>
                <div className="space-y-2">
                  {analysis.grammar.map((gram, index) => (
                    <div 
                      key={index} 
                      className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium font-mono text-sm">
                          {gram.pattern}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {gram.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{gram.meaning}</p>
                      {gram.usage && (
                        <p className="text-xs text-muted-foreground/70 italic">
                          用法: {gram.usage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 错误状态 */}
        {analyzeSentenceMutation.isError && (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">分析失败</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeSentenceMutation.mutate({ sentence })}
            >
              重试
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
