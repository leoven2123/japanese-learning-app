import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, FileText, RefreshCw, MessageSquare, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AutoRuby } from "@/components/Ruby";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: "沉浸式学习",
      description: "通过真实生活场景学习日语，包括餐厅、购物、交通等多个主题",
      href: "/immersive"
    },
    {
      icon: FileText,
      title: "词汇与语法库",
      description: "按JLPT等级分类的完整词汇和语法库，支持搜索和详细例句",
      href: "/vocabulary"
    },
    {
      icon: RefreshCw,
      title: "艾宾浩斯复习",
      description: "基于科学记忆曲线的智能复习系统，帮助长期记忆",
      href: isAuthenticated ? "/review" : "/vocabulary"
    },
    {
      icon: MessageSquare,
      title: "AI学习助手",
      description: "个性化例句生成、语法解释和学习建议",
      href: isAuthenticated ? "/ai-assistant" : "/vocabulary"
    },
    {
      icon: TrendingUp,
      title: "学习统计",
      description: "可视化学习进度和成果，追踪每日学习数据",
      href: isAuthenticated ? "/dashboard" : "/vocabulary"
    },
    {
      icon: Award,
      title: "真实素材",
      description: "引用日剧、动漫、音乐等真实语境内容",
      href: "/immersive"
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="japanese-text text-primary block mb-4">
                <AutoRuby text="日本語[にほんご]を学[まな]ぼう" />
              </span>
              <span className="text-foreground">循序渐进，掌握日语</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              像日本本国人一样学习日语，通过真实场景和科学方法，从基础到精通
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/immersive">
                  <BookOpen className="w-5 h-5 mr-2" />
                  开始学习
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/vocabulary">
                  <FileText className="w-5 h-5 mr-2" />
                  浏览词汇库
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
            <p className="text-lg text-muted-foreground">
              全方位的日语学习体验
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} href={feature.href}>
                  <Card className="h-full card-hover cursor-pointer">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">学习路径</h2>
              <p className="text-lg text-muted-foreground">
                从零基础到流利对话
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  level: "N5 - 入门",
                  description: "掌握五十音图、基础词汇和简单句型",
                  topics: ["打招呼", "自我介绍", "购物", "餐厅点餐"]
                },
                {
                  level: "N4 - 初级",
                  description: "扩展词汇量，学习常用语法和日常对话",
                  topics: ["交通出行", "问路", "预约", "天气"]
                },
                {
                  level: "N3 - 中级",
                  description: "理解日常对话，掌握复杂语法结构",
                  topics: ["工作", "学习", "兴趣爱好", "社交"]
                },
                {
                  level: "N2/N1 - 高级",
                  description: "流利表达，理解新闻和文学作品",
                  topics: ["商务", "学术", "文化", "时事"]
                }
              ].map((stage, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      {stage.level}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {stage.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stage.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              开始你的日语学习之旅
            </h2>
            <p className="text-lg opacity-90">
              {isAuthenticated 
                ? "继续学习，每天进步一点点" 
                : "登录后解锁更多功能，包括个性化学习计划和AI助手"}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href={isAuthenticated ? "/immersive" : "/vocabulary"}>
                {isAuthenticated ? "继续学习" : "开始探索"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
