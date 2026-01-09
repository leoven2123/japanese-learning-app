import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  MessageCircle,
  Sparkles,
  Check,
  Loader2,
  Languages,
  Lightbulb,
  Target,
  Film,
  Music
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AutoRuby } from "@/components/Ruby";
import { useSpeech } from "@/hooks/useSpeech";

// 场景类型图标映射
const unitTypeIcons: Record<string, typeof BookOpen> = {
  scene: MessageCircle,
  expression: Target,
  media: Film,
  dialogue: MessageCircle,
};

// 场景类型中文名称
const unitTypeNames: Record<string, string> = {
  scene: "场景对话",
  expression: "表达学习",
  media: "媒体素材",
  dialogue: "对话练习",
};

// 来源类型中文名称
const sourceTypeNames: Record<string, string> = {
  original: "原创内容",
  anime: "动漫",
  jpop: "J-POP",
  movie: "电影",
  drama: "日剧",
  novel: "小说",
};

// 智能词汇弹窗组件
function WordPopover({ 
  word, 
  children 
}: { 
  word: string; 
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { speak, isSpeaking } = useSpeech();
  
  const analyzeWordMutation = trpc.ai.analyzeWord.useMutation();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !analyzeWordMutation.data && !analyzeWordMutation.isPending) {
      analyzeWordMutation.mutate({ text: word });
    }
  };

  const wordInfo = analyzeWordMutation.data;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="bottom">
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
                <AutoRuby text={word} />
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => speak(word)}
              disabled={isSpeaking}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
          {wordInfo?.reading && wordInfo.reading !== word && (
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
                  {wordInfo.examples.slice(0, 2).map((example: { japanese: string; meaning: string }, index: number) => (
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
                          onClick={() => speak(example.japanese)}
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
              onClick={() => analyzeWordMutation.mutate({ text: word })}
            >
              重试
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// 可点击的日语文本组件
function ClickableJapaneseText({ 
  text, 
  showTranslation = false,
  translation 
}: { 
  text: string; 
  showTranslation?: boolean;
  translation?: string;
}) {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showPopover, setShowPopover] = useState(false);
  const { speak, isSpeaking } = useSpeech();
  
  const analyzeWordMutation = trpc.ai.analyzeWord.useMutation();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowPopover(false);
      return;
    }

    const selectedStr = selection.toString().trim();
    if (!selectedStr || selectedStr.length > 30) {
      setShowPopover(false);
      return;
    }

    // 检查是否包含日语字符
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(selectedStr);
    if (!hasJapanese) {
      setShowPopover(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectedText(selectedStr);
    setPopoverPosition({ x: rect.left, y: rect.bottom + window.scrollY });
    setShowPopover(true);
    analyzeWordMutation.mutate({ text: selectedStr });
  };

  const wordInfo = analyzeWordMutation.data;

  return (
    <div className="relative">
      <div
        className="japanese-text text-lg leading-relaxed cursor-text select-text"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <AutoRuby text={text} />
      </div>

      {/* 中文翻译 */}
      {showTranslation && translation && (
        <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-primary/30">
          {translation}
        </p>
      )}

      {/* 弹出词汇信息 */}
      {showPopover && selectedText && (
        <div 
          className="fixed z-50 bg-background border rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto"
          style={{ 
            left: Math.min(popoverPosition.x, window.innerWidth - 340),
            top: popoverPosition.y + 8
          }}
        >
          {/* 词汇标题 */}
          <div className="p-3 bg-primary/5 border-b sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {wordInfo?.isGrammar ? (
                  <BookOpen className="w-4 h-4 text-primary" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-primary" />
                )}
                <span className="font-bold japanese-text text-lg">
                  <AutoRuby text={selectedText} />
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => speak(selectedText)}
                  disabled={isSpeaking}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPopover(false)}
                >
                  ×
                </Button>
              </div>
            </div>
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

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">释义</p>
                <p className="text-sm">{wordInfo.meaning}</p>
              </div>

              {wordInfo.grammarPattern && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">语法模式</p>
                  <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                    {wordInfo.grammarPattern}
                  </p>
                </div>
              )}

              {wordInfo.usage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">用法</p>
                  <p className="text-sm text-muted-foreground">{wordInfo.usage}</p>
                </div>
              )}

              {wordInfo.examples && wordInfo.examples.length > 0 && (
                <div>
                  <Separator className="my-2" />
                  <p className="text-sm font-medium text-muted-foreground mb-2">例句</p>
                  <div className="space-y-2">
                    {wordInfo.examples.slice(0, 2).map((example: { japanese: string; meaning: string }, index: number) => (
                      <div key={index} className="p-2 bg-muted/30 rounded text-sm">
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
                            onClick={() => speak(example.japanese)}
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

          {analyzeWordMutation.isError && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>无法获取词汇信息</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => analyzeWordMutation.mutate({ text: selectedText })}
              >
                重试
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImmersiveDetail() {
  const [, params] = useRoute("/immersive/:id");
  const unitId = params?.id ? parseInt(params.id) : 0;
  
  const { isAuthenticated } = useAuth();
  const { speak, stop, isSpeaking } = useSpeech();
  
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedDialogues, setCompletedDialogues] = useState<Set<number>>(new Set());

  // 获取学习单元详情
  const { data: unit, isLoading } = trpc.immersive.getUnitById.useQuery(
    { id: unitId },
    { enabled: unitId > 0 }
  );

  // 获取用户进度
  const { data: userProgress } = trpc.immersive.getUserProgress.useQuery(
    { unitId },
    { enabled: isAuthenticated && unitId > 0 }
  );

  // 更新进度
  const updateProgressMutation = trpc.immersive.updateProgress.useMutation();

  // 完成单元
  const completeUnitMutation = trpc.immersive.completeUnit.useMutation();

  // 生成对话变体
  const generateVariantMutation = trpc.immersive.generateDialogueVariant.useMutation();

  const dialogues = unit?.content?.dialogues || [];
  const currentDialogue = dialogues[currentDialogueIndex];
  const totalDialogues = dialogues.length;
  const progress = totalDialogues > 0 ? (completedDialogues.size / totalDialogues) * 100 : 0;

  // 播放当前对话
  const playCurrentDialogue = () => {
    if (currentDialogue) {
      speak(currentDialogue.text);
    }
  };

  // 播放全部对话
  const playAllDialogues = async () => {
    setIsPlaying(true);
    for (let i = 0; i < dialogues.length; i++) {
      setCurrentDialogueIndex(i);
      await new Promise<void>((resolve) => {
        speak(dialogues[i].text);
        // 等待语音播放完成(估算时间)
        const duration = dialogues[i].text.length * 150 + 500;
        setTimeout(resolve, duration);
      });
    }
    setIsPlaying(false);
  };

  // 停止播放
  const stopPlaying = () => {
    stop();
    setIsPlaying(false);
  };

  // 标记当前对话为已完成
  const markCurrentAsCompleted = () => {
    setCompletedDialogues(prev => new Set(prev).add(currentDialogueIndex));
    if (currentDialogueIndex < totalDialogues - 1) {
      setCurrentDialogueIndex(prev => prev + 1);
    }
  };

  // 下一个对话
  const nextDialogue = () => {
    if (currentDialogueIndex < totalDialogues - 1) {
      setCurrentDialogueIndex(prev => prev + 1);
    }
  };

  // 上一个对话
  const prevDialogue = () => {
    if (currentDialogueIndex > 0) {
      setCurrentDialogueIndex(prev => prev - 1);
    }
  };

  // 完成学习
  const handleComplete = async () => {
    if (!isAuthenticated) return;
    
    await completeUnitMutation.mutateAsync({ unitId });
  };

  // 更新学习进度
  useEffect(() => {
    if (isAuthenticated && unitId > 0 && progress > 0) {
      updateProgressMutation.mutate({
        unitId,
        status: progress >= 100 ? "completed" : "in_progress",
        completionRate: Math.round(progress),
      });
    }
  }, [progress, isAuthenticated, unitId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!unit) {
    return (
      <Layout>
        <div className="container py-8">
          <Card className="py-12">
            <CardContent className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">学习单元不存在</h3>
              <p className="text-muted-foreground mb-4">
                该学习单元可能已被删除或不存在
              </p>
              <Button asChild>
                <Link href="/immersive">返回学习列表</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const Icon = unitTypeIcons[unit.unitType] || BookOpen;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* 返回按钮和标题 */}
        <div className="mb-6">
          <Link href="/immersive">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回学习列表
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline">
                  {unitTypeNames[unit.unitType] || unit.unitType}
                </Badge>
                {unit.jlptLevel && (
                  <Badge variant="secondary">{unit.jlptLevel}</Badge>
                )}
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Lv.{unit.difficulty}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold japanese-text">
                <AutoRuby text={unit.titleJa} />
              </h1>
              {unit.titleZh && (
                <p className="text-lg text-muted-foreground mt-1">{unit.titleZh}</p>
              )}
            </div>
          </div>
        </div>

        {/* 来源标注 */}
        {unit.sourceType && unit.sourceType !== "original" && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">素材来源：</span>
                <span className="font-medium">
                  {sourceTypeNames[unit.sourceType] || unit.sourceType}
                  {unit.sourceTitle && ` - ${unit.sourceTitle}`}
                  {unit.sourceYear && ` (${unit.sourceYear})`}
                  {unit.sourceEpisode && ` ${unit.sourceEpisode}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学习进度 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">学习进度</span>
              <span className="text-sm text-muted-foreground">
                {completedDialogues.size} / {totalDialogues}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* 场景描述 */}
        {unit.content?.situationDescription && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                场景描述
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClickableJapaneseText text={unit.content.situationDescription} />
            </CardContent>
          </Card>
        )}

        {/* 对话区域 */}
        {dialogues.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">对话内容</CardTitle>
                <div className="flex items-center gap-4">
                  {/* 显示中文翻译开关 */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-translation"
                      checked={showTranslation}
                      onCheckedChange={setShowTranslation}
                    />
                    <Label htmlFor="show-translation" className="text-sm flex items-center gap-1 cursor-pointer">
                      <Languages className="w-4 h-4" />
                      中文
                    </Label>
                  </div>
                  {/* 显示注释开关 */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-notes"
                      checked={showNotes}
                      onCheckedChange={setShowNotes}
                    />
                    <Label htmlFor="show-notes" className="text-sm flex items-center gap-1 cursor-pointer">
                      <Lightbulb className="w-4 h-4" />
                      注释
                    </Label>
                  </div>
                </div>
              </div>
              <CardDescription className="text-xs mt-2">
                💡 提示：选中日语文本可查看词汇/语法详解
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 对话列表 */}
              <div className="space-y-4">
                {dialogues.map((dialogue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg transition-all cursor-pointer ${
                      index === currentDialogueIndex
                        ? "bg-primary/10 border-2 border-primary"
                        : completedDialogues.has(index)
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => setCurrentDialogueIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 说话者头像 */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          dialogue.speakerRole === "customer" || dialogue.speaker?.includes("客")
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        }`}>
                          {dialogue.speaker?.charAt(0) || "A"}
                        </div>
                      </div>
                      
                      {/* 对话内容 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {dialogue.speaker || `話者${index + 1}`}
                          </span>
                          {completedDialogues.has(index) && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {/* 日语原文（始终显示注音） */}
                        <ClickableJapaneseText 
                          text={dialogue.reading || dialogue.text}
                          showTranslation={showTranslation}
                          translation={dialogue.notes}
                        />
                        {/* 注释 */}
                        {showNotes && dialogue.notes && !showTranslation && (
                          <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-muted">
                            {dialogue.notes}
                          </p>
                        )}
                      </div>
                      
                      {/* 播放按钮 */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(dialogue.text);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevDialogue}
                  disabled={currentDialogueIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <Button
                  variant={isPlaying ? "destructive" : "default"}
                  onClick={isPlaying ? stopPlaying : playAllDialogues}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      停止播放
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      播放全部
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={markCurrentAsCompleted}
                >
                  <Check className="w-4 h-4 mr-2" />
                  已掌握
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextDialogue}
                  disabled={currentDialogueIndex === totalDialogues - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学习要点 */}
        {unit.content?.keyPoints && unit.content.keyPoints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                学习要点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {unit.content.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="japanese-text">
                      <AutoRuby text={point} />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 目标表达 */}
        {unit.targetExpressions && unit.targetExpressions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                目标表达
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unit.targetExpressions.map((expr, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-base py-1 px-3 japanese-text cursor-pointer hover:bg-primary/20"
                    onClick={() => speak(expr)}
                  >
                    <AutoRuby text={expr} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文化背景 */}
        {unit.content?.culturalNotes && (
          <Card className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-500" />
                文化背景
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClickableJapaneseText text={unit.content.culturalNotes} />
            </CardContent>
          </Card>
        )}

        {/* AI生成变体 */}
        {isAuthenticated && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI对话变体
              </CardTitle>
              <CardDescription>
                生成不同风格的对话变体，练习多种表达方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["casual", "polite", "formal", "slang"].map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    onClick={() => generateVariantMutation.mutate({ unitId, style: style as any })}
                    disabled={generateVariantMutation.isPending}
                  >
                    {generateVariantMutation.isPending && generateVariantMutation.variables?.style === style ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    {style === "casual" && "随意风格"}
                    {style === "polite" && "礼貌风格"}
                    {style === "formal" && "正式风格"}
                    {style === "slang" && "网络用语"}
                  </Button>
                ))}
              </div>
              
              {generateVariantMutation.data?.dialogue && (
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border">
                  <div className="prose prose-sm dark:prose-invert max-w-none japanese-text whitespace-pre-wrap">
                    {typeof generateVariantMutation.data.dialogue === 'string' ? generateVariantMutation.data.dialogue : ''}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 完成按钮 */}
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline" size="lg">
            <Link href="/immersive">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Link>
          </Button>
          
          {isAuthenticated && progress >= 100 && (
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={completeUnitMutation.isPending}
            >
              {completeUnitMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              完成学习
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
