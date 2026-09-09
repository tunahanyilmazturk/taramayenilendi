import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VisualFilterSurface({
  visual,
  children,
  className,
}: {
  visual: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("visual-filter-surface relative isolate overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar p-4 shadow-primary sm:p-5", className)}>
      <div aria-hidden="true" className="page-header-visual-image absolute inset-0 z-0 bg-cover bg-right bg-no-repeat" style={{ backgroundImage: `url("${visual}")` }} />
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-br from-sidebar/58 via-sidebar/36 to-sidebar/12" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
