import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, BookOpen, Sparkles, MessageSquare, X, Volume2, VolumeX, StickyNote, Save, Trash2, Brain, Check, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/useSpeech";
import { parseJapaneseWithReading } from "@/components/RubyText";
import { JapaneseText } from "@/components/JapaneseText";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function VocabularyDetail() {
  const [, params] = useRoute("/vocabulary/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { isAuthenticated } = useAuth();
  
  const { data: vocab, isLoading } = trpc.vocabulary.getById.useQuery({ id });
  const recordProgress = trpc.learning.recordProgress.useMutation();
  const generateExamples = trpc.ai.generateExamples.useMutation();
  const generateDialogue = trpc.ai.generateDialogue.useMutation();
  
  const [aiExamples, setAiExamples] = React.useState<Array<{japanese: string, reading: string, chinese: string}>>([]);
  const [aiDialogue, setAiDialogue] = React.useState<{title: string, scenario: string, dialogue: Array<{speaker: string, japanese: string, reading: string, chinese: string}>} | null>(null);
  
  // 笔记功能
  const [noteContent, setNoteContent] = React.useState("");
  const [isEditingNote, setIsEditingNote] = React.useState(false);
  const { data: existingNote, refetch: refetchNote } = trpc.vocabulary.getNote.useQuery(
    { vocabularyId: id },
    { enabled: isAuthenticated && id > 0 }
  );
  const saveNote = trpc.vocabulary.saveNote.useMutation({
    onSuccess: () => {
      toast.success("笔记已保存");
      setIsEditingNote(false);
      refetchNote();
    },
    onError: () => toast.error("保存失败"),
  });
  const deleteNote = trpc.vocabulary.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("笔记已删除");
      setNoteContent("");
      setIsEditingNote(false);
      refetchNote();
    },
    onError: () => toast.error("删除失败"),
  });
  
  // 艾宾浩斯复习功能
  const { data: isInStudyPlan, refetch: refetchStudyPlan } = trpc.review.isInStudyPlan.useQuery(
    { itemType: "vocabulary", itemId: id },
    { enabled: isAuthenticated && id > 0 }
  );
  const addToStudyPlan = trpc.review.addToStudyPlan.useMutation({
    onSuccess: () => {
      toast.success("已加入学习计划");
      refetchStudyPlan();
    },
    onError: () => toast.error("添加失败"),
  });
  const removeFromStudyPlan = trpc.review.removeFromStudyPlan.useMutation({
    onSuccess: () => {
      toast.success("已从学习计划移除");
      refetchStudyPlan();
    },
    onError: () => toast.error("移除失败"),
  });
  
  const handleToggleStudyPlan = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    if (isInStudyPlan) {
      await removeFromStudyPlan.mutateAsync({ itemType: "vocabulary", itemId: id });
    } else {
      await addToStudyPlan.mutateAsync({ itemType: "vocabulary", itemId: id });
    }
  };
  
  // 当获取到现有笔记时，更新输入框内容
  React.useEffect(() => {
    if (existingNote?.content) {
      setNoteContent(existingNote.content);
    }
  }, [existingNote]);
  
  // 语音朗读功能 - 使用浏览器内置Web Speech API
  const { speak, stop, isSpeaking, isSupported } = useSpeech({
    lang: 'ja-JP',
    rate: 0.85, // 略慢一些，更清晰
    pitch: 1.0,
    volume: 1.0,
  });
  
  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(vocab?.expression || '');
    }
  };

  const handleMarkAsLearned = async (level: "learning" | "familiar" | "mastered") => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    try {
      await recordProgress.mutateAsync({
        itemType: "vocabulary",
        itemId: id,
        masteryLevel: level
      });
      toast.success("已记录学习进度");
    } catch (error) {
      toast.error("记录失败");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!vocab) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">词汇不存在</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/vocabulary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回词汇库
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="japanese-text text-5xl">{vocab.expression}</CardTitle>
                    {isSupported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSpeak}
                        className="h-12 w-12"
                        title={isSpeaking ? "停止朗读" : "朗读发音"}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-6 h-6" />
                        ) : (
                          <Volume2 className="w-6 h-6" />
                        )}
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xl">{vocab.reading}</CardDescription>
                  {vocab.romaji && (
                    <p className="text-muted-foreground">{vocab.romaji}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {vocab.jlptLevel}
                  </Badge>
                  {isAuthenticated && (
                    <Button
                      variant={isInStudyPlan ? "secondary" : "default"}
                      size="sm"
                      onClick={handleToggleStudyPlan}
                      disabled={addToStudyPlan.isPending || removeFromStudyPlan.isPending}
                      className="gap-1"
                    >
                      {isInStudyPlan ? (
                        <>
                          <Check className="w-4 h-4" />
                          已加入学习
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          加入学习
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">中文释义</h3>
                <p className="text-lg">{vocab.meaning}</p>
              </div>

              {vocab.partOfSpeech && (
                <div>
                  <h3 className="font-semibold mb-2">词性</h3>
                  <Badge variant="outline">{vocab.partOfSpeech}</Badge>
                </div>
              )}
              
              {vocab.collocations && vocab.collocations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">常用搭配</h3>
                  <div className="flex flex-wrap gap-2">
                    {vocab.collocations.map((collocation: string, index: number) => (
                      <Badge key={index} variant="secondary" className="japanese-text">
                        {collocation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {vocab.synonyms && vocab.synonyms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">同义词</h3>
                  <div className="flex flex-wrap gap-2">
                    {vocab.synonyms.map((synonym: string, index: number) => (
                      <Badge key={index} variant="outline" className="japanese-text">
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {vocab.antonyms && vocab.antonyms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">反义词</h3>
                  <div className="flex flex-wrap gap-2">
                    {vocab.antonyms.map((antonym: string, index: number) => (
                      <Badge key={index} variant="outline" className="japanese-text">
                        {antonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">标记掌握程度</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleMarkAsLearned("learning")}
                        disabled={recordProgress.isPending}
                      >
                        学习中
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleMarkAsLearned("familiar")}
                        disabled={recordProgress.isPending}
                      >
                        熟悉
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleMarkAsLearned("mastered")}
                        disabled={recordProgress.isPending}
                      >
                        已掌握
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">AI生成内容</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const result = await generateExamples.mutateAsync({ vocabularyId: id, count: 3 });
                            setAiExamples(result.examples);
                            toast.success("已生成例句，请查看下方内容");
                          } catch (error) {
                            toast.error("生成失败");
                          }
                        }}
                        disabled={generateExamples.isPending}
                      >
                        {generateExamples.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        生成例句
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const result = await generateDialogue.mutateAsync({ vocabularyId: id });
                            setAiDialogue(result);
                            toast.success("已生成对话场景，请查看下方内容");
                          } catch (error) {
                            toast.error("生成失败");
                          }
                        }}
                        disabled={generateDialogue.isPending}
                      >
                        {generateDialogue.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        生成对话场景
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {vocab.examples && vocab.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  例句
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vocab.examples.map((example, index) => (
                  <div key={example.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="japanese-text text-lg"><JapaneseText reading={example.reading}>{example.japanese}</JapaneseText></p>
                        {example.reading && (
                          <p className="text-sm text-muted-foreground">{example.reading}</p>
                        )}
                        {example.romaji && (
                          <p className="text-sm text-muted-foreground">{example.romaji}</p>
                        )}
                        <p className="text-base">{example.chinese}</p>
                        {example.source && (
                          <Badge variant="secondary" className="mt-2">
                            {example.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {aiExamples.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI生成的例句
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setAiExamples([])}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiExamples.map((example, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="japanese-text text-lg font-medium">
                          {parseJapaneseWithReading(example.japanese)}
                        </p>
                        <p className="text-base">{example.chinese}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 用户笔记卡片 */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5" />
                    我的笔记
                  </CardTitle>
                  {existingNote && !isEditingNote && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(true)}>
                        编辑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteNote.mutate({ vocabularyId: id })}
                        disabled={deleteNote.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingNote || !existingNote ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="记录你对这个词汇的理解、记忆技巧或者笔记..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      {existingNote && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setNoteContent(existingNote.content);
                            setIsEditingNote(false);
                          }}
                        >
                          取消
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => saveNote.mutate({ vocabularyId: id, content: noteContent })}
                        disabled={saveNote.isPending || !noteContent.trim()}
                      >
                        {saveNote.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        保存笔记
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="whitespace-pre-wrap">{existingNote.content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {aiDialogue && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {aiDialogue.title}
                    </CardTitle>
                    <CardDescription>{aiDialogue.scenario}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAiDialogue(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiDialogue.dialogue.map((line, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 space-y-2">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0">{line.speaker}</Badge>
                      <div className="space-y-1 flex-1">
                        <p className="japanese-text text-lg font-medium">
                          {parseJapaneseWithReading(line.japanese)}
                        </p>
                        <p className="text-base">{line.chinese}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
