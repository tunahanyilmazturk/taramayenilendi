import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { WizardState } from "./types";
import { fieldClass, money } from "./types";

export default function StepPricing({
  wizard,
  update,
  subtotal,
  discount,
  discounted,
  tax,
  total,
}: {
  wizard: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  subtotal: number;
  discount: number;
  discounted: number;
  tax: number;
  total: number;
}) {
  return (
    <div>
      <Heading />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            İndirim (%)
            <input
              className={fieldClass}
              min="0"
              max="100"
              onChange={(event) => update("discount", event.target.value)}
              type="number"
              value={wizard.discount}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            KDV (%)
            <input
              className={fieldClass}
              min="0"
              onChange={(event) => update("tax", event.target.value)}
              type="number"
              value={wizard.tax}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] sm:col-span-2 dark:text-[#c4dfd5]">
            Teklif notları
            <textarea
              className={`${fieldClass} h-auto min-h-32 resize-y p-3`}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Ödeme, teslimat veya hizmet kapsamı notları..."
              value={wizard.notes}
            />
          </label>
        </div>
        <PriceSummary subtotal={subtotal} discount={discount} discounted={discounted} tax={tax} total={total} />
      </div>
    </div>
  );
}
function Heading() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <ShieldCheck className="size-5" />
      </span>
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">3. ADIM · FİYAT</p>
        <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Fiyatlandırma ve koşullar</h2>
        <p className="mt-1 text-xs text-[#81958f]">İndirim, vergi ve teklif notlarını belirleyin.</p>
      </div>
    </div>
  );
}
export function PriceSummary({
  subtotal,
  discount,
  discounted,
  tax,
  total,
}: {
  subtotal: number;
  discount: number;
  discounted: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="h-fit rounded-2xl bg-[#f5f8f6] p-5 dark:bg-[#172523]">
      <p className="text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">Fiyat özeti</p>
      <div className="mt-4 space-y-3 text-xs text-[#718783] dark:text-[#a7c9be]">
        <div className="flex justify-between">
          <span>Ara toplam</span>
          <strong>{money(subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>İndirim ({discount}%)</span>
          <strong>-{money(subtotal - discounted)}</strong>
        </div>
        <div className="flex justify-between">
          <span>KDV ({tax}%)</span>
          <strong>{money(total - discounted)}</strong>
        </div>
        <div className="border-t border-[#dce8e1] pt-3 text-sm font-bold text-[#103c3a] dark:border-[#2b4b42] dark:text-[#e8f7f1]">
          <div className="flex justify-between">
            <span>Genel toplam</span>
            <span>{money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
