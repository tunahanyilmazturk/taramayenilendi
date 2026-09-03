"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StepCompany from "./wizard/step-company";
import StepPricing from "./wizard/step-pricing";
import StepReview from "./wizard/step-review";
import StepServices from "./wizard/step-services";
import type { Company, OfferType, Step, TestItem, WizardState } from "./wizard/types";
import { dateLabel, emptyWizard } from "./wizard/types";
import WizardStepper from "./wizard/wizard-stepper";
const defaultCompanies: Company[] = [
  { id: 1, name: "Artemis Otomotiv A.Ş.", contact: "Murat Şahin", employees: 248 },
  { id: 2, name: "Mavi Hat Lojistik", contact: "Büşra Aydın", employees: 126 },
  { id: 3, name: "Nova Gıda Üretim", contact: "Emre Yıldız", employees: 384 },
  { id: 4, name: "Eksen Yapı Proje", contact: "Zeynep Koç", employees: 76 },
];
const defaultTests: TestItem[] = [
  { id: 1, code: "RAD-001", name: "Akciğer grafisi", category: "Radyoloji", price: 350, active: true },
  { id: 2, code: "ODY-001", name: "Odyometri", category: "İşitme", price: 180, active: true },
  { id: 3, code: "SOL-001", name: "Solunum fonksiyon testi", category: "Solunum", price: 220, active: true },
  { id: 4, code: "LAB-001", name: "Hemogram", category: "Laboratuvar", price: 160, active: true },
];
export default function OfferCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [wizard, setWizard] = useState<WizardState>(emptyWizard);
  const [companies, setCompanies] = useState(defaultCompanies);
  const [tests, setTests] = useState(defaultTests);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  useEffect(() => {
    try {
      const companyData = window.localStorage.getItem("hantech-companies");
      const testData = window.localStorage.getItem("hantech-tests");
      if (companyData) {
        const parsed = JSON.parse(companyData) as Company[];
        if (Array.isArray(parsed) && parsed.length) setCompanies(parsed);
      }
      if (testData) {
        const parsed = JSON.parse(testData) as TestItem[];
        if (Array.isArray(parsed) && parsed.length) setTests(parsed.filter((test) => test.active));
      }
    } catch {
      /* Keep demo records. */
    }
  }, []);
  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setWizard((current) => ({ ...current, [key]: value }));
  const generateTitle = (company: string, offerType: OfferType | "", validUntil: string) => {
    if (titleEdited || !company || !offerType || !validUntil) return;
    const monthYear = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
      new Date(`${validUntil}T12:00:00`),
    );
    update("title", `${company} - ${offerType} - ${monthYear} teklifi`);
  };
  const subtotal = wizard.tests.reduce((sum, test) => sum + (test.unitPrice ?? test.price) * test.quantity, 0);
  const discount = Math.min(Math.max(Number(wizard.discount) || 0, 0), 100);
  const tax = Math.max(Number(wizard.tax) || 0, 0);
  const discounted = subtotal * (1 - discount / 100);
  const total = discounted * (1 + tax / 100);
  const validStep = (current: Step) =>
    current === 1
      ? Boolean(wizard.company && wizard.offerType && wizard.title.trim() && wizard.validUntil)
      : current === 2
        ? wizard.tests.length > 0
        : true;
  const next = () => {
    if (!validStep(step)) {
      setSubmitted(true);
      return;
    }
    setSubmitted(false);
    setStep((current) => Math.min(4, current + 1) as Step);
  };
  const back = () => {
    setSubmitted(false);
    setStep((current) => Math.max(1, current - 1) as Step);
  };
  const addTest = (test: TestItem) =>
    update(
      "tests",
      wizard.tests.some((item) => item.id === test.id)
        ? wizard.tests
        : [...wizard.tests, { ...test, quantity: 1, unitPrice: test.price }],
    );
  const removeTest = (id: number) =>
    update(
      "tests",
      wizard.tests.filter((test) => test.id !== id),
    );
  const save = () => {
    const offer = {
      id: Date.now(),
      number: `TEK-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      company: wizard.company,
      offerType: wizard.offerType,
      title: wizard.title,
      status: "Taslak",
      total: Math.round(total),
      validUntil: dateLabel(wizard.validUntil),
      createdAt: dateLabel(new Date().toISOString().slice(0, 10)),
      items: wizard.tests.length,
      contact: wizard.contact,
    };
    const current = JSON.parse(window.localStorage.getItem("hantech-offers") ?? "[]") as unknown[];
    window.localStorage.setItem("hantech-offers", JSON.stringify([...current, offer]));
    setNotice("Teklif taslağı oluşturuldu.");
    window.setTimeout(() => router.push("/teklifler"), 700);
  };
  const content =
    step === 1 ? (
      <StepCompany
        wizard={wizard}
        companies={companies}
        update={update}
        submitted={submitted}
        onGenerateTitle={generateTitle}
        onTitleEdited={() => setTitleEdited(true)}
      />
    ) : step === 2 ? (
      <StepServices
        wizard={wizard}
        tests={tests}
        update={update}
        addTest={addTest}
        removeTest={removeTest}
        submitted={submitted}
      />
    ) : step === 3 ? (
      <StepPricing
        wizard={wizard}
        update={update}
        subtotal={subtotal}
        discount={discount}
        discounted={discounted}
        tax={tax}
        total={total}
      />
    ) : (
      <StepReview wizard={wizard} subtotal={subtotal} discount={discount} tax={tax} total={total} />
    );
  return (
    <main className="mx-auto max-w-6xl pb-8">
      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside>
          <div className="mb-5 rounded-2xl border border-[#dceee4] bg-white p-4 dark:border-[#1d4941] dark:bg-[#0e2927]">
            <button
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#66847a] hover:text-[#278b70] dark:text-[#a7c9be]"
              onClick={() => router.push("/teklifler")}
              type="button"
            >
              <ArrowLeft className="size-3.5" /> Tekliflere dön
            </button>
            <p className="mt-4 text-xs font-medium text-[#6f8982] dark:text-[#9ebbb3]">
              Teklif ve fiyatlandırma merkezi
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">
              Yeni teklif oluştur
            </h1>
            <p className="mt-2 text-xs leading-5 text-[#81958f] dark:text-[#91b0a6]">
              Hizmet kapsamını adım adım tamamlayın.
            </p>
          </div>
          <WizardStepper
            current={step}
            onStep={(value) => {
              setSubmitted(false);
              setStep(value);
            }}
          />
        </aside>
        <section className="flex max-h-[calc(100vh-7rem)] min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-[#e0ece8] bg-white p-5 shadow-sm sm:p-7 dark:border-[#1d4941] dark:bg-[#0e2927]">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {content}
            {notice && (
              <p className="mt-5 rounded-xl bg-[#e5f5ec] px-3 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                {notice}
              </p>
            )}
          </div>
          <div className="mt-5 flex shrink-0 items-center justify-between border-t border-[#edf3f0] pt-4 dark:border-[#1d4941]">
            <p className="text-xs text-[#81958f]">Adım {step} / 4</p>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-[#dbe9e4] px-4 py-2.5 text-xs font-semibold text-[#66847a] dark:border-[#37685a] dark:text-[#b8d4c9]"
                  onClick={back}
                  type="button"
                >
                  <ArrowLeft className="size-3.5" /> Geri
                </button>
              )}
              {step < 4 ? (
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-xs font-semibold text-white"
                  onClick={next}
                  type="button"
                >
                  Devam et <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#299b7c] px-4 py-2.5 text-xs font-semibold text-white"
                  onClick={save}
                  type="button"
                >
                  <Check className="size-3.5" /> Teklif taslağını kaydet
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
