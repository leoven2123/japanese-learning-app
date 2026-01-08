import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function SceneList() {
  const { data: scenes, isLoading } = trpc.scene.list.useQuery();

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">场景学习</h1>
            <p className="text-lg text-muted-foreground">
              通过真实生活场景学习日语
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : scenes && scenes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene) => (
                <Link key={scene.id} href={`/scenes/${scene.id}`}>
                  <Card className="h-full card-hover cursor-pointer">
                    <CardHeader>
                      <CardTitle>{scene.title}</CardTitle>
                      <CardDescription>{scene.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{scene.category}</Badge>
                        <Badge variant="outline">{scene.difficulty}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无场景数据</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
