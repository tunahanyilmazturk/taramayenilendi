"use client";

import { ShieldCheck } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { money } from "@/lib/format";
import { StepHeading } from "./step-heading";
import type { PriceBreakdown, UpdateWizard, WizardState } from "./types";

export default function StepPricing({
  wizard,
  update,
  price,
}: {
  wizard: WizardState;
  update: UpdateWizard;
  price: PriceBreakdown;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="3. Adım · Fiyat"
        title="Fiyatlandırma ve koşullar"
        description="İndirim, vergi ve teklif notlarını belirleyin."
        icon={ShieldCheck}
      />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="İndirim (%)" hint="0 ile 100 arasında bir oran girin.">
            <Input
              max={100}
              min={0}
              onChange={(event) => update("discount", event.target.value)}
              type="number"
              value={wizard.discount}
            />
          </Field>
          <Field label="KDV (%)">
            <Input min={0} onChange={(event) => update("tax", event.target.value)} type="number" value={wizard.tax} />
          </Field>
          <Field className="sm:col-span-2" label="Teklif notları">
            <Textarea
              className="min-h-32"
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Ödeme, teslimat veya hizmet kapsamı notları..."
              value={wizard.notes}
            />
          </Field>
        </div>
        <PriceSummary price={price} />
      </div>
    </div>
  );
}

export function PriceSummary({ price }: { price: PriceBreakdown }) {
  const { subtotal, discount, discounted, tax, total } = price;
  return (
    <div className="h-fit rounded-2xl bg-card-muted p-5">
      <p className="text-xs font-semibold text-foreground">Fiyat özeti</p>
      <dl className="mt-4 space-y-3 text-xs text-muted">
        <div className="flex justify-between gap-3">
          <dt>Ara toplam</dt>
          <dd className="font-semibold text-foreground">{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>İndirim ({discount}%)</dt>
          <dd className="font-semibold text-foreground">-{money(subtotal - discounted)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>KDV ({tax}%)</dt>
          <dd className="font-semibold text-foreground">{money(total - discounted)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-divider pt-3 text-sm font-bold text-heading">
          <dt>Genel toplam</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
