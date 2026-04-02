"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryRewriteBadgeProps {
  original: string;
  rewritten: string;
}

export function QueryRewriteBadge({
  original,
  rewritten,
}: QueryRewriteBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80"
      >
        <ChevronRightIcon
          className={cn(
            "size-3 transition-transform",
            isOpen && "rotate-90"
          )}
        />
        已改写查询
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1 rounded-md border bg-muted/50 p-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">原始查询：</span> {original}
          </div>
          <div>
            <span className="font-medium">改写后：</span> {rewritten}
          </div>
        </div>
      )}
    </div>
  );
}
