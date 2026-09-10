import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent title block for every panel page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  visual,
  dark = false,
  compact = false,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  visual?: string;
  dark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const darkSurface = Boolean(visual || dark);
  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-between overflow-hidden pl-1",
        compact
          ? "min-h-[94px] gap-3 py-1 sm:h-[82px] sm:min-h-[82px] sm:flex-row sm:items-center sm:gap-5"
          : "min-h-[132px] gap-4 sm:h-[104px] sm:min-h-[104px] sm:flex-row sm:items-center sm:gap-6",
        "before:bg-brand before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:content-['']",
        darkSurface && "page-header-visual text-sidebar-fg-strong",
        className,
      )}
    >
      {visual && (
        <>
          <div aria-hidden="true" className="page-header-visual-image absolute inset-0 z-0 bg-cover bg-right bg-no-repeat" style={{ backgroundImage: `url("${visual}")` }} />
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-r from-sidebar via-sidebar/90 to-sidebar/45" />
        </>
      )}
      <div className="relative z-10 min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className={cn("flex size-5 items-center justify-center rounded-md", darkSurface ? "bg-sidebar-active" : "bg-brand-soft")}>
              <span className="bg-brand size-1.5 rounded-full" />
            </span>
            <p className={cn("text-[10px] font-bold tracking-[0.16em] uppercase", darkSurface ? "text-sidebar-accent" : "text-brand")}>{eyebrow}</p>
          </div>
        )}
        <h1 className={cn(compact ? "mt-1 text-xl leading-tight font-semibold tracking-tight sm:text-2xl" : "mt-2 text-2xl leading-[1.1] font-semibold tracking-tight sm:text-[2rem]", darkSurface ? "text-sidebar-fg-strong" : "text-heading")}>
          {title}
        </h1>
        {description && <p className={cn(compact ? "mt-1 max-w-3xl text-xs leading-5" : "mt-2 max-w-3xl text-sm leading-6", darkSurface ? "text-sidebar-fg" : "text-muted")}>{description}</p>}
      </div>
      {actions && <div className={cn("relative z-10 flex w-full max-w-full shrink-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end", darkSurface && "page-header-visual-actions")}>{actions}</div>}
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
