"use client";

import * as React from "react";

interface ChatLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChatLayout({
  sidebar,
  children,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex-1 overflow-y-auto">
          {sidebar}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
