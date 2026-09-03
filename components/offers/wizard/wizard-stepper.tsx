"use client";

import { Check, CheckCircle2, ClipboardList, ShieldCheck, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "./types";

export const wizardSteps = [
  { id: 1, title: "Firma bilgileri", description: "Müşteri ve teklif tanımı", icon: UsersRound },
  { id: 2, title: "Hizmet kalemleri", description: "Test ve tarama kapsamı", icon: ClipboardList },
  { id: 3, title: "Fiyatlandırma", description: "Tutar ve koşullar", icon: ShieldCheck },
  { id: 4, title: "Son kontrol", description: "Teklifi gözden geçir", icon: CheckCircle2 },
] as const;

export default function WizardStepper({ current, onStep }: { current: Step; onStep: (step: Step) => void }) {
  return (
    <nav aria-label="Teklif oluşturma adımları" className="grid grid-cols-4 gap-2 lg:sticky lg:top-24 lg:grid-cols-1">
      {wizardSteps.map(({ id, title, description, icon: Icon }) => {
        const done = current > id;
        const active = current === id;
        return (
          <button
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex w-full flex-col items-center gap-2 rounded-2xl border p-2 text-center transition-colors lg:flex-row lg:gap-3 lg:p-3 lg:text-left",
              active ? "border-brand-outline bg-brand-soft" : "border-border bg-card",
              done ? "hover:border-border-strong hover:bg-card-muted" : "cursor-default",
            )}
            disabled={!done}
            key={id}
            onClick={() => done && onStep(id as Step)}
            type="button"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold lg:size-9",
                current >= id ? "bg-brand text-brand-fg" : "bg-neutral-soft text-neutral",
              )}
            >
              {done ? <Check className="size-4" /> : <Icon className="hidden size-4 lg:block" />}
              <span className={cn("lg:hidden", done && "hidden")}>{id}</span>
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[11px] font-semibold text-foreground lg:text-xs">{title}</span>
              <span className="mt-1 hidden truncate text-[10px] text-muted lg:block">{description}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
