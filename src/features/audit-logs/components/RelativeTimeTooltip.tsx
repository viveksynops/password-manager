"use client";

import React, { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelativeTimeTooltipProps {
  timestamp: string;
  className?: string;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds)) return dateString;

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Yesterday at ${timeStr}`;
  }
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function RelativeTimeTooltip({ timestamp, className = "" }: RelativeTimeTooltipProps) {
  const relativeText = useMemo(() => formatRelativeTime(timestamp), [timestamp]);

  const fullDateTime = useMemo(() => {
    try {
      const d = new Date(timestamp);
      return `${d.toLocaleString()} (${d.toISOString()})`;
    } catch {
      return timestamp;
    }
  }, [timestamp]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={`font-mono text-xs text-muted-foreground hover:text-foreground cursor-default transition-colors underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 ${className}`}
            />
          }
        >
          {relativeText}
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-[11px] p-2 max-w-xs">
          {fullDateTime}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
