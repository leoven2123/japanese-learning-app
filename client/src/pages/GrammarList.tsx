import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GrammarList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [firstLetter, setFirstLetter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"default" | "kana">("default");
  
  const { data: grammarList, isLoading } = trpc.grammar.list.useQuery({
    jlptLevel: selectedLevel as any,
    search: searchTerm || undefined,
    firstLetter: firstLetter as any,
    sortBy: sortBy,
  });
  
  // 获取各等级语法数量
  const { data: n5Count } = trpc.grammar.list.useQuery({ jlptLevel: "N5" }, { select: (data) => data?.length || 0 });
  const { data: n4Count } = trpc.grammar.list.useQuery({ jlptLevel: "N4" }, { select: (data) => data?.length || 0 });
  const { data: n3Count } = trpc.grammar.list.useQuery({ jlptLevel: "N3" }, { select: (data) => data?.length || 0 });
  const { data: n2Count } = trpc.grammar.list.useQuery({ jlptLevel: "N2" }, { select: (data) => data?.length || 0 });
  const { data: n1Count } = trpc.grammar.list.useQuery({ jlptLevel: "N1" }, { select: (data) => data?.length || 0 });

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">语法库</h1>
            <p className="text-lg text-muted-foreground">
              按JLPT等级浏览和搜索日语语法点
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="搜索语法 (句型或释义)"
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
              <TabsList className="grid w-full grid-cols-5">
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
              </TabsList>
            </Tabs>
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
              ) : grammarList && grammarList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grammarList.map((grammar) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
