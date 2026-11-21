"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { searchGlobalAction } from "@/actions/search.actions";
import { GlobalSearchResults } from "@/services/search.service";
import { Building2, Compass, FolderLock, KeyRound, Loader2 } from "lucide-react";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>({
    projects: [],
    clients: [],
    credentials: [],
    navigation: [],
  });
  const [isPending, startTransition] = useTransition();

  // Search when query changes (with debounce)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults({ projects: [], clients: [], credentials: [], navigation: [] });
        return;
      }
      startTransition(async () => {
        const res = await searchGlobalAction(query);
        if (!cancelled && res.success) {
          setResults(res.data);
        }
      });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const hasAnyResults =
    results.projects.length > 0 ||
    results.clients.length > 0 ||
    results.credentials.length > 0 ||
    results.navigation.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Global Search"
      description="Quickly search clients, projects, credentials, and app navigation"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search clients, projects, credentials, or pages..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isPending && (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Searching vault...</span>
            </div>
          )}

          {!isPending && query.trim() !== "" && !hasAnyResults && (
            <CommandEmpty>No matching records or pages found.</CommandEmpty>
          )}

          {!isPending && query.trim() === "" && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Type to search across clients, projects, encrypted credentials, or press{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">ESC</kbd> to exit.
            </div>
          )}

          {/* Quick Navigation Group */}
          {results.navigation.length > 0 && (
            <CommandGroup heading="Quick Navigation">
              {results.navigation.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Compass className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-xs text-foreground">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                      {item.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Projects Group */}
          {results.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {results.projects.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderLock className="size-4 text-primary shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-xs text-foreground">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={item.badge === "Archived" ? "outline" : "secondary"}
                      className="text-[10px] shrink-0 font-normal"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Clients Group */}
          {results.clients.length > 0 && (
            <CommandGroup heading="Client Organizations">
              {results.clients.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Building2 className="size-4 text-blue-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-xs text-foreground">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                      {item.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Credentials Group */}
          {results.credentials.length > 0 && (
            <CommandGroup heading="Credentials">
              {results.credentials.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <KeyRound className="size-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-xs text-foreground">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground font-mono truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 font-normal border-emerald-500/20 text-emerald-400"
                  >
                    Secret
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
