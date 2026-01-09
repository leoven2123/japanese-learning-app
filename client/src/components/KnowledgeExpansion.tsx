import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  History, 
  Globe, 
  Lightbulb, 
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Sparkles,
  RefreshCw,
  Languages
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AutoRuby } from "@/components/Ruby";
import { RichTextWithJapanese } from "@/components/RichTextWithJapanese";

interface KnowledgeExpansionProps {
  unitId: number;
}

// 知识扩展内容类型
interface KnowledgeContent {
  sceneApplications?: {
    title: string;
    mainScenes: Array<{
      scene: string;
      description: string;
      example: string;
      exampleReading: string;
      exampleTranslation?: string;
    }>;
    variations: Array<{
      context: string;
      expression: string;
      expressionReading: string;
      expressionTranslation?: string;
      explanation: string;
    }>;
  };
  languageOrigin?: {
    title: string;
    etymology: string;
    historicalDevelopment: string;
    keyMilestones: Array<{
      period: string;
      event: string;
    }>;
  };
  ancientVsModern?: {
    title: string;
    introduction: string;
    comparisons: Array<{
      aspect: string;
      ancient: string;
      modern: string;
      explanation: string;
    }>;
  };
  culturalBackground?: {
    title: string;
    content: string;
    customs: Array<{
      name: string;
      description: string;
    }>;
  };
  learningTips?: {
    title: string;
    tips: string[];
    commonMistakes: Array<{
      mistake: string;
      correction: string;
    }>;
  };
  references?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  generatedAt?: string;
}

