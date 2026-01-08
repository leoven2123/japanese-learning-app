import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { VocabRuby } from "@/components/Ruby";

export default function VocabularyList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  
  const { data: vocabularyList, isLoading } = trpc.vocabulary.list.useQuery({
    jlptLevel: selectedLevel,
    search: searchTerm || undefined
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索词汇 (日文、假名、罗马音或中文)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="N5">N5</TabsTrigger>
              <TabsTrigger value="N4">N4</TabsTrigger>
              <TabsTrigger value="N3">N3</TabsTrigger>
              <TabsTrigger value="N2">N2</TabsTrigger>
              <TabsTrigger value="N1">N1</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedLevel} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : vocabularyList && vocabularyList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vocabularyList.map((vocab) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
