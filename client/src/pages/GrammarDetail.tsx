import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, Sparkles, MessageSquare } from "lucide-react";
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
                          toast.success("已生成例句,请查看下方内容");
                          console.log(result);
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
                          toast.success("已生成对话场景,请查看下方内容");
                          console.log(result);
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
        </div>
      </div>
    </Layout>
  );
}
