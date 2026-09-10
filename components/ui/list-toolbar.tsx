"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountPill } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/field";
import { ListViewToggle } from "@/components/ui/list-view-toggle";
import { cn } from "@/lib/utils";

export function ListToolbar({ title, description, count, query, onQuery, placeholder, view, onCards, onList, advancedOpen, onAdvanced, children, className, light = false }: { title: string; description: string; count: number; query: string; onQuery: (value: string) => void; placeholder: string; view: "table" | "cards" | "list"; onCards: () => void; onList: () => void; advancedOpen: boolean; onAdvanced: () => void; children?: ReactNode; className?: string; light?: boolean }) {
  return <Card aria-label={`${title} gelişmiş filtreleri`} className={cn("mt-4 rounded-xl p-3 shadow-none sm:p-4", light ? "border-border bg-card" : "border-sidebar-border/70 bg-sidebar/35", className)}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><h2 className={cn("truncate text-sm font-semibold", light ? "text-heading" : "text-sidebar-fg-strong")}>{title}</h2><CountPill>{count} kayıt</CountPill></div><p className={cn("mt-1 hidden truncate text-xs sm:block", light ? "text-muted" : "text-sidebar-fg/75")}>{description}</p></div><Button onClick={onAdvanced} size="sm" variant={advancedOpen ? "soft" : "outline"}><SlidersHorizontal /> {advancedOpen ? "Filtreleri gizle" : "Gelişmiş filtreler"}</Button></div>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><SearchInput aria-label={`${title} ara`} className="min-w-0 flex-1" onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} value={query} /><ListViewToggle onCards={onCards} onList={onList} value={view === "list" ? "list" : view} /></div>
    {advancedOpen && <div className="border-divider mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>}
  </Card>;
}
