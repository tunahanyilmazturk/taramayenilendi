"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand" : "bg-faint/60",
        className,
      )}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

/** Row with icon, title, description and a switch on the right. */
export function SwitchRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-4", disabled && "opacity-60")}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {title}
            {badge}
          </p>
          {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} label={`${title} ${checked ? "açık" : "kapalı"}`} onChange={onChange} />
    </div>
  );
}
