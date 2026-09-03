import type { LucideIcon } from "lucide-react";
import { IconBadge } from "@/components/ui/card";

export function StepHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      <IconBadge icon={icon} size="lg" />
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-brand uppercase">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-heading">{title}</h2>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}
