"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LLMProviderTable from "@/components/admin/llm-provider-table";
import EmbeddingModelTable from "@/components/admin/embedding-model-table";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置 LLM 提供商与 Embedding 模型
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="llm-providers" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="llm-providers">LLM 提供商</TabsTrigger>
          <TabsTrigger value="embedding-models">Embedding 模型</TabsTrigger>
        </TabsList>

        <TabsContent value="llm-providers">
          <LLMProviderTable />
        </TabsContent>

        <TabsContent value="embedding-models">
          <EmbeddingModelTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
