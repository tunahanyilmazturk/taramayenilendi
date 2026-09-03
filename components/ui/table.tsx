import { ChevronsUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

/** Wrapper that hides the table on mobile (pass a mobile list as `mobile`). */
export function DataTable({ children, mobile, empty, className }: { children: ReactNode; mobile?: ReactNode; empty?: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-card", className)}>
      <div className={cn("overflow-x-auto", mobile && "hidden md:block")}>
        <table className="w-full text-left">{children}</table>
      </div>
      {mobile && <div className="divide-y divide-divider md:hidden">{mobile}</div>}
      {empty}
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-divider bg-card-muted", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-divider", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-card-muted", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-5 py-4 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase", className)}
      scope="col"
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-5 py-4 align-middle", className)} {...props} />;
}

export function SortButton<K extends string>({
  label,
  column,
  sortKey,
  direction,
  onSort,
}: {
  label: string;
  column: K;
  sortKey: K;
  direction: SortDirection;
  onSort: (column: K) => void;
}) {
  const active = sortKey === column;
  return (
    <button
      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase transition-colors hover:text-brand"
      onClick={() => onSort(column)}
      type="button"
    >
      {label}
      <ChevronsUpDown className={cn("size-3", active ? "text-brand" : "text-faint")} />
      {active && <span className="sr-only">{direction === "asc" ? "artan" : "azalan"}</span>}
    </button>
  );
}

/** Avatar with initials, used in list rows. */
export function Avatar({ text, size = "md", className }: { text: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8 rounded-lg text-[10px]", md: "size-10 rounded-xl text-xs", lg: "size-16 rounded-2xl text-lg" };
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-brand-soft font-bold text-brand-soft-fg",
        sizes[size],
        className,
      )}
    >
      {text}
    </span>
  );
}
