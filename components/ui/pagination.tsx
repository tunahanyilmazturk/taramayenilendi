"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, pageWindow } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  noun,
  pageSizes = [5, 10, 20],
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  pageSizes?: number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  return (
    <nav
      aria-label="Sayfalama"
      className="mt-4 flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <strong className="text-foreground">
          {start}-{end}
        </strong>{" "}
        / {total} {noun} gösteriliyor
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          Sayfa başı
          <select
            aria-label={`Sayfa başına ${noun}`}
            className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-brand-outline"
            onChange={(event) => onPageSize(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button aria-label="Önceki sayfa" disabled={current === 1} onClick={() => onPage(current - 1)} size="icon-sm" variant="outline">
          <ChevronLeft />
        </Button>
        {pageWindow(current, pageCount).map((item) => (
          <button
            aria-current={item === current ? "page" : undefined}
            className={cn(
              "size-8 rounded-lg text-xs font-semibold transition-colors",
              item === current ? "bg-brand text-brand-fg" : "border border-border text-muted hover:bg-brand-soft",
            )}
            key={item}
            onClick={() => onPage(item)}
            type="button"
          >
            {item}
          </button>
        ))}
        <Button
          aria-label="Sonraki sayfa"
          disabled={current === pageCount}
          onClick={() => onPage(current + 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

/** Derives the safe page + slice for a filtered list. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  return { pageCount, safePage, items: items.slice((safePage - 1) * pageSize, safePage * pageSize) };
}
