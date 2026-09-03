import { Check, Search, UsersRound } from "lucide-react";
import type { Company, OfferType, WizardState } from "./types";
import { fieldClass } from "./types";

const offerTypes: OfferType[] = ["Periyodik muayene", "İşe giriş muayenesi"];

function Heading() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <UsersRound className="size-5" />
      </span>
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">1. ADIM · MÜŞTERİ</p>
        <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Firma ve teklif bilgileri</h2>
        <p className="mt-1 text-xs text-[#81958f]">Teklifin kime ait olduğunu, türünü ve temel tanımını oluşturun.</p>
      </div>
    </div>
  );
}
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
      {label}
      {required && <span className="ml-1 text-[#c47b69]">*</span>}
      {children}
      {error && <span className="mt-1 block text-[10px] font-normal text-[#b06e5d]">Bu alan zorunludur.</span>}
    </label>
  );
}

export default function StepCompany({
  wizard,
  companies,
  update,
  submitted,
  onGenerateTitle,
  onTitleEdited,
}: {
  wizard: WizardState;
  companies: Company[];
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  submitted: boolean;
  onGenerateTitle: (company: string, offerType: OfferType | "", validUntil: string) => void;
  onTitleEdited: () => void;
}) {
  const selected = companies.find((company) => company.name === wizard.company);
  const generate = (company: string, offerType: OfferType | "", validUntil: string) =>
    onGenerateTitle(company, offerType, validUntil);
  const chooseCompany = (value: string) => {
    const company = companies.find((item) => item.name === value);
    update("company", value);
    update("employeeCount", Math.max(1, company?.employees ?? 1));
    update("contact", company?.contact ?? "");
    update("email", company?.email ?? "");
    generate(value, wizard.offerType, wizard.validUntil);
  };
  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const value = date.toISOString().slice(0, 10);
    update("validUntil", value);
    generate(wizard.company, wizard.offerType, value);
  };
  return (
    <div>
      <Heading />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Firma" required error={submitted && !wizard.company}>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8ba8a0]" />
            <input
              aria-label="Firma ara ve seç"
              className={`${fieldClass} pl-9`}
              list="offer-company-list"
              onChange={(event) => chooseCompany(event.target.value)}
              placeholder="Firma ara ve seçin"
              value={wizard.company}
            />
            <datalist id="offer-company-list">
              {companies.map((company) => (
                <option key={company.id} value={company.name} />
              ))}
            </datalist>
          </div>
        </Field>
        <Field label="Teklif türü" required error={submitted && !wizard.offerType}>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {offerTypes.map((type) => (
              <button
                aria-pressed={wizard.offerType === type}
                className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-xs font-semibold transition ${wizard.offerType === type ? "border-[#55b99c] bg-[#e5f5ec] text-[#17624f] dark:border-[#3d8068] dark:bg-[#174638] dark:text-[#b7f2d6]" : "border-[#dbe9e4] bg-[#fbfdfc] text-[#66847a] hover:border-[#9ccdb8] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#aaccc0]"}`}
                key={type}
                onClick={() => {
                  update("offerType", type);
                  generate(wizard.company, type, wizard.validUntil);
                }}
                type="button"
              >
                {type}
                <span className="flex size-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  {wizard.offerType === type && <Check className="size-3.5" />}
                </span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Teklif başlığı" required error={submitted && !wizard.title.trim()}>
          <input
            className={fieldClass}
            onChange={(event) => {
              onTitleEdited();
              update("title", event.target.value);
            }}
            placeholder="Firma ve teklif türü seçince otomatik oluşur"
            value={wizard.title}
          />
        </Field>
        <Field label="Geçerlilik tarihi" required error={submitted && !wizard.validUntil}>
          <input
            className={fieldClass}
            onChange={(event) => {
              update("validUntil", event.target.value);
              generate(wizard.company, wizard.offerType, event.target.value);
            }}
            type="date"
            value={wizard.validUntil}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="self-center text-[10px] font-medium text-[#81958f]">Hızlı seçim:</span>
            {[7, 15, 30, 45, 60].map((days) => (
              <button
                className="rounded-lg border border-[#dbe9e4] px-2 py-1 text-[10px] font-semibold text-[#66847a] hover:border-[#55b99c] hover:text-[#278b70] dark:border-[#28584d] dark:text-[#a7c9be] dark:hover:border-[#55b99c]"
                key={days}
                onClick={() => setQuickDate(days)}
                type="button"
              >
                {days} gün
              </button>
            ))}
          </div>
        </Field>
        <Field label="Firma yetkilisi">
          <input
            className={fieldClass}
            onChange={(event) => update("contact", event.target.value)}
            placeholder="Ad soyad"
            value={wizard.contact}
          />
        </Field>
        <Field label="Yetkili e-posta">
          <input
            className={fieldClass}
            onChange={(event) => update("email", event.target.value)}
            placeholder="yetkili@firma.com"
            type="email"
            value={wizard.email}
          />
        </Field>
        {selected && (
          <div className="sm:col-span-2">
            <div className="rounded-xl bg-[#f5f8f6] p-3 text-xs text-[#66847a] dark:bg-[#172523] dark:text-[#a7c9be]">
              Firma seçildi: <strong>{selected.name}</strong>
              {wizard.offerType && <span> · {wizard.offerType}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
