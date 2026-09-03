import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent title block for every panel page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-end", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-medium text-muted">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-heading">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children, className, size = "wide" }: { children: ReactNode; className?: string; size?: "wide" | "narrow" }) {
  return (
    <main className={cn("mx-auto pb-10", size === "wide" ? "max-w-[1440px]" : "max-w-6xl", className)}>{children}</main>
  );
}
