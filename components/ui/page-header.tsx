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
    <div
      className={cn(
        "relative flex flex-col justify-between gap-5 overflow-hidden pl-1 sm:flex-row sm:items-end sm:gap-8",
        "before:bg-brand before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:content-['']",
        className,
      )}
    >
      <div className="relative z-10 min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="bg-brand-soft flex size-5 items-center justify-center rounded-md">
              <span className="bg-brand size-1.5 rounded-full" />
            </span>
            <p className="text-brand text-[10px] font-bold tracking-[0.16em] uppercase">{eyebrow}</p>
          </div>
        )}
        <h1 className="text-heading mt-2 text-2xl leading-[1.1] font-semibold tracking-tight sm:text-[2.1rem]">
          {title}
        </h1>
        {description && <p className="text-muted mt-2 max-w-3xl text-sm leading-6">{description}</p>}
      </div>
      {actions && <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
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
