import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsCard({
  icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden p-5 sm:p-7", className)}>
      <CardHeader
        action={action}
        className="border-divider bg-card-muted/35 -mx-5 -mt-5 border-b px-5 pt-5 pb-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7"
        description={description}
        icon={icon}
        title={title}
      />
      {children}
    </Card>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-card-muted/35 flex flex-col justify-between gap-3 rounded-xl border px-3.5 py-3 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
