import { CalendarDays, CheckCircle2, FileText } from "lucide-react";
import type { WizardState } from "./types";
import { money, dateLabel } from "./types";
import { PriceSummary } from "./step-pricing";

export default function StepReview({
  wizard,
  subtotal,
  discount,
  tax,
  total,
}: {
  wizard: WizardState;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">4. ADIM · ONAY</p>
          <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">
            Teklifi son kez kontrol edin
          </h2>
          <p className="mt-1 text-xs text-[#81958f]">
            Taslak kaydedildikten sonra teklif listesinden düzenleyebilirsiniz.
          </p>
        </div>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <ReviewRow label="Firma" value={wizard.company} />
          <ReviewRow
            label="Yetkili"
            value={`${wizard.contact || "Belirtilmedi"}${wizard.email ? ` · ${wizard.email}` : ""}`}
          />
          <ReviewRow label="Teklif başlığı" value={wizard.title} />
          <ReviewRow label="Geçerlilik" value={dateLabel(wizard.validUntil)} />
          <div className="rounded-2xl border border-[#e5eee9] p-4 dark:border-[#1d4941]">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">
              <FileText className="size-4 text-[#278b70]" />
              Hizmet kalemleri
            </p>
            {wizard.tests.map((test) => (
              <div className="mt-3 flex justify-between gap-3 text-xs text-[#718783] dark:text-[#a7c9be]" key={test.id}>
                <span>
                  {test.name} × {test.quantity}
                </span>
                <span className="shrink-0 font-semibold">{money(test.price * test.quantity)}</span>
              </div>
            ))}
          </div>
          {wizard.notes && (
            <div className="rounded-2xl bg-[#f5f8f6] p-4 text-xs leading-5 text-[#66847a] dark:bg-[#172523] dark:text-[#a7c9be]">
              Not: {wizard.notes}
            </div>
          )}
        </div>
        <PriceSummary
          subtotal={subtotal}
          discount={discount}
          discounted={subtotal * (1 - discount / 100)}
          tax={tax}
          total={total}
        />
      </div>
    </div>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#e5eee9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#1d4941]">
      <span className="text-xs text-[#81958f]">{label}</span>
      <strong className="text-xs text-[#31534f] dark:text-[#d3ebe2]">{value}</strong>
    </div>
  );
}
