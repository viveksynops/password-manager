"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Environment } from "@/types/database.types";
import { useEnvStore } from "../store";

interface EnvSwitcherProps {
  counts: Record<Environment, number>;
}

export function EnvSwitcher({ counts }: EnvSwitcherProps) {
  const { activeEnvironment, setActiveEnvironment } = useEnvStore();

  return (
    <Tabs
      value={activeEnvironment}
      onValueChange={(val) => setActiveEnvironment(val as Environment)}
      className="w-full sm:w-auto"
    >
      <TabsList className="grid grid-cols-3 h-10 w-full sm:w-auto p-1 bg-muted/60">
        {/* Development */}
        <TabsTrigger
          value="development"
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium"
        >
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Development</span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] font-mono shrink-0 bg-muted-foreground/15"
          >
            {counts.development || 0}
          </Badge>
        </TabsTrigger>

        {/* Staging */}
        <TabsTrigger
          value="staging"
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium"
        >
          <span className="size-2 rounded-full bg-amber-500 shrink-0" />
          <span>Staging</span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] font-mono shrink-0 bg-muted-foreground/15"
          >
            {counts.staging || 0}
          </Badge>
        </TabsTrigger>

        {/* Production */}
        <TabsTrigger
          value="production"
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium"
        >
          <span className="size-2 rounded-full bg-rose-500 shrink-0" />
          <span>Production</span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] font-mono shrink-0 bg-muted-foreground/15"
          >
            {counts.production || 0}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
