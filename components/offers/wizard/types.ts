import type { OfferType, TestItem } from "@/lib/demo-data";

export type SelectedTest = TestItem & { quantity: number; unitPrice?: number };
export type Step = 1 | 2 | 3 | 4;
export type WizardState = {
  companyId: number | null;
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
export type UpdateWizard = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
export type PriceBreakdown = { subtotal: number; discount: number; discounted: number; tax: number; total: number };

export const emptyWizard: WizardState = {
  companyId: null,
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

export const lineTotal = (test: SelectedTest) => (test.unitPrice ?? test.price) * test.quantity;

export function calculatePrice(wizard: WizardState): PriceBreakdown {
  const subtotal = wizard.tests.reduce((sum, test) => sum + lineTotal(test), 0);
  const discount = Math.min(Math.max(Number(wizard.discount) || 0, 0), 100);
  const tax = Math.max(Number(wizard.tax) || 0, 0);
  const discounted = subtotal * (1 - discount / 100);
  return { subtotal, discount, discounted, tax, total: discounted * (1 + tax / 100) };
}
