"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  PlusCircle,
  LayoutDashboard,
  ChevronUp,
} from "lucide-react";

interface ChatSettingsProps {
  isAdmin: boolean;
  userName: string;
  onNewConversation: () => void;
}

export function ChatSettings({ isAdmin, userName, onNewConversation }: ChatSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            <p className="font-medium truncate text-xs">{userName}</p>
          </div>
          <ChevronUp className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-56 p-1.5">
        {/* New conversation */}
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => {
            onNewConversation();
            setOpen(false);
          }}
        >
          <PlusCircle className="size-4" />
          开始新对话
        </button>

        {/* Theme */}
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
                className={`rounded p-1 transition-colors ${
                  theme === value ? "bg-muted" : "hover:bg-muted/50"
                }`}
                title={value === "light" ? "浅色" : value === "dark" ? "深色" : "系统"}
              >
                <Icon className="size-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <>
            <Separator className="my-1" />
            <Link
              href="/admin/dashboard"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4" />
              后台管理
            </Link>
          </>
        )}

        <Separator className="my-1" />

        {/* Logout */}
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
