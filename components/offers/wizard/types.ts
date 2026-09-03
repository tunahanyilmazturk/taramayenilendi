export type Company = { id: number; name: string; contact: string; email?: string; employees?: number };
export type TestItem = { id: number; code: string; name: string; category: string; price: number; active: boolean };
export type SelectedTest = TestItem & { quantity: number; unitPrice?: number };
export type Step = 1 | 2 | 3 | 4;
export type OfferType = "Periyodik muayene" | "İşe giriş muayenesi";
export type WizardState = {
  company: string;
  offerType: OfferType | "";
  employeeCount: number;
  contact: string;
  email: string;
  title: string;
  validUntil: string;
  notes: string;
  discount: string;
  tax: string;
  tests: SelectedTest[];
};
export const emptyWizard: WizardState = {
  company: "",
  offerType: "",
  employeeCount: 1,
  contact: "",
  email: "",
  title: "",
  validUntil: "",
  notes: "",
  discount: "0",
  tax: "20",
  tests: [],
};
export const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(`${value}T12:00:00`),
      )
    : "Tarih seçilmedi";
export const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm text-[#31534f] outline-none transition focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white dark:focus:ring-[#1d5a4b]";
