import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  Play, 
  Clock, 
  Target, 
  Sparkles, 
  BookOpen, 
  Music, 
  Film, 
  MessageCircle,
  ChevronRight,
  Loader2,
  Calendar,
  TrendingUp,
  Star
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AutoRuby } from "@/components/Ruby";

// 场景类型图标映射
const unitTypeIcons: Record<string, typeof BookOpen> = {
  daily_conversation: MessageCircle,
  anime_scene: Film,
  jpop_lyrics: Music,
  movie_clip: Film,
  news_article: BookOpen,
  business_japanese: Target,
};

// 场景类型中文名称
const unitTypeNames: Record<string, string> = {
  daily_conversation: "日常对话",
  anime_scene: "动漫场景",
  jpop_lyrics: "J-POP歌词",
  movie_clip: "电影片段",
  news_article: "新闻阅读",
  business_japanese: "商务日语",
};

// 难度颜色
const difficultyColors: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  3: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  4: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  5: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  6: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  7: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  8: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  9: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  10: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function ImmersiveLearning() {
  const { isAuthenticated, user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  // 获取学习单元列表
  const { data: unitsData, isLoading: unitsLoading } = trpc.immersive.getUnits.useQuery({
    unitType: selectedType !== "all" ? selectedType as any : undefined,
    jlptLevel: selectedLevel !== "all" ? selectedLevel as any : undefined,
    limit: 20,
  });

  // 获取每日学习计划
  const { data: dailyPlan, isLoading: planLoading } = trpc.immersive.getDailyPlan.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  // 生成每日学习计划
  const generatePlanMutation = trpc.immersive.generateDailyPlan.useMutation({
    onSuccess: () => {
      // 刷新计划
    }
  });

  const units = unitsData?.items || [];
  const totalUnits = unitsData?.total || 0;

  return (
    <Layout>
      <div className="container py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="japanese-text text-primary">
              <AutoRuby text="没入[もくにゅう]学習[がくしゅう]" />
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            沉浸式场景学习 - 像日本人一样学习日语
          </p>
        </div>

        {/* 今日学习计划卡片 */}
        {isAuthenticated && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">今日学习计划</CardTitle>
                    <CardDescription>
                      {dailyPlan 
                        ? `已规划 ${dailyPlan.plannedUnits?.length || 0} 个学习单元`
                        : "让AI为你规划今日学习内容"
                      }
                    </CardDescription>
                  </div>
                </div>
                {!dailyPlan && (
                  <Button 
                    onClick={() => generatePlanMutation.mutate({ targetMinutes: 30 })}
                    disabled={generatePlanMutation.isPending}
                  >
                    {generatePlanMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成学习计划
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            {dailyPlan && (
              <CardContent>
                <div className="space-y-4">
                  {/* 计划概览 */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>预计 {dailyPlan.totalPlannedMinutes || 0} 分钟</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{dailyPlan.plannedUnits?.length || 0} 个单元</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>已完成 {dailyPlan.completedUnits?.length || 0} 个</span>
                    </div>
                  </div>
                  
                  {/* AI规划理由 */}
                  {dailyPlan.aiReasoning && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">AI规划说明：</span>
                      <span className="text-muted-foreground ml-2">{dailyPlan.aiReasoning}</span>
                    </div>
                  )}
                  
                  {/* 学习进度 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>今日进度</span>
                      <span>
                        {dailyPlan.completedUnits?.length || 0} / {dailyPlan.plannedUnits?.length || 0}
                      </span>
                    </div>
                    <Progress 
                      value={
                        dailyPlan.plannedUnits?.length 
                          ? ((dailyPlan.completedUnits?.length || 0) / dailyPlan.plannedUnits.length) * 100 
                          : 0
                      } 
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 筛选标签 */}
        <div className="mb-6 space-y-4">
          {/* 类型筛选 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
            >
              全部类型
            </Button>
            {Object.entries(unitTypeNames).map(([type, name]) => {
              const Icon = unitTypeIcons[type];
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {name}
                </Button>
              );
            })}
          </div>

          {/* JLPT等级筛选 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedLevel === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedLevel("all")}
            >
              全部等级
            </Button>
            {["N5", "N4", "N3", "N2", "N1"].map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* 学习单元列表 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">学习单元</h2>
            <span className="text-sm text-muted-foreground">
              共 {totalUnits} 个单元
            </span>
          </div>

          {unitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : units.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">暂无学习单元</h3>
                <p className="text-muted-foreground mb-4">
                  学习内容正在准备中，请稍后再来
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => {
                const Icon = unitTypeIcons[unit.unitType] || BookOpen;
                return (
                  <Link key={unit.id} href={`/immersive/${unit.id}`}>
                    <Card className="h-full card-hover cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {unitTypeNames[unit.unitType] || unit.unitType}
                              </Badge>
                            </div>
                          </div>
                          <Badge className={difficultyColors[unit.difficulty] || ""}>
                            Lv.{unit.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-3 japanese-text">
                          <AutoRuby text={unit.titleJa} />
                        </CardTitle>
                        {unit.titleZh && (
                          <CardDescription className="text-sm">
                            {unit.titleZh}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        {unit.descriptionJa && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 japanese-text">
                            {unit.descriptionJa}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              10分
                            </span>
                            {unit.jlptLevel && (
                              <Badge variant="secondary" className="text-xs">
                                {unit.jlptLevel}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 快速入口 */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">快速入口</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/vocabulary">
              <Card className="card-hover cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-medium">词汇库</div>
                    <div className="text-sm text-muted-foreground">查询词汇</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/grammar">
              <Card className="card-hover cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-medium">语法库</div>
                    <div className="text-sm text-muted-foreground">学习语法</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/review">
              <Card className="card-hover cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Star className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-medium">复习</div>
                    <div className="text-sm text-muted-foreground">艾宾浩斯</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/ai-assistant">
              <Card className="card-hover cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-medium">AI助手</div>
                    <div className="text-sm text-muted-foreground">智能问答</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
