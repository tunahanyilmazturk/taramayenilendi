"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { useCompanies, useOffers, useTests } from "@/lib/data";
import { nextOfferNumber, type Company, type Offer, type OfferType, type TestItem } from "@/lib/demo-data";
import { isoToLabel, todayIso } from "@/lib/format";
import { useNotice } from "@/lib/hooks";
import { useHydrated } from "@/lib/storage";
import StepCompany from "./wizard/step-company";
import StepPricing from "./wizard/step-pricing";
import StepReview from "./wizard/step-review";
import StepServices from "./wizard/step-services";
import { calculatePrice, emptyWizard, type Step, type WizardState } from "./wizard/types";
import WizardStepper from "./wizard/wizard-stepper";

export default function OfferCreatePage() {
  return (
    <Suspense fallback={null}>
      <OfferCreateInner />
    </Suspense>
  );
}

function OfferCreateInner() {
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const [companies] = useCompanies();
  const [tests] = useTests();
  if (!hydrated) return null;
  const preselectedId = Number(searchParams.get("firma"));
  const preselected = companies.find((company) => company.id === preselectedId);
  return <OfferWizard companies={companies} tests={tests.filter((test) => test.active)} preselected={preselected} />;
}

function initialWizard(company?: Company): WizardState {
  if (!company) return emptyWizard;
  return {
    ...emptyWizard,
    companyId: company.id,
    company: company.name,
    contact: company.contact,
    email: company.email,
    employeeCount: Math.max(1, company.employees),
  };
}

function OfferWizard({
  companies,
  tests,
  preselected,
}: {
  companies: Company[];
  tests: TestItem[];
  preselected?: Company;
}) {
  const router = useRouter();
  const [, setOffers] = useOffers();
  const [notice, showNotice] = useNotice();
  const [step, setStep] = useState<Step>(1);
  const [wizard, setWizard] = useState<WizardState>(() => initialWizard(preselected));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleEdited = useRef(false);
  const price = calculatePrice(wizard);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setWizard((current) => ({ ...current, [key]: value }));
  const generateTitle = (company: string, offerType: OfferType | "", validUntil: string) => {
    if (titleEdited.current || !company || !offerType || !validUntil) return;
    const monthYear = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
      new Date(`${validUntil}T12:00:00`),
    );
    update("title", `${company} - ${offerType} - ${monthYear} teklifi`);
  };
  const isStepValid = (current: Step) => {
    if (current === 1)
      return Boolean(wizard.companyId && wizard.offerType && wizard.title.trim() && wizard.validUntil);
    if (current === 2) return wizard.tests.length > 0;
    return true;
  };
  const goTo = (target: Step) => {
    setSubmitted(false);
    setStep(target);
  };
  const next = () => {
    if (!isStepValid(step)) {
      setSubmitted(true);
      return;
    }
    goTo(Math.min(4, step + 1) as Step);
  };
  const back = () => goTo(Math.max(1, step - 1) as Step);
  const addTest = (test: TestItem) =>
    setWizard((current) =>
      current.tests.some((item) => item.id === test.id)
        ? current
        : {
            ...current,
            tests: [...current.tests, { ...test, quantity: Math.max(1, current.employeeCount), unitPrice: test.price }],
          },
    );
  const removeTest = (id: number) =>
    setWizard((current) => ({ ...current, tests: current.tests.filter((test) => test.id !== id) }));
  const save = () => {
    if (saving) return;
    setSaving(true);
    setOffers((current) => {
      const offer: Offer = {
        id: Date.now(),
        number: nextOfferNumber(current),
        companyId: wizard.companyId,
        company: wizard.company,
        contact: wizard.contact.trim(),
        title: wizard.title.trim(),
        offerType: wizard.offerType || undefined,
        status: "Taslak",
        total: Math.round(price.total),
        validUntil: isoToLabel(wizard.validUntil),
        createdAt: isoToLabel(todayIso()),
        items: wizard.tests.length,
        lines: wizard.tests.map((test) => ({
          testId: test.id,
          name: test.name,
          quantity: test.quantity,
          unitPrice: test.unitPrice ?? test.price,
        })),
        notes: wizard.notes.trim() || undefined,
        discount: price.discount,
        tax: price.tax,
      };
      return [...current, offer];
    });
    showNotice("Teklif taslağı oluşturuldu. Teklif listesine yönlendiriliyorsunuz...");
    window.setTimeout(() => router.push("/teklifler"), 700);
  };

  return (
    <Page size="narrow">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="p-4">
            <Button asChild size="xs" variant="ghost" className="-ml-2">
              <Link href="/teklifler">
                <ArrowLeft /> Tekliflere dön
              </Link>
            </Button>
            <p className="mt-4 text-xs font-medium text-muted">Teklif ve fiyatlandırma merkezi</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-heading">Yeni teklif oluştur</h1>
            <p className="mt-2 text-xs leading-5 text-muted">Hizmet kapsamını adım adım tamamlayın.</p>
          </Card>
          <WizardStepper current={step} onStep={goTo} />
        </aside>
        <Card className="flex min-w-0 flex-col rounded-3xl">
          <div className="p-5 sm:p-7">
            {step === 1 && (
              <StepCompany
                companies={companies}
                onGenerateTitle={generateTitle}
                onTitleEdited={() => {
                  titleEdited.current = true;
                }}
                submitted={submitted}
                update={update}
                wizard={wizard}
              />
            )}
            {step === 2 && (
              <StepServices
                addTest={addTest}
                removeTest={removeTest}
                submitted={submitted}
                tests={tests}
                update={update}
                wizard={wizard}
              />
            )}
            {step === 3 && <StepPricing price={price} update={update} wizard={wizard} />}
            {step === 4 && <StepReview price={price} wizard={wizard} />}
            {notice && <Alert className="mt-5">{notice}</Alert>}
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 rounded-b-3xl border-t border-divider bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-muted">Adım {step} / 4</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href="/teklifler">Vazgeç</Link>
              </Button>
              {step > 1 && (
                <Button onClick={back} size="sm" variant="outline">
                  <ArrowLeft /> Geri
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={next} size="sm">
                  Devam et <ArrowRight />
                </Button>
              ) : (
                <Button disabled={saving} onClick={save} size="sm" variant="brand">
                  <Check /> Teklif taslağını kaydet
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
