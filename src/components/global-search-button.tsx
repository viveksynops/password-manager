"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { GlobalSearchDialog } from "./global-search-dialog";

export function GlobalSearchButton() {
  const [open, setOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative h-9 w-full max-w-[220px] justify-between rounded-md bg-muted/40 px-3 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground sm:max-w-[260px]"
        aria-label="Open search command palette (Cmd+K)"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">Search vault...</span>
        </div>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
