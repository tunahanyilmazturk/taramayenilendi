"use client";

import { CreditCard, Eye, Percent } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { SwitchRow } from "@/components/ui/switch";
import { money } from "@/lib/format";

type ScreeningLine = { testId: number; name: string; category: string; quantity: number; unitPrice: number };

type Draft = { discount: string; tax: string; paymentTerms: string; deliveryDays: string; showPriceOnPdf: boolean };
type Update = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

export default function ScreeningStepPricing({
  lines,
  draft,
  update,
}: {
  lines: ScreeningLine[];
  draft: Draft;
  update: Update;
}) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = Math.min(subtotal, (subtotal * Math.min(100, Math.max(0, Number(draft.discount) || 0))) / 100);
  const net = subtotal - discount;
  const tax = (net * Math.max(0, Number(draft.tax) || 0)) / 100;
  const total = net + tax;
  return (
    <section>
      <div className="mt-4 grid min-h-[420px] gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <section className="border-border bg-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
                <Percent className="size-4" />
              </span>
              <h3 className="text-foreground text-sm font-bold">İndirim ve vergi</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="İndirim oranı" hint="0 ile 100 arasında yüzde indirim.">
                <Input
                  max={100}
                  min={0}
                  onChange={(event) => update("discount", event.target.value)}
                  prefix="%"
                  type="number"
                  value={draft.discount}
                />
              </Field>
              <Field label="KDV oranı">
                <Input
                  max={100}
                  min={0}
                  onChange={(event) => update("tax", event.target.value)}
                  prefix="%"
                  type="number"
                  value={draft.tax}
                />
              </Field>
            </div>
          </section>
          <section className="border-border bg-card rounded-2xl border px-5">
            <SwitchRow
              checked={draft.showPriceOnPdf}
              description="Kapalı olduğunda PDF’de yalnızca hizmet ve adet bilgileri gösterilir; ücret alanları ve fiyat özeti gizlenir."
              icon={Eye}
              onChange={(value) => update("showPriceOnPdf", value)}
              title="PDF’de fiyatları göster"
            />
          </section>
          <section className="border-border bg-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
                <CreditCard className="size-4" />
              </span>
              <h3 className="text-foreground text-sm font-bold">Ödeme ve teslimat</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ödeme vadesi">
                <Select onChange={(event) => update("paymentTerms", event.target.value)} value={draft.paymentTerms}>
                  <option value="peşin">Peşin ödeme</option>
                  <option value="net15">15 gün vadeli</option>
                  <option value="net30">30 gün vadeli</option>
                  <option value="net45">45 gün vadeli</option>
                  <option value="net60">60 gün vadeli</option>
                  <option value="taksit">Taksitli ödeme</option>
                </Select>
              </Field>
              <Field label="Teslim süresi">
                <Input
                  min={1}
                  onChange={(event) => update("deliveryDays", event.target.value)}
                  suffix="gün"
                  type="number"
                  value={draft.deliveryDays}
                />
              </Field>
            </div>
          </section>
        </div>
        <div className="border-brand-outline bg-brand-soft h-fit rounded-2xl border p-5 lg:sticky lg:top-6">
          <p className="text-foreground text-xs font-bold">Fiyat özeti</p>
          <dl className="text-muted mt-4 space-y-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt>Ara toplam</dt>
              <dd className="text-foreground font-semibold">{money(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between gap-3">
                <dt>İndirim (%{draft.discount})</dt>
                <dd className="text-foreground font-semibold">-{money(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt>Net tutar</dt>
              <dd className="text-foreground font-semibold">{money(net)}</dd>
            </div>
            {tax > 0 && (
              <div className="flex justify-between gap-3">
                <dt>KDV (%{draft.tax})</dt>
                <dd className="text-foreground font-semibold">{money(tax)}</dd>
              </div>
            )}
            <div className="border-divider text-heading flex justify-between gap-3 border-t pt-3 text-sm font-bold">
              <dt>Genel toplam</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
