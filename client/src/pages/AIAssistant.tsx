import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, BookOpen, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function AIAssistant() {
  const [chatMessage, setChatMessage] = useState("");
  const [grammarPoint, setGrammarPoint] = useState("");
  const [grammarQuestion, setGrammarQuestion] = useState("");
  const [vocabularyId, setVocabularyId] = useState("");
  const [exampleCount, setExampleCount] = useState(3);

  const chatMutation = trpc.ai.chat.useMutation();
  const explainGrammarMutation = trpc.ai.explainGrammar.useMutation();
  const generateExamplesMutation = trpc.ai.generateExamples.useMutation();
  const adviceQuery = trpc.ai.getStudyAdvice.useQuery();
  const generateContentMutation = trpc.ai.generateNextStageContent.useMutation();

  const handleChat = async () => {
    if (!chatMessage.trim()) {
      toast.error("请输入问题");
      return;
    }

    try {
      await chatMutation.mutateAsync({ message: chatMessage });
      setChatMessage("");
    } catch (error) {
      toast.error("对话失败,请重试");
    }
  };

  const handleExplainGrammar = async () => {
    if (!grammarPoint.trim()) {
      toast.error("请输入语法点");
      return;
    }

    try {
      await explainGrammarMutation.mutateAsync({
        grammarPoint,
        question: grammarQuestion || undefined,
      });
      toast.success("语法解释已生成");
    } catch (error) {
      toast.error("生成失败,请重试");
    }
  };

  const handleGenerateExamples = async () => {
    const vocabId = parseInt(vocabularyId);
    if (isNaN(vocabId) || vocabId <= 0) {
      toast.error("请输入有效的词汇ID");
      return;
    }

    try {
      await generateExamplesMutation.mutateAsync({
        vocabularyId: vocabId,
        count: exampleCount,
      });
      toast.success("例句已生成");
    } catch (error) {
      toast.error("生成失败,请重试");
    }
  };

  const handleGenerateContent = async (contentType: "vocabulary" | "grammar" | "exercise") => {
    try {
      await generateContentMutation.mutateAsync({
        contentType,
        count: 5,
      });
      toast.success(`${contentType === 'vocabulary' ? '词汇' : contentType === 'grammar' ? '语法' : '练习'}内容已生成`);
    } catch (error: any) {
      toast.error(error.message || "生成失败,请重试");
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI学习助手
        </h1>
        <p className="text-muted-foreground">
          智能日语学习助手,为您提供个性化的学习建议和内容生成
        </p>
      </div>

      <Tabs defaultValue="advice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="advice">学习建议</TabsTrigger>
          <TabsTrigger value="chat">对话助手</TabsTrigger>
          <TabsTrigger value="grammar">语法解释</TabsTrigger>
          <TabsTrigger value="generate">内容生成</TabsTrigger>
        </TabsList>

        {/* 学习建议 */}
        <TabsContent value="advice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                个性化学习建议
              </CardTitle>
              <CardDescription>
                基于您的学习进度和可靠的学习资源,AI为您提供定制化的学习建议
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adviceQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : adviceQuery.error ? (
                <div className="text-center py-8 text-destructive">
                  加载失败,请刷新页面重试
                </div>
              ) : adviceQuery.data?.advice ? (
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{typeof adviceQuery.data.advice === 'string' ? adviceQuery.data.advice : ''}</Streamdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无学习建议
                </div>
              )}
              <div className="mt-4">
                <Button
                  onClick={() => adviceQuery.refetch()}
                  disabled={adviceQuery.isLoading}
                >
                  {adviceQuery.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "刷新建议"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 对话助手 */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI对话助手
              </CardTitle>
              <CardDescription>
                向AI提问任何日语学习相关的问题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="请输入您的问题,例如: 如何区分は和が的用法?"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleChat}
                disabled={chatMutation.isPending}
              >
                {chatMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    思考中...
                  </>
                ) : (
                  "发送问题"
                )}
              </Button>

              {chatMutation.data && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">AI回复:</h3>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{typeof chatMutation.data.reply === 'string' ? chatMutation.data.reply : ''}</Streamdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 语法解释 */}
        <TabsContent value="grammar">
          <Card>
            <CardHeader>
              <CardTitle>语法点解释</CardTitle>
              <CardDescription>
                输入语法点,AI将为您详细解释其用法
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">语法点</label>
                <Textarea
                  placeholder="例如: ～てもいいです"
                  value={grammarPoint}
                  onChange={(e) => setGrammarPoint(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">具体问题(可选)</label>
                <Textarea
                  placeholder="例如: 这个语法和～てもかまいません有什么区别?"
                  value={grammarQuestion}
                  onChange={(e) => setGrammarQuestion(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleExplainGrammar}
                disabled={explainGrammarMutation.isPending}
              >
                {explainGrammarMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "获取解释"
                )}
              </Button>

              {explainGrammarMutation.data && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">语法解释:</h3>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{typeof explainGrammarMutation.data.explanation === 'string' ? explainGrammarMutation.data.explanation : ''}</Streamdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 内容生成 */}
        <TabsContent value="generate">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>生成下一阶段内容</CardTitle>
                <CardDescription>
                  AI根据您的学习进度和大纲,生成下一阶段的学习内容
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateContent("vocabulary")}
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    生成词汇
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateContent("grammar")}
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    生成语法
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateContent("exercise")}
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    生成练习
                  </Button>
                </div>

                {generateContentMutation.data && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">生成结果:</h3>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(generateContentMutation.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>生成例句</CardTitle>
                <CardDescription>
                  为指定词汇生成实用例句
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">词汇ID</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="输入词汇ID"
                    value={vocabularyId}
                    onChange={(e) => setVocabularyId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">例句数量</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    max="10"
                    value={exampleCount}
                    onChange={(e) => setExampleCount(parseInt(e.target.value) || 3)}
                  />
                </div>
                <Button
                  onClick={handleGenerateExamples}
                  disabled={generateExamplesMutation.isPending}
                  className="w-full"
                >
                  {generateExamplesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "生成例句"
                  )}
                </Button>

                {generateExamplesMutation.data?.examples && (
                  <div className="mt-4 space-y-3">
                    <h3 className="font-semibold">生成的例句:</h3>
                    {generateExamplesMutation.data.examples.map((example: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg space-y-1">
                        <p className="font-medium">{example.japanese}</p>
                        <p className="text-sm text-muted-foreground">{example.reading}</p>
                        <p className="text-sm">{example.chinese}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
