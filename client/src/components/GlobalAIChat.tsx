import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Quote, 
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  quotedText?: string;
}

export default function GlobalAIChat() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [quotedText, setQuotedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const askAI = trpc.ai.chat.useMutation();

  // 监听文本选择事件
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        // 只有当选中的文本包含日语字符时才自动引用
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(selectedText)) {
          setQuotedText(selectedText);
          if (!isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
          }
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isOpen]);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !quotedText) return;
    if (!isAuthenticated) {
      toast.error("请先登录后使用AI问答功能");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      quotedText: quotedText || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setQuotedText("");
    setIsLoading(true);

    try {
      // 构建包含引用文本的问题
      let fullQuestion = input.trim();
      if (quotedText) {
        fullQuestion = `关于这段日语内容：「${quotedText}」\n\n${input.trim() || "请帮我解释一下这段内容的含义和用法。"}`;
      }

      const result = await askAI.mutateAsync({
        message: fullQuestion,
        context: "japanese_learning",
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.reply,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("AI回复失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearQuote = () => {
    setQuotedText("");
  };

  const handleAddToLearning = async (content: string) => {
    // TODO: 实现添加到学习内容的功能
    toast.success("已添加到学习列表（功能开发中）");
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl z-50 flex flex-col max-h-[600px] border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI学习助手
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
          {/* 消息列表 */}
          <ScrollArea className="flex-1 p-4 max-h-80" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400" />
                <p className="text-sm">选中页面上的日语文本，</p>
                <p className="text-sm">或直接输入问题开始学习！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-purple-500 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {msg.quotedText && (
                        <div className="mb-2 p-2 rounded bg-purple-400/20 border-l-2 border-purple-300">
                          <p className="text-xs opacity-80 mb-1">引用内容：</p>
                          <p className="text-sm japanese-text">{msg.quotedText}</p>
                        </div>
                      )}
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => handleAddToLearning(msg.content)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加到学习
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* 引用文本显示 */}
          {quotedText && (
            <div className="mx-4 mb-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Quote className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-sm japanese-text truncate">{quotedText}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={clearQuote}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={quotedText ? "输入你的问题..." : "选中日语文本或输入问题..."}
                className="resize-none min-h-[60px]"
                rows={2}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !quotedText)}
                className="self-end bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                请先登录后使用AI问答功能
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
