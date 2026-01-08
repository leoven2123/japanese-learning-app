import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JapaneseInput } from "@/components/JapaneseInput";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 五十音行数据
const kanaRows = [
  { label: "あ", value: "a", kana: "あ行" },
  { label: "か", value: "ka", kana: "か行" },
  { label: "さ", value: "sa", kana: "さ行" },
  { label: "た", value: "ta", kana: "た行" },
  { label: "な", value: "na", kana: "な行" },
  { label: "は", value: "ha", kana: "は行" },
  { label: "ま", value: "ma", kana: "ま行" },
  { label: "や", value: "ya", kana: "や行" },
  { label: "ら", value: "ra", kana: "ら行" },
  { label: "わ", value: "wa", kana: "わ行" },
];

export default function GrammarList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [firstLetter, setFirstLetter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"default" | "kana">("default");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const pageSize = 50;
  
  const { data: grammarList, isLoading } = trpc.grammar.list.useQuery({
    jlptLevel: selectedLevel as any,
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
  
  // 获取各等级语法数量
  const { data: n5Data } = trpc.grammar.list.useQuery({ jlptLevel: "N5", limit: 1 });
  const { data: n4Data } = trpc.grammar.list.useQuery({ jlptLevel: "N4", limit: 1 });
  const { data: n3Data } = trpc.grammar.list.useQuery({ jlptLevel: "N3", limit: 1 });
  const { data: n2Data } = trpc.grammar.list.useQuery({ jlptLevel: "N2", limit: 1 });
  const { data: n1Data } = trpc.grammar.list.useQuery({ jlptLevel: "N1", limit: 1 });
  
  const n5Count = n5Data?.total || 0;
  const n4Count = n4Data?.total || 0;
  const n3Count = n3Data?.total || 0;
  const n2Count = n2Data?.total || 0;
  const n1Count = n1Data?.total || 0;

  // 计算活跃筛选数量
  const activeFilters = (firstLetter ? 1 : 0) + (sortBy !== "default" ? 1 : 0);

  // 清除所有筛选
  const clearFilters = () => {
    setFirstLetter(undefined);
    setSortBy("default");
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 标题区域 */}
          <div>
            <h1 className="text-4xl font-bold mb-2">语法库</h1>
            <p className="text-lg text-muted-foreground">
              按JLPT等级浏览和搜索日语语法点
            </p>
          </div>

          {/* 搜索和筛选工具栏 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <JapaneseInput
                placeholder="搜索语法..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* 筛选和排序按钮组 */}
            <div className="flex gap-2">
              {/* 首字母筛选 - Popover */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="default"
                    className={cn(
                      "gap-2 h-10",
                      firstLetter && "border-primary bg-primary/5"
                    )}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {firstLetter ? kanaRows.find(k => k.value === firstLetter)?.kana : "首字母"}
                    </span>
                    {firstLetter && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                        {kanaRows.find(k => k.value === firstLetter)?.label}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">按首字母筛选</span>
                      {firstLetter && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            setFirstLetter(undefined);
                            setFilterOpen(false);
                          }}
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {kanaRows.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setFirstLetter(firstLetter === item.value ? undefined : item.value);
                            setFilterOpen(false);
                          }}
                          className={cn(
                            "w-10 h-10 rounded-lg text-base font-medium transition-all",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            firstLetter === item.value 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "bg-muted/50"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* 排序下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="default"
                    className={cn(
                      "gap-2 h-10",
                      sortBy !== "default" && "border-primary bg-primary/5"
                    )}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {sortBy === "default" ? "排序" : "五十音"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>排序方式</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setSortBy("default")}
                    className={cn(sortBy === "default" && "bg-accent")}
                  >
                    默认排序
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("kana")}
                    className={cn(sortBy === "kana" && "bg-accent")}
                  >
                    五十音图顺序
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 清除筛选按钮 */}
              {activeFilters > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* JLPT等级标签页 */}
          <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)} className="flex-1">
            <TabsList className="h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="N5" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <span className="font-semibold">N5</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{n5Count}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="N4"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <span className="font-semibold">N4</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{n4Count}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="N3"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <span className="font-semibold">N3</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{n3Count}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="N2"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <span className="font-semibold">N2</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{n2Count}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="N1"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <span className="font-semibold">N1</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{n1Count}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 当前筛选状态提示 */}
          {(firstLetter || sortBy !== "default") && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>当前筛选:</span>
              {firstLetter && (
                <Badge variant="secondary" className="gap-1">
                  {kanaRows.find(k => k.value === firstLetter)?.kana}
                  <button 
                    onClick={() => setFirstLetter(undefined)}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {sortBy !== "default" && (
                <Badge variant="secondary" className="gap-1">
                  五十音排序
                  <button 
                    onClick={() => setSortBy("default")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* 语法列表 */}
          <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
            <div className="hidden">
              <TabsList>
                <TabsTrigger value={selectedLevel}>{selectedLevel}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedLevel} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : grammarList && grammarList.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grammarList?.items.map((grammar) => (
                    <Link key={grammar.id} href={`/grammar/${grammar.id}`}>
                      <Card className="h-full card-hover cursor-pointer">
                        <CardHeader>
                          <CardTitle className="flex items-start justify-between gap-2">
                            <span className="japanese-text text-xl">
                              {grammar.pattern}
                            </span>
                            <Badge variant="secondary" className="shrink-0">
                              {grammar.jlptLevel}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-base">
                            {grammar.meaning}
                          </CardDescription>
                        </CardHeader>
                        {grammar.usage && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {grammar.usage}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm ? "未找到匹配的语法" : "暂无语法数据"}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* 分页控件 */}
              {grammarList && grammarList.items.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                  <div className="flex items-center gap-1 px-3">
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{Math.ceil(grammarList.total / pageSize)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(grammarList.total / pageSize)}
                    className="gap-1"
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
