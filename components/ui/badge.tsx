import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import type { ContractStatus, OfferStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        brand: "bg-brand-soft text-brand-soft-fg",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        neutral: "bg-neutral-soft text-neutral",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export const contractTone: Record<ContractStatus, BadgeTone> = {
  Aktif: "brand",
  Yenileniyor: "warning",
  Pasif: "danger",
};

export const offerTone: Record<OfferStatus, BadgeTone> = {
  Taslak: "neutral",
  Gönderildi: "info",
  Görüşülüyor: "warning",
  Onaylandı: "brand",
  Reddedildi: "danger",
  "Süresi doldu": "danger",
};

/** Count pill used next to list headings, e.g. "12 kayıt". */
export function CountPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("list-count-pill rounded-full bg-brand-soft px-2 py-1 text-[10px] font-bold text-brand-soft-fg", className)}>
      {children}
    </span>
  );
}
