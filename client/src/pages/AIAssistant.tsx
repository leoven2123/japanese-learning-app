import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BookOpen, MessageCircle, Lightbulb, ArrowRight } from "lucide-react";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: messageToSend,
        context: messages.length > 0 
          ? `对话历史:
${messages.slice(-5).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}`
          : undefined
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: typeof response.reply === 'string' ? response.reply : JSON.stringify(response.reply),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉,我遇到了一些问题。请稍后再试。",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 预设快捷提示词
  const quickPrompts = [
    {
      icon: BookOpen,
      label: "推荐学习内容",
      prompt: "根据我当前的学习进度,推荐下一阶段应该学习的内容",
      color: "text-blue-600"
    },
    {
      icon: MessageCircle,
      label: "解释语法",
      prompt: "请解释一下「は」和「が」的区别,并给出例句",
      color: "text-green-600"
    },
    {
      icon: Lightbulb,
      label: "生成例句",
      prompt: "请为「食べる」这个动词生成5个不同场景的例句",
      color: "text-amber-600"
    },
    {
      icon: Sparkles,
      label: "学习建议",
      prompt: "作为日语初学者,我应该如何高效地记忆单词?",
      color: "text-purple-600"
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI学习助手</h1>
              <p className="text-sm text-muted-foreground">
                个性化学习建议、语法解释和例句生成
              </p>
            </div>
          </div>

          {/* 快捷提示词 - 仅在无对话时显示 */}
          {messages.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSend(prompt.prompt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`${prompt.color} mt-0.5`}>
                        <prompt.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">{prompt.label}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {prompt.prompt}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 对话区域 */}
          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">开始对话</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      选择上方的快捷提示,或在下方输入框中输入您的问题
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* 输入区域 */}
            <div className="border-t p-4">
              {messages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {quickPrompts.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent whitespace-nowrap"
                      onClick={() => handleSend(prompt.prompt)}
                    >
                      <prompt.icon className="w-3 h-3 mr-1" />
                      {prompt.label}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="输入您的问题..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
