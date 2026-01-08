import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { 
  Brain, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  Calendar,
  TrendingUp,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { VocabRuby } from "@/components/Ruby";
import { JapaneseText } from "@/components/JapaneseText";
import { useSpeech } from "@/hooks/useSpeech";

export default function Review() {
  const { isAuthenticated } = useAuth();
  const authLoading = false; // useAuth doesn't expose loading state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewType, setReviewType] = useState<"all" | "vocabulary" | "grammar">("all");

  // 获取学习统计
  const { data: stats, refetch: refetchStats } = trpc.review.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 获取待复习内容
  const { data: dueReviews, isLoading: reviewsLoading, refetch: refetchReviews } = trpc.review.getDueReviews.useQuery(
    { itemType: reviewType === "all" ? undefined : reviewType, limit: 50 },
    { enabled: isAuthenticated }
  );

  // 更新复习结果
  const updateReview = trpc.review.updateReviewResult.useMutation({
    onSuccess: () => {
      refetchStats();
      refetchReviews();
    },
  });

  const { speak, stop, isSpeaking } = useSpeech();

  // 当前复习项
  const currentReview = dueReviews?.[currentIndex];
  const totalDue = dueReviews?.length || 0;

  // 处理复习结果
  const handleReviewResult = async (quality: 1 | 2 | 3 | 4 | 5) => {
    if (!currentReview) return;

    try {
      await updateReview.mutateAsync({
        recordId: currentReview.id,
        quality,
      });

      const qualityLabels = {
        1: "忘记了",
        2: "有点困难",
        3: "一般",
        4: "记得",
        5: "完全掌握",
      };
      toast.success(`已记录: ${qualityLabels[quality]}`);

      // 移动到下一个
      setShowAnswer(false);
      if (currentIndex < totalDue - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // 复习完成
        toast.success("🎉 今日复习完成!");
        setCurrentIndex(0);
      }
    } catch (error) {
      toast.error("更新失败,请重试");
    }
  };

  // 播放发音
  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  // 未登录状态
  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">请先登录</h2>
              <p className="text-muted-foreground">登录后即可使用艾宾浩斯复习系统</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // 加载中
  if (authLoading || reviewsLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* 页面标题和统计 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-primary" />
            艾宾浩斯复习
          </h1>
          <p className="text-muted-foreground">
            基于遗忘曲线,科学安排复习时间,让记忆更持久
          </p>
        </div>

        {/* 学习统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <BookOpen className="w-4 h-4" />
                已学习
              </div>
              <div className="text-2xl font-bold">{stats?.totalLearned || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                待复习
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats?.dueReviews || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                已掌握
              </div>
              <div className="text-2xl font-bold text-green-600">{stats?.mastered || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                词汇/语法
              </div>
              <div className="text-2xl font-bold">
                {stats?.vocabularyCount || 0}/{stats?.grammarCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 复习类型选择 */}
        <Tabs value={reviewType} onValueChange={(v) => { setReviewType(v as typeof reviewType); setCurrentIndex(0); setShowAnswer(false); }} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">全部 ({stats?.dueReviews || 0})</TabsTrigger>
            <TabsTrigger value="vocabulary">词汇</TabsTrigger>
            <TabsTrigger value="grammar">语法</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 复习区域 */}
        {totalDue === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">太棒了!</h2>
              <p className="text-muted-foreground mb-4">
                当前没有需要复习的内容,去学习新内容吧!
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => window.location.href = "/vocabulary"}>
                  浏览词汇库
                </Button>
                <Button onClick={() => window.location.href = "/grammar"}>
                  浏览语法库
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>复习进度</span>
                <span>{currentIndex + 1} / {totalDue}</span>
              </div>
              <Progress value={((currentIndex + 1) / totalDue) * 100} className="h-2" />
            </div>

            {/* 复习卡片 */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={currentReview?.itemType === "vocabulary" ? "default" : "secondary"}>
                    {currentReview?.itemType === "vocabulary" ? "词汇" : "语法"}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>复习次数: {currentReview?.reviewCount || 0}</span>
                    {currentReview?.item?.jlptLevel && (
                      <Badge variant="outline">{currentReview.item.jlptLevel}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 问题面 */}
                <div className="text-center py-8">
                  {currentReview?.itemType === "vocabulary" ? (
                    <>
                      <div className="text-4xl font-bold mb-4">
                      <VocabRuby 
                        expression={(currentReview?.item as any)?.expression || ""} 
                        reading={(currentReview?.item as any)?.reading || ""} 
                      />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeak((currentReview?.item as any)?.expression || "")}
                        className="mb-4"
                      >
                        {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        <span className="ml-2">{isSpeaking ? "停止" : "朗读"}</span>
                      </Button>
                    </>
                  ) : (
                    <div className="text-3xl font-bold mb-4">
                      <JapaneseText>{(currentReview?.item as any)?.pattern || ""}</JapaneseText>
                    </div>
                  )}

                  {/* 答案区域 */}
                  {showAnswer ? (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left">
                      {currentReview?.itemType === "vocabulary" ? (
                        <>
                          <p className="text-lg mb-2">
                            <span className="text-muted-foreground">释义:</span>{" "}
                            {(currentReview?.item as any)?.meaningChinese || (currentReview?.item as any)?.meaning}
                          </p>
                          {(currentReview?.item as any)?.partOfSpeech && (
                            <p className="text-sm text-muted-foreground">
                              词性: {(currentReview?.item as any)?.partOfSpeech}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-lg mb-2">
                            <span className="text-muted-foreground">名称:</span>{" "}
                            {(currentReview?.item as any)?.name}
                          </p>
                          <p className="text-muted-foreground">
                            {(currentReview?.item as any)?.explanation}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={() => setShowAnswer(true)}
                      className="mt-4"
                    >
                      显示答案
                    </Button>
                  )}
                </div>

                {/* 记忆程度按钮 */}
                {showAnswer && (
                  <div className="mt-6 border-t pt-6">
                    <p className="text-center text-sm text-muted-foreground mb-4">你记得这个内容吗?</p>
                    <div className="grid grid-cols-5 gap-2">
                      <Button
                        variant="outline"
                        className="flex flex-col py-4 h-auto border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleReviewResult(1)}
                        disabled={updateReview.isPending}
                      >
                        <XCircle className="w-5 h-5 text-red-500 mb-1" />
                        <span className="text-xs">忘记了</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col py-4 h-auto border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                        onClick={() => handleReviewResult(2)}
                        disabled={updateReview.isPending}
                      >
                        <span className="text-orange-500 text-lg mb-1">😓</span>
                        <span className="text-xs">困难</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col py-4 h-auto border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300"
                        onClick={() => handleReviewResult(3)}
                        disabled={updateReview.isPending}
                      >
                        <span className="text-yellow-500 text-lg mb-1">🤔</span>
                        <span className="text-xs">一般</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col py-4 h-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleReviewResult(4)}
                        disabled={updateReview.isPending}
                      >
                        <span className="text-blue-500 text-lg mb-1">😊</span>
                        <span className="text-xs">记得</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col py-4 h-auto border-green-200 hover:bg-green-50 hover:border-green-300"
                        onClick={() => handleReviewResult(5)}
                        disabled={updateReview.isPending}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                        <span className="text-xs">掌握</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 导航按钮 */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setShowAnswer(false); }}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一个
              </Button>
              <Button
                variant="outline"
                onClick={() => { setCurrentIndex(Math.min(totalDue - 1, currentIndex + 1)); setShowAnswer(false); }}
                disabled={currentIndex >= totalDue - 1}
              >
                下一个
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* 复习说明 */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              艾宾浩斯遗忘曲线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              根据艾宾浩斯遗忘曲线理论,系统会在最佳时间点提醒你复习:
            </p>
            <div className="flex flex-wrap gap-2">
              {["1天后", "2天后", "4天后", "7天后", "15天后", "30天后"].map((interval, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  第{index + 1}次: {interval}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              每次复习时,根据你的记忆程度,系统会自动调整下次复习时间。
              如果忘记了,会重新开始复习周期;如果记得很好,会延长复习间隔。
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
