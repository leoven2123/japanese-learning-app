import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Loader2, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VocabRuby } from "@/components/Ruby";
import { JapaneseInput } from "@/components/JapaneseInput";

export default function VocabularyList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1" | "slang">("N5");
  const [firstLetter, setFirstLetter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"default" | "kana">("default");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const { data: vocabularyList, isLoading } = trpc.vocabulary.list.useQuery({
    jlptLevel: selectedLevel === "slang" ? undefined : selectedLevel as any,
    search: searchTerm || undefined,
    firstLetter: firstLetter as any,
    sortBy: sortBy,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  
  // 当筛选条件改变时重置页码
  useEffect(() => {
    setPage(1);
  }, [selectedLevel, searchTerm, firstLetter, sortBy]);
  
  // 获取各等级词汇数量
  const { data: n5Data } = trpc.vocabulary.list.useQuery({ jlptLevel: "N5", limit: 1 });
  const { data: n4Data } = trpc.vocabulary.list.useQuery({ jlptLevel: "N4", limit: 1 });
  const { data: n3Data } = trpc.vocabulary.list.useQuery({ jlptLevel: "N3", limit: 1 });
  const { data: n2Data } = trpc.vocabulary.list.useQuery({ jlptLevel: "N2", limit: 1 });
  const { data: n1Data } = trpc.vocabulary.list.useQuery({ jlptLevel: "N1", limit: 1 });
  const { data: slangData } = trpc.vocabulary.list.useQuery({ jlptLevel: undefined, limit: 1 });
  
  const n5Count = n5Data?.total || 0;
  const n4Count = n4Data?.total || 0;
  const n3Count = n3Data?.total || 0;
  const n2Count = n2Data?.total || 0;
  const n1Count = n1Data?.total || 0;
  const slangCount = slangData?.items.filter(v => v.category === 'slang').length || 0;

  const { data: slangStatus } = trpc.slang.getUpdateStatus.useQuery();
  const updateSlangMutation = trpc.slang.updateSlangWords.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("热词更新成功", {
          description: `新增 ${result.addedCount} 个，更新 ${result.updatedCount} 个热词`,
        });
      } else {
        toast.error("热词更新失败", {
          description: result.error || "未知错误",
        });
      }
    },
    onError: (error) => {
      toast.error("热词更新失败", {
        description: error.message,
      });
    },
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">词汇库</h1>
            <p className="text-lg text-muted-foreground">
              按JLPT等级浏览和搜索日语词汇
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
              <JapaneseInput
                placeholder="搜索词汇 (日文、假名、罗马音或中文)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">首字母:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={firstLetter === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFirstLetter(undefined)}
                >
                  全部
                </Button>
                {[
                  { label: "あ行", value: "a" },
                  { label: "か行", value: "ka" },
                  { label: "さ行", value: "sa" },
                  { label: "た行", value: "ta" },
                  { label: "な行", value: "na" },
                  { label: "は行", value: "ha" },
                  { label: "ま行", value: "ma" },
                  { label: "や行", value: "ya" },
                  { label: "ら行", value: "ra" },
                  { label: "わ行", value: "wa" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant={firstLetter === item.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFirstLetter(item.value)}
                    className="japanese-text"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">排序:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认排序</SelectItem>
                    <SelectItem value="kana">五十音图</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)} className="flex-1">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="N5">
                  N5 {n5Count !== undefined && <span className="ml-1 text-xs opacity-70">({n5Count})</span>}
                </TabsTrigger>
                <TabsTrigger value="N4">
                  N4 {n4Count !== undefined && <span className="ml-1 text-xs opacity-70">({n4Count})</span>}
                </TabsTrigger>
                <TabsTrigger value="N3">
                  N3 {n3Count !== undefined && <span className="ml-1 text-xs opacity-70">({n3Count})</span>}
                </TabsTrigger>
                <TabsTrigger value="N2">
                  N2 {n2Count !== undefined && <span className="ml-1 text-xs opacity-70">({n2Count})</span>}
                </TabsTrigger>
                <TabsTrigger value="N1">
                  N1 {n1Count !== undefined && <span className="ml-1 text-xs opacity-70">({n1Count})</span>}
                </TabsTrigger>
                <TabsTrigger value="slang" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  热词 {slangCount !== undefined && <span className="ml-1 text-xs opacity-70">({slangCount})</span>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {selectedLevel === "slang" && (
              <div className="flex items-center gap-3">
                {slangStatus && slangStatus.lastUpdateTime && (
                  <span className="text-sm text-muted-foreground">
                    最后更新: {new Date(slangStatus.lastUpdateTime).toLocaleDateString()}
                  </span>
                )}
                <Button
                  onClick={() => updateSlangMutation.mutate()}
                  disabled={updateSlangMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  {updateSlangMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      更新热词
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
            <div className="hidden">
              <TabsList>
                <TabsTrigger value={selectedLevel}>{selectedLevel}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedLevel} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : vocabularyList && vocabularyList.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">                  {vocabularyList?.items.map((vocab) => (
                    <Link key={vocab.id} href={`/vocabulary/${vocab.id}`}>
                      <Card className="h-full card-hover cursor-pointer">
                        <CardHeader>
                          <CardTitle className="flex items-start justify-between gap-2">
                            <span className="japanese-text text-2xl">
                              <VocabRuby 
                                expression={vocab.expression} 
                                reading={vocab.reading} 
                              />
                            </span>
                            <Badge variant="secondary" className="shrink-0">
                              {vocab.jlptLevel}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="text-base">{vocab.reading}</div>
                            {vocab.romaji && (
                              <div className="text-sm text-muted-foreground">{vocab.romaji}</div>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{vocab.meaning}</p>
                          {vocab.partOfSpeech && (
                            <Badge variant="outline" className="mt-2">
                              {vocab.partOfSpeech}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm ? "未找到匹配的词汇" : "暂无词汇数据"}
                    </p>
                  </CardContent>
                </Card>
              )}
                            {/* 分页控件 */}
              {vocabularyList && vocabularyList.items.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    第 {page} 页 / 共 {Math.ceil(vocabularyList.total / pageSize)} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(vocabularyList.total / pageSize)}
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
