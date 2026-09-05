import { cn } from "@/lib/utils";

/** HanTech logo block. `variant="sidebar"` renders on the dark shell, `"light"` on a dark hero. */
export function BrandMark({
  variant = "default",
  compact = false,
  className,
}: {
  variant?: "default" | "light" | "sidebar";
  compact?: boolean;
  className?: string;
}) {
  const mark = {
    default: "bg-primary text-brand-strong shadow-primary",
    light: "bg-white text-primary",
    sidebar: "bg-sidebar-active text-brand-strong",
  }[variant];
  const title = { default: "text-heading", light: "text-white", sidebar: "text-sidebar-fg-strong" }[variant];
  const subtitle = { default: "text-muted", light: "text-white/70", sidebar: "text-sidebar-muted" }[variant];
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold", mark)}>
        H
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn("block text-sm font-bold tracking-tight", title)}>HanTech</span>
          <span className={cn("block text-[9px] font-semibold tracking-[0.12em]", subtitle)}>OSGB YÖNETİM SİSTEMİ</span>
        </span>
      )}
    </span>
  );
}
