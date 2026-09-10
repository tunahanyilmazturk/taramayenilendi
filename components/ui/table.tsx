import { ChevronsUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

/** Wrapper that hides the table on mobile (pass a mobile list as `mobile`). */
export function DataTable({
  children,
  mobile,
  empty,
  className,
}: {
  children: ReactNode;
  mobile?: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-border bg-card shadow-card overflow-hidden rounded-2xl border", className)}>
      <div className={cn("overflow-x-auto", mobile && "hidden md:block")}>
        <table className="w-full text-left">{children}</table>
      </div>
      {mobile && <div className="divide-divider divide-y md:hidden">{mobile}</div>}
      {empty}
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-divider bg-card-muted border-b", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-divider divide-y", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-card-muted/75 transition-colors", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("text-subtle px-4 py-3 text-[10px] font-bold tracking-[0.12em] uppercase", className)}
      scope="col"
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
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
      className="text-subtle hover:text-brand inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.12em] uppercase transition-colors"
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
export function Avatar({
  text,
  size = "md",
  className,
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-8 rounded-md text-[10px]",
    md: "size-10 rounded-lg text-xs",
    lg: "size-16 rounded-xl text-lg",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "bg-brand-soft text-brand-soft-fg flex shrink-0 items-center justify-center font-bold",
        sizes[size],
        className,
      )}
    >
      {text}
    </span>
  );
}
