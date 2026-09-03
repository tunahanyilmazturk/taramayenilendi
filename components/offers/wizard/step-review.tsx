"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { isoToLongLabel, money } from "@/lib/format";
import { StepHeading } from "./step-heading";
import { PriceSummary } from "./step-pricing";
import { lineTotal, type PriceBreakdown, type WizardState } from "./types";

export default function StepReview({ wizard, price }: { wizard: WizardState; price: PriceBreakdown }) {
  const contact = `${wizard.contact || "Belirtilmedi"}${wizard.email ? ` · ${wizard.email}` : ""}`;
  return (
    <div>
      <StepHeading
        eyebrow="4. Adım · Onay"
        title="Teklifi son kez kontrol edin"
        description="Taslak kaydedildikten sonra teklif listesinden düzenleyebilirsiniz."
        icon={CheckCircle2}
      />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <ReviewRow label="Firma" value={wizard.company} />
          <ReviewRow label="Teklif türü" value={wizard.offerType || "Belirtilmedi"} />
          <ReviewRow label="Yetkili" value={contact} />
          <ReviewRow label="Teklif başlığı" value={wizard.title} />
          <ReviewRow label="Geçerlilik" value={isoToLongLabel(wizard.validUntil)} />
          <div className="rounded-2xl border border-border p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FileText className="size-4 text-brand" />
              Hizmet kalemleri
            </p>
            <ul className="mt-3 divide-y divide-divider">
              {wizard.tests.map((test) => (
                <li className="flex justify-between gap-3 py-2 text-xs text-muted" key={test.id}>
                  <span>
                    {test.name} × {test.quantity}
                    <span className="text-subtle"> · {money(test.unitPrice ?? test.price)} birim</span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">{money(lineTotal(test))}</span>
                </li>
              ))}
            </ul>
          </div>
          {wizard.notes && (
            <div className="rounded-2xl bg-card-muted p-4 text-xs leading-5 text-muted">
              <span className="font-semibold text-foreground">Not:</span> {wizard.notes}
            </div>
          )}
        </div>
        <PriceSummary price={price} />
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted">{label}</span>
      <strong className="text-xs text-foreground">{value}</strong>
    </div>
  );
}
