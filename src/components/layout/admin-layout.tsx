"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  BookOpen,
  Users,
  Settings,
  Menu,
  LogOut,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "仪表盘", icon: LayoutGrid },
  { href: "/admin/knowledge-bases", label: "知识库", icon: BookOpen },
  { href: "/admin/users", label: "用户", icon: Users, requiredRole: "SUPER_ADMIN" },
  { href: "/admin/settings", label: "设置", icon: Settings },
];

function NavLinks({
  onNavigate,
  userRole,
}: {
  onNavigate?: () => void;
  userRole?: string;
}) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.requiredRole || item.requiredRole === userRole
  );

  return (
    <nav className="flex flex-col gap-0.5">
      {filteredItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ userName }: { userName: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
          />
        }
      >
          <div className="size-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">管理员</p>
          </div>
          <ChevronUp className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-56 p-1.5">
        <Link
          href="/chat"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <MessageSquare className="size-4" />
          前台问答
        </Link>

        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
          <Sun className="size-4" />
          <span className="flex-1">主题</span>
          <div className="flex gap-0.5 rounded-md border p-0.5">
            {[
              { value: "light", icon: Sun },
              { value: "dark", icon: Moon },
              { value: "system", icon: Monitor },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "rounded p-1 transition-colors",
                  theme === value ? "bg-muted" : "hover:bg-muted/50"
                )}
                title={value === "light" ? "浅色" : value === "dark" ? "深色" : "系统"}
              >
                <Icon className="size-3" />
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-1" />

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          退出登录
        </button>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | undefined>(undefined);
  const [userName, setUserName] = React.useState<string>("");

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setUserRole(json.data.role);
            setUserName(json.data.username ?? "");
          }
        }
      } catch {
        // Silently fail
      }
    })();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <BookOpen className="size-4 text-primary-foreground" />
          </div>
          <Link href="/admin/dashboard" className="font-heading font-semibold text-base">
            知识库管理
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks userRole={userRole} />
        </div>

        {/* User Menu */}
        <div className="border-t p-3">
          <UserMenu userName={userName} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar - Mobile Only */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="px-4 h-14 flex flex-row items-center border-b">
                <SheetTitle className="font-heading text-base">知识库管理</SheetTitle>
              </SheetHeader>
              <div className="px-3 py-4">
                <NavLinks
                  onNavigate={() => setMobileOpen(false)}
                  userRole={userRole}
                />
              </div>
            </SheetContent>
          </Sheet>

          <span className="font-heading font-medium">知识库系统</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
