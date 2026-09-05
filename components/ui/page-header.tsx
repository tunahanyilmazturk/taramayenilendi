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
        {eyebrow && <p className="text-muted text-sm font-medium">{eyebrow}</p>}
        <h1 className="text-heading mt-1 text-2xl leading-tight font-semibold tracking-tight sm:text-[2rem]">
          {title}
        </h1>
        {description && <p className="text-muted mt-2 max-w-2xl text-sm leading-6">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({
  children,
  className,
  size = "wide",
}: {
  children: ReactNode;
  className?: string;
  size?: "wide" | "narrow";
}) {
  return (
    <main className={cn("mx-auto pb-10", size === "wide" ? "max-w-[1440px]" : "max-w-6xl", className)}>{children}</main>
  );
}
