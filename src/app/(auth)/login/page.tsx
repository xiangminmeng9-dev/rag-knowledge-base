"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(6, "密码不能少于6个字符"),
});

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn("credentials", { username, password, redirect: false });
      if (!result) { setError("发生意外错误，请重试。"); return; }
      if (result.error) { setError("用户名或密码错误，或者账号已被禁用。"); return; }
      if (result.url && !result.url.includes("login") && new URL(result.url).pathname !== "/") {
        router.push(result.url);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("发生意外错误，请重试。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Visual */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-gradient-to-br from-[oklch(0.35_0.08_35)] via-[oklch(0.30_0.06_40)] to-[oklch(0.25_0.05_260)]">
        {/* Organic shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[oklch(0.55_0.12_40_/_0.3)] blur-[100px]" />
          <div className="absolute top-1/3 -left-24 w-[400px] h-[400px] rounded-full bg-[oklch(0.50_0.10_165_/_0.2)] blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[oklch(0.60_0.12_290_/_0.15)] blur-[60px]" />
        </div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 xl:p-20 2xl:p-24 pb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/60 w-fit mb-8 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-amber-300" />
            企业级知识管理平台
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            让知识
            <br />
            <span className="text-[oklch(0.75_0.12_50)]">触手可及</span>
          </h1>

          <p className="text-lg text-white/50 max-w-md leading-relaxed mb-12">
            基于智能语义检索的知识库问答系统，让团队协作更高效，知识沉淀更有价值。
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-6">
            {[
              { label: "智能切分", value: "5+" },
              { label: "文档格式", value: "4" },
              { label: "语义检索", value: "RAG" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="font-heading font-bold text-white">{item.value}</span>
                </div>
                <span className="text-sm text-white/40">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="font-heading text-2xl font-bold">知识库系统</h1>
            <p className="text-sm text-muted-foreground mt-1">智能问答平台</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight">欢迎回来</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              登录以访问您的知识库
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                className="h-11 bg-card"
              />
              {fieldErrors.username && (
                <p className="text-xs text-destructive">{fieldErrors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="h-11 bg-card"
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-medium group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  正在登录...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/50 mt-10">
            RAG 知识库 v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
