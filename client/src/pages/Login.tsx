import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("登录成功");
      utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "登录失败");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功");
      utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "注册失败");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      toast.error("请填写用户名/邮箱和密码");
      return;
    }
    loginMutation.mutate({
      identifier: loginIdentifier,
      password: loginPassword,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword) {
      toast.error("请填写用户名和密码");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("密码至少需要6个字符");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    registerMutation.mutate({
      username: registerUsername,
      email: registerEmail || undefined,
      password: registerPassword,
      name: registerName || undefined,
    });
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity">
              <BookOpen className="w-8 h-8" />
              <span>日语学习</span>
            </div>
          </Link>
          <p className="text-muted-foreground mt-2">登录以解锁完整功能</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "欢迎回来" : "创建账号"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "输入您的账号信息登录"
                : "注册一个新账号开始学习"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">用户名或邮箱</Label>
                    <Input
                      id="login-identifier"
                      type="text"
                      placeholder="输入用户名或邮箱"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="输入密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      "登录"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">
                      用户名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="3-64个字符"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱（可选）</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">昵称（可选）</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="您的昵称"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      密码 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="至少6个字符"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">
                      确认密码 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="再次输入密码"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        注册中...
                      </>
                    ) : (
                      "注册"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/" className="text-primary hover:underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
