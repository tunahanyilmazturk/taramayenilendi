import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-card text-center",
        compact ? "px-6 py-8" : "px-6 py-12",
        className,
      )}
    >
      <IconBadge className="mx-auto" icon={Icon} size={compact ? "lg" : "xl"} />
      <p className={cn("font-semibold text-heading", compact ? "mt-3 text-sm" : "mt-5 text-lg")}>{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted sm:text-sm">{description}</p>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
