"use client";

import { CreditCard, Percent, ShieldCheck } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import { paymentTermsLabels, type PaymentTerms, type PriceBreakdown, type UpdateWizard, type WizardState } from "./types";

export default function StepPricing({
  wizard,
  update,
  price,
}: {
  wizard: WizardState;
  update: UpdateWizard;
  price: PriceBreakdown;
}) {
  const discountLabel = wizard.discountType === "percent" ? "İndirim oranı" : "İndirim tutarı";
  const discountHint =
    wizard.discountType === "percent" ? "0 ile 100 arasında bir oran girin." : "Tutar bazlı indirim miktarı.";
  return (
    <div>
      <StepHeading
        eyebrow="3. Adım · Fiyat"
        title="Fiyatlandırma"
        description="İndirim, vergi, ödeme ve teslimat koşullarını belirleyin."
        icon={ShieldCheck}
      />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <FormSection icon={Percent} title="İndirim ve vergi">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={discountLabel} hint={discountHint}>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    max={wizard.discountType === "percent" ? 100 : undefined}
                    min={0}
                    onChange={(event) => update("discount", event.target.value)}
                    prefix={wizard.discountType === "percent" ? "%" : "₺"}
                    type="number"
                    value={wizard.discount}
                  />
                  <DiscountToggle
                    type={wizard.discountType}
                    onChange={(type) => update("discountType", type)}
                  />
                </div>
              </Field>
              <Field label="KDV oranı">
                <Input
                  max={100}
                  min={0}
                  onChange={(event) => update("tax", event.target.value)}
                  prefix="%"
                  type="number"
                  value={wizard.tax}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection icon={CreditCard} title="Ödeme ve teslimat">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ödeme vadesi">
                <Select
                  onChange={(event) => update("paymentTerms", event.target.value as PaymentTerms)}
                  value={wizard.paymentTerms}
                >
                  {Object.entries(paymentTermsLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Teslim süresi" hint="Hizmetin tamamlanma süresi.">
                <Input
                  className="max-w-36"
                  min={1}
                  onChange={(event) => update("deliveryDays", event.target.value)}
                  suffix="gün"
                  type="number"
                  value={wizard.deliveryDays}
                />
              </Field>
            </div>
          </FormSection>
        </div>
        <PriceSummary price={price} wizard={wizard} />
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Percent;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DiscountToggle({
  type,
  onChange,
}: {
  type: WizardState["discountType"];
  onChange: (type: WizardState["discountType"]) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-xl border border-border bg-card-muted p-0.5">
      <button
        aria-pressed={type === "percent"}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold transition-colors",
          type === "percent" ? "bg-brand text-brand-fg" : "text-muted hover:text-foreground",
        )}
        onClick={() => onChange("percent")}
        title="Yüzde indirim"
        type="button"
      >
        %
      </button>
      <button
        aria-pressed={type === "fixed"}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold transition-colors",
          type === "fixed" ? "bg-brand text-brand-fg" : "text-muted hover:text-foreground",
        )}
        onClick={() => onChange("fixed")}
        title="Sabit tutar indirim"
        type="button"
      >
        ₺
      </button>
    </div>
  );
}

export function PriceSummary({ price, wizard }: { price: PriceBreakdown; wizard?: WizardState }) {
  const { subtotal, discount, discounted, tax, total } = price;
  return (
    <div className="h-fit rounded-2xl border border-border bg-card-muted p-5 lg:sticky lg:top-6">
      <p className="text-xs font-bold text-foreground">Fiyat özeti</p>
      <dl className="mt-4 space-y-3 text-xs text-muted">
        <div className="flex justify-between gap-3">
          <dt>Ara toplam</dt>
          <dd className="font-semibold text-foreground">{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>İndirim{wizard?.discountType === "fixed" ? " (₺)" : wizard ? " (%)" : ` (${discount}%)`}</dt>
          <dd className="font-semibold text-foreground">-{money(discount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Net tutar</dt>
          <dd className="font-semibold text-foreground">{money(discounted)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>KDV ({tax}%)</dt>
          <dd className="font-semibold text-foreground">{money(total - discounted)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-divider pt-3 text-sm font-bold text-heading">
          <dt>Genel toplam</dt>
          <dd>{money(total)}</dd>
        </div>
        {wizard && (
          <div className="space-y-1.5 border-t border-divider pt-3 text-[10px] text-subtle">
            <p>
              <span className="font-semibold text-muted">Ödeme:</span> {paymentTermsLabels[wizard.paymentTerms]}
            </p>
            <p>
              <span className="font-semibold text-muted">Teslim:</span> {wizard.deliveryDays} gün
            </p>
          </div>
        )}
      </dl>
    </div>
  );
}