// 可折叠的知识卡片组件
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  accentColor = "primary"
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorClasses: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    violet: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
    rose: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
  };
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[accentColor]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>
      {isOpen && (
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export function KnowledgeExpansion({ unitId }: KnowledgeExpansionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCheckedCache, setHasCheckedCache] = useState(false);
  
  // 始终查询缓存内容
  const { data: cachedContent, isLoading: isLoadingCache, refetch } = trpc.immersive.getKnowledgeExpansion.useQuery(
    { unitId }
  );
  
  // 当缓存加载完成后，如果有内容则自动展开
  useEffect(() => {
    if (!isLoadingCache && !hasCheckedCache) {
      if (cachedContent) {
        setIsExpanded(true);
      }
      setHasCheckedCache(true);
    }
  }, [isLoadingCache, cachedContent, hasCheckedCache]);
  
  // 生成知识扩展内容
  const generateMutation = trpc.immersive.generateKnowledgeExpansion.useMutation({
    onSuccess: () => {
      refetch();
    }
  });
  
  const content = cachedContent as KnowledgeContent | null;
  const isLoading = isLoadingCache || generateMutation.isPending;
  
  const handleGenerate = () => {
    generateMutation.mutate({ unitId });
  };
  
  if (!isExpanded) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">知识扩展</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              深入了解这些表达的场景应用、语言起源、古今对比和文化背景，探索日语的古与今
            </p>
            <Button onClick={() => setIsExpanded(true)} className="gap-2">
              <BookOpen className="w-4 h-4" />
              展开知识扩展
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading && !content) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {generateMutation.isPending ? "正在生成知识扩展内容..." : "加载中..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!content) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">生成知识扩展</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              AI将为您生成详细的知识扩展内容，包括场景应用、语言起源、古今对比等
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成知识扩展
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">知识扩展</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            重新生成
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            收起
          </Button>
        </div>
      </div>
      
      {/* 场景应用 */}
      {content.sceneApplications && (
        <CollapsibleSection 
          title={content.sceneApplications.title || "场景应用"} 
          icon={Globe}
          defaultOpen={true}
          accentColor="primary"
        >
          <div className="space-y-4">
            {/* 主要场景 */}
            {content.sceneApplications.mainScenes?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">主要使用场景</h4>
                <div className="space-y-3">
                  {content.sceneApplications.mainScenes.map((scene, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="shrink-0">{scene.scene}</Badge>
                      </div>
                      <RichTextWithJapanese text={scene.description} className="text-sm text-muted-foreground mb-2" />
                      <div className="p-2 rounded bg-background border">
                        <RichTextWithJapanese text={scene.example} className="text-sm japanese-text" />
                        {scene.exampleReading && (
                          <p className="text-xs text-muted-foreground mt-1">{scene.exampleReading}</p>
                        )}
                        {scene.exampleTranslation && (
                          <p className="text-sm text-primary/80 mt-1 pt-1 border-t border-dashed flex items-start gap-1.5">
                            <Languages className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                            <span>{scene.exampleTranslation}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 变体表达 */}
            {content.sceneApplications.variations?.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">场景变体</h4>
                <div className="space-y-3">
                  {content.sceneApplications.variations.map((variation, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{variation.context}</Badge>
                      </div>
                      <RichTextWithJapanese text={variation.expression} className="font-medium japanese-text mb-1" />
                      {variation.expressionTranslation && (
                        <p className="text-sm text-primary/80 mb-1 flex items-start gap-1.5">
                          <Languages className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                          <span>{variation.expressionTranslation}</span>
                        </p>
                      )}
                      <RichTextWithJapanese text={variation.explanation} className="text-sm text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
      
      {/* 语言起源 */}
      {content.languageOrigin && (
        <CollapsibleSection 
          title={content.languageOrigin.title || "语言起源"} 
          icon={History}
          accentColor="amber"
        >
          <div className="space-y-4">
            {/* 词源 */}
            {content.languageOrigin.etymology && (
              <div>
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">词源解析</h4>
                <RichTextWithJapanese text={content.languageOrigin.etymology} className="text-sm leading-relaxed" />
              </div>
            )}
            
            {/* 历史发展 */}
            {content.languageOrigin.historicalDevelopment && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">历史发展</h4>
                <RichTextWithJapanese text={content.languageOrigin.historicalDevelopment} className="text-sm leading-relaxed" />
              </div>
            )}
            
            {/* 关键里程碑 */}
            {content.languageOrigin.keyMilestones?.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">发展历程</h4>
                <div className="relative pl-4 border-l-2 border-amber-200 dark:border-amber-800 space-y-4">
                  {content.languageOrigin.keyMilestones.map((milestone, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-amber-500" />
                      <div className="pl-4">
                        <span className="font-medium text-amber-600 dark:text-amber-400">{milestone.period}</span>
                        <RichTextWithJapanese text={milestone.event} className="text-sm text-muted-foreground mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
      
      {/* 古今对比 */}
      {content.ancientVsModern && (
        <CollapsibleSection 
          title={content.ancientVsModern.title || "古今对比"} 
          icon={BookOpen}
          accentColor="violet"
        >
          <div className="space-y-4">
            {content.ancientVsModern.introduction && (
              <RichTextWithJapanese text={content.ancientVsModern.introduction} className="text-sm leading-relaxed" />
            )}
            
            {content.ancientVsModern.comparisons?.length > 0 && (
              <div className="space-y-3">
                {content.ancientVsModern.comparisons.map((comparison, index) => (
                  <div key={index} className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2">
                      <span className="font-medium">{comparison.aspect}</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">古代日语</span>
                        <RichTextWithJapanese text={comparison.ancient} className="text-sm japanese-text" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">现代日语</span>
                        <RichTextWithJapanese text={comparison.modern} className="text-sm japanese-text" />
                      </div>
                    </div>
                    {comparison.explanation && (
                      <div className="px-3 pb-3">
                        <RichTextWithJapanese text={comparison.explanation} className="text-xs text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
      
      {/* 文化背景 */}
      {content.culturalBackground && (
        <CollapsibleSection 
          title={content.culturalBackground.title || "文化背景"} 
          icon={Lightbulb}
          accentColor="emerald"
        >
          <div className="space-y-4">
            {content.culturalBackground.content && (
              <RichTextWithJapanese text={content.culturalBackground.content} className="text-sm leading-relaxed" />
            )}
            
            {content.culturalBackground.customs?.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">相关习俗</h4>
                <div className="space-y-3">
                  {content.culturalBackground.customs.map((custom, index) => (
                    <div key={index} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <span className="font-medium text-emerald-700 dark:text-emerald-300">{custom.name}</span>
                      <RichTextWithJapanese text={custom.description} className="text-sm text-muted-foreground mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
      
      {/* 学习建议 */}
      {content.learningTips && (
        <CollapsibleSection 
          title={content.learningTips.title || "学习建议"} 
          icon={GraduationCap}
          accentColor="rose"
        >
          <div className="space-y-4">
            {/* 学习技巧 */}
            {content.learningTips.tips?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">学习技巧</h4>
                <ul className="space-y-2">
                  {content.learningTips.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-xs font-medium text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <RichTextWithJapanese text={tip} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 常见错误 */}
            {content.learningTips.commonMistakes?.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">常见错误</h4>
                <div className="space-y-3">
                  {content.learningTips.commonMistakes.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="destructive" className="shrink-0">错误</Badge>
                        <RichTextWithJapanese text={item.mistake} className="text-sm" />
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="default" className="shrink-0 bg-green-600">正确</Badge>
                        <RichTextWithJapanese text={item.correction} className="text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
      
      {/* 参考来源 */}
      {content.references && content.references.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              参考来源
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {content.references.map((ref, index) => (
                <a
                  key={index}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {ref.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {ref.description && (
                    <RichTextWithJapanese text={ref.description} className="text-xs text-muted-foreground mt-1" />
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 生成时间 */}
      {content.generatedAt && (
        <p className="text-xs text-muted-foreground text-center">
          内容生成于 {new Date(content.generatedAt).toLocaleString('zh-CN')}
        </p>
      )}
    </div>
  );
}
