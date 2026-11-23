"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CredentialSummary } from "@/services/credential.service";
import { EnvVariableSummary } from "@/services/env.service";
import { ShareItemInput } from "@/features/share-links/schemas";
import { KeyRound, FileCode2, Search, CheckSquare, Square } from "lucide-react";

interface ItemPickerProps {
  credentials: CredentialSummary[];
  envVariables: EnvVariableSummary[];
  selectedItems: ShareItemInput[];
  onChange: (items: ShareItemInput[]) => void;
}

export function ItemPicker({
  credentials,
  envVariables,
  selectedItems,
  onChange,
}: ItemPickerProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credential" | "env_variable">("all");

  const isSelected = (itemType: "credential" | "env_variable", itemId: string) => {
    return selectedItems.some((it) => it.itemType === itemType && it.itemId === itemId);
  };

  const toggleItem = (itemType: "credential" | "env_variable", itemId: string) => {
    if (isSelected(itemType, itemId)) {
      onChange(selectedItems.filter((it) => !(it.itemType === itemType && it.itemId === itemId)));
    } else {
      onChange([...selectedItems, { itemType, itemId }]);
    }
  };

  const filteredCredentials = credentials.filter((c) =>
    c.service_name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEnvVariables = envVariables.filter((e) =>
    e.key.toLowerCase().includes(search.toLowerCase()) ||
    e.environment.toLowerCase().includes(search.toLowerCase())
  );

  const selectAllVisible = () => {
    const newItems = [...selectedItems];
    if (filterType === "all" || filterType === "credential") {
      for (const cred of filteredCredentials) {
        if (!newItems.some((it) => it.itemType === "credential" && it.itemId === cred.id)) {
          newItems.push({ itemType: "credential", itemId: cred.id });
        }
      }
    }
    if (filterType === "all" || filterType === "env_variable") {
      for (const env of filteredEnvVariables) {
        if (!newItems.some((it) => it.itemType === "env_variable" && it.itemId === env.id)) {
          newItems.push({ itemType: "env_variable", itemId: env.id });
        }
      }
    }
    onChange(newItems);
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant={filterType === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={filterType === "credential" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFilterType("credential")}
          >
            Credentials
          </Button>
          <Button
            type="button"
            variant={filterType === "env_variable" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFilterType("env_variable")}
          >
            Env Vars
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Selected: {selectedItems.length} items</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <CheckSquare className="size-3.5" /> Select Visible
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={deselectAll}
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <Square className="size-3.5" /> Clear All
          </button>
        </div>
      </div>

      <div className="border rounded-md divide-y max-h-64 overflow-y-auto bg-muted/20">
        {(filterType === "all" || filterType === "credential") && filteredCredentials.length > 0 && (
          <div>
            <div className="bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Credentials ({filteredCredentials.length})
            </div>
            {filteredCredentials.map((cred) => {
              const checked = isSelected("credential", cred.id);
              return (
                <label
                  key={cred.id}
                  className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleItem("credential", cred.id)}
                  />
                  <KeyRound className="size-3.5 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground truncate block">
                      {cred.service_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {cred.username}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Credential
                  </Badge>
                </label>
              );
            })}
          </div>
        )}

        {(filterType === "all" || filterType === "env_variable") && filteredEnvVariables.length > 0 && (
          <div>
            <div className="bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Environment Variables ({filteredEnvVariables.length})
            </div>
            {filteredEnvVariables.map((env) => {
              const checked = isSelected("env_variable", env.id);
              return (
                <label
                  key={env.id}
                  className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleItem("env_variable", env.id)}
                  />
                  <FileCode2 className="size-3.5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0 font-mono">
                    <span className="font-medium text-foreground truncate block">
                      {env.key}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                    {env.environment}
                  </Badge>
                </label>
              );
            })}
          </div>
        )}

        {filteredCredentials.length === 0 && filteredEnvVariables.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No credentials or environment variables found.
          </div>
        )}
      </div>
    </div>
  );
}
