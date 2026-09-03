import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("rounded-2xl border border-border bg-card shadow-card", className)} {...props} />;
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
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <IconBadge icon={Icon} size="lg" />}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-heading">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
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
    md: "size-9 rounded-xl [&_svg]:size-4",
    lg: "size-10 rounded-xl [&_svg]:size-[18px]",
    xl: "size-14 rounded-2xl [&_svg]:size-6",
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
export function StatTile({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-border bg-card-muted p-3">
      <Icon className="size-4 text-brand" />
      <p className="mt-2 text-[10px] font-medium text-subtle">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

/** Summary metric card used on list pages. */
export function SummaryCard({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border bg-card-muted p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <Icon className="size-4 text-brand" />
      </div>
      <p className="mt-2 text-xl font-semibold text-heading">{value}</p>
    </div>
  );
}
