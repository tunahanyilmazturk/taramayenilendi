"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ListViewToggleProps = {
  value: "cards" | "list" | "table";
  onCards: () => void;
  onList: () => void;
  label?: string;
};

export function ListViewToggle({ value, onCards, onList, label = "Görünüm" }: ListViewToggleProps) {
  const listActive = value === "list" || value === "table";

  return (
    <div aria-label={label} className="list-view-toggle inline-flex h-10 shrink-0 items-center rounded-xl border border-border bg-card p-1" role="group">
      <button
        aria-label="Kart görünümü"
        aria-pressed={value === "cards"}
        className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", value === "cards" ? "bg-brand-soft text-brand-soft-fg" : "text-muted hover:text-foreground")}
        onClick={onCards}
        title="Kart görünümü"
        type="button"
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        aria-label="Liste görünümü"
        aria-pressed={listActive}
        className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", listActive ? "bg-brand-soft text-brand-soft-fg" : "text-muted hover:text-foreground")}
        onClick={onList}
        title="Liste görünümü"
        type="button"
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
