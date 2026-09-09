import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("border-border bg-card shadow-card rounded-xl border", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <IconBadge icon={Icon} size="lg" />}
        <div className="min-w-0">
          <h2 className="text-heading text-base font-semibold">{title}</h2>
          {description && <p className="text-muted mt-1 text-xs leading-5">{description}</p>}
        </div>
      </div>
      {action && <div className="flex max-w-full shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function IconBadge({
  icon: Icon,
  size = "md",
  tone = "brand",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "brand" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}) {
  const sizes = {
    sm: "size-8 rounded-lg [&_svg]:size-4",
    md: "size-9 rounded-lg [&_svg]:size-4",
    lg: "size-10 rounded-lg [&_svg]:size-[18px]",
    xl: "size-14 rounded-xl [&_svg]:size-6",
  };
  const tones = {
    brand: "bg-brand-soft text-brand-soft-fg",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
    neutral: "bg-neutral-soft text-neutral",
  };
  return (
    <span className={cn("flex shrink-0 items-center justify-center", sizes[size], tones[tone], className)}>
      <Icon />
    </span>
  );
}

/** Small "label + value" tile used in detail headers. */
export function StatTile({
  label,
  value,
  icon: Icon,
  dark = false,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        dark ? "border-sidebar-border/70 bg-sidebar-hover/35 backdrop-blur-[2px]" : "border-border bg-card-muted",
      )}
    >
      <Icon className={cn("size-4", dark ? "text-sidebar-accent" : "text-brand")} />
      <p className={cn("mt-2 text-[10px] font-medium", dark ? "text-sidebar-muted" : "text-subtle")}>{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold", dark ? "text-sidebar-fg-strong" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

/** Summary metric card used on list pages. */
export function SummaryCard({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) {
  return (
    <div className="border-border bg-card shadow-card min-w-0 rounded-xl border p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-muted text-xs">{label}</p>
        <span className="bg-brand-soft text-brand-soft-fg flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-heading mt-3 text-2xl font-semibold tracking-tight break-words tabular-nums">{value}</p>
    </div>
  );
}
