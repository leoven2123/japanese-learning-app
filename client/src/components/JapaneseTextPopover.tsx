import { useState, useCallback, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Volume2, Loader2, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSpeech } from "@/hooks/useSpeech";
import { AutoRuby } from "@/components/Ruby";

interface WordInfo {
  word: string;
  reading?: string;
  meaning: string;
  partOfSpeech: string;
  usage?: string;
  examples?: Array<{
    japanese: string;
    reading?: string;
    meaning: string;
  }>;
  isGrammar?: boolean;
  grammarLevel?: string;
  grammarPattern?: string;
}

interface JapaneseTextPopoverProps {
  text: string;
  showTranslation?: boolean;
  translation?: string;
  className?: string;
}

/**
 * 智能日语文本组件
 * - 自动显示振假名注音
 * - 点击词汇/语法时弹出详细解释
 */
export function JapaneseTextPopover({ 
  text, 
  showTranslation = false, 
  translation,
  className = ""
}: JapaneseTextPopoverProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useSpeech();

  // 分析词汇/语法的API
  const analyzeWordMutation = trpc.ai.analyzeWord.useMutation({
    onSuccess: (data) => {
      if (data) {
        setWordInfo(data as WordInfo);
      }
    },
  });

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length > 30) return;

    // 检查是否包含日语字符
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(selectedText);
    if (!hasJapanese) return;

    setSelectedWord(selectedText);
    setWordInfo(null);
    setPopoverOpen(true);
    
    // 调用API分析词汇
    analyzeWordMutation.mutate({ text: selectedText });
  }, [analyzeWordMutation]);

  // 播放发音
  const handleSpeak = useCallback((textToSpeak: string) => {
    speak(textToSpeak);
  }, [speak]);

  return (
    <div className={`relative ${className}`}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            ref={textRef}
            className="japanese-text text-lg leading-relaxed cursor-text"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            <AutoRuby text={text} />
          </div>
        </PopoverTrigger>
        
        {selectedWord && (
          <PopoverContent 
            className="w-80 p-0" 
            align="start"
            side="bottom"
          >
            {/* 词汇标题 */}
            <div className="p-3 bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {wordInfo?.isGrammar ? (
                    <BookOpen className="w-4 h-4 text-primary" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-bold japanese-text text-lg">
                    <AutoRuby text={selectedWord} />
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSpeak(selectedWord)}
                  disabled={isSpeaking}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              {wordInfo?.reading && wordInfo.reading !== selectedWord && (
                <p className="text-sm text-muted-foreground mt-1">
                  {wordInfo.reading}
                </p>
              )}
            </div>

            {/* 加载状态 */}
            {analyzeWordMutation.isPending && (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">分析中...</span>
              </div>
            )}

            {/* 词汇信息 */}
            {wordInfo && !analyzeWordMutation.isPending && (
              <div className="p-3 space-y-3">
                {/* 词性/语法类型 */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {wordInfo.partOfSpeech}
                  </Badge>
                  {wordInfo.isGrammar && wordInfo.grammarLevel && (
                    <Badge variant="outline" className="text-xs">
                      {wordInfo.grammarLevel}
                    </Badge>
                  )}
                </div>

                {/* 含义 */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">释义</p>
                  <p className="text-sm">{wordInfo.meaning}</p>
                </div>

                {/* 语法模式 */}
                {wordInfo.grammarPattern && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">语法模式</p>
                    <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                      {wordInfo.grammarPattern}
                    </p>
                  </div>
                )}

                {/* 用法说明 */}
                {wordInfo.usage && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">用法</p>
                    <p className="text-sm text-muted-foreground">{wordInfo.usage}</p>
                  </div>
                )}

                {/* 例句 */}
                {wordInfo.examples && wordInfo.examples.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">例句</p>
                    <div className="space-y-2">
                      {wordInfo.examples.slice(0, 2).map((example, index) => (
                        <div 
                          key={index} 
                          className="p-2 bg-muted/30 rounded text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="japanese-text">
                                <AutoRuby text={example.japanese} />
                              </p>
                              <p className="text-muted-foreground text-xs mt-1">
                                {example.meaning}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleSpeak(example.japanese)}
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 错误状态 */}
            {analyzeWordMutation.isError && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>无法获取词汇信息</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => analyzeWordMutation.mutate({ text: selectedWord })}
                >
                  重试
                </Button>
              </div>
            )}
          </PopoverContent>
        )}
      </Popover>

      {/* 中文翻译 */}
      {showTranslation && translation && (
        <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-primary/30">
          {translation}
        </p>
      )}
    </div>
  );
}

export default JapaneseTextPopover;
