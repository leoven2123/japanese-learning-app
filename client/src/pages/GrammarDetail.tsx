import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, Sparkles, MessageSquare, X, StickyNote, Save, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { parseJapaneseWithReading } from "@/components/RubyText";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function GrammarDetail() {
  const [, params] = useRoute("/grammar/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { isAuthenticated } = useAuth();
  
  const { data: grammar, isLoading } = trpc.grammar.getById.useQuery({ id });
  const generateExamples = trpc.ai.generateExamples.useMutation();
  const generateDialogue = trpc.ai.generateDialogue.useMutation();
  
  const [aiExamples, setAiExamples] = React.useState<Array<{japanese: string, reading: string, chinese: string}>>([]);
  const [aiDialogue, setAiDialogue] = React.useState<{title: string, scenario: string, dialogue: Array<{speaker: string, japanese: string, reading: string, chinese: string}>} | null>(null);
  
  // 笔记功能
  const [noteContent, setNoteContent] = React.useState("");
  const [isEditingNote, setIsEditingNote] = React.useState(false);
  const { data: existingNote, refetch: refetchNote } = trpc.grammar.getNote.useQuery(
    { grammarId: id },
    { enabled: isAuthenticated && id > 0 }
  );
  const saveNote = trpc.grammar.saveNote.useMutation({
    onSuccess: () => {
      toast.success("笔记已保存");
      setIsEditingNote(false);
      refetchNote();
    },
    onError: () => toast.error("保存失败"),
  });
  const deleteNote = trpc.grammar.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("笔记已删除");
      setNoteContent("");
      setIsEditingNote(false);
      refetchNote();
    },
    onError: () => toast.error("删除失败"),
  });
  
  // 当获取到现有笔记时，更新输入框内容
  React.useEffect(() => {
    if (existingNote?.content) {
      setNoteContent(existingNote.content);
    }
  }, [existingNote]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!grammar) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">语法不存在</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/grammar">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回语法库
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="japanese-text text-4xl">{grammar.pattern}</CardTitle>
                  <CardDescription className="text-xl">{grammar.meaning}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {grammar.jlptLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {grammar.usage && (
                <div>
                  <h3 className="font-semibold mb-2">用法说明</h3>
                  <p className="text-base leading-relaxed">{grammar.usage}</p>
                </div>
              )}

              {isAuthenticated && (
                <div>
                  <h3 className="font-semibold mb-3">AI生成内容</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const result = await generateExamples.mutateAsync({ grammarId: id, count: 3 });
                          setAiExamples(result.examples);
                          toast.success("已生成例句,请查看下方内容");
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
                          const result = await generateDialogue.mutateAsync({ grammarId: id });
                          setAiDialogue(result);
                          toast.success("已生成对话场景,请查看下方内容");
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
              )}
            </CardContent>
          </Card>

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
                        onClick={() => deleteNote.mutate({ grammarId: id })}
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
                      placeholder="记录你对这个语法点的理解、使用技巧或者笔记..."
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
                        onClick={() => saveNote.mutate({ grammarId: id, content: noteContent })}
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
