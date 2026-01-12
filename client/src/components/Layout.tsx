import { useAuth } from "@/_core/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  BookOpen, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  RefreshCw,
  Menu,
  X,
  LogIn,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import GlobalAIChat from "@/components/GlobalAIChat";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("退出登录成功");
      window.location.reload();
    } catch (error) {
      toast.error("退出登录失败");
    }
  };

  const navItems = [
    { href: "/", label: "首页", icon: LayoutDashboard },
    { href: "/immersive", label: "沉浸学习", icon: BookOpen },
    { href: "/vocabulary", label: "词汇库", icon: FileText },
    { href: "/grammar", label: "语法库", icon: FileText },
    ...(isAuthenticated ? [
      { href: "/review", label: "复习", icon: RefreshCw },
      { href: "/dashboard", label: "学习统计", icon: LayoutDashboard },
      { href: "/ai-assistant", label: "AI助手", icon: MessageSquare },
    ] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="flex items-center gap-2 font-semibold text-lg sm:text-xl cursor-pointer">
                <span className="japanese-text text-primary whitespace-nowrap">日本語</span>
                <span className="text-muted-foreground text-sm whitespace-nowrap">学习应用</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}>
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {user.name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="container py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span 
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              
              <div className="border-t pt-4 mt-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      {user.name || user.email}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      登录
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* 全局AI问答气泡窗 */}
      <GlobalAIChat />

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2026 日语学习应用. 循序渐进，掌握日语。
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="japanese-text">頑張ってください！</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
