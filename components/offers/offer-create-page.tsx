"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { useCompanies, useOffers, useTests } from "@/lib/data";
import { nextOfferNumber, type Company, type Offer, type TestItem } from "@/lib/demo-data";
import { isoToLabel, labelToIso, todayIso } from "@/lib/format";
import { useNotice } from "@/lib/hooks";
import { useHydrated } from "@/lib/storage";
import { nextNumericId } from "@/lib/utils";
import StepCompany from "./wizard/step-company";
import StepConditions from "./wizard/step-conditions";
import StepPricing from "./wizard/step-pricing";
import StepReview from "./wizard/step-review";
import StepServices from "./wizard/step-services";
import StepTerms from "./wizard/step-terms";
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
  const [offers] = useOffers();
  const [tests] = useTests();
  if (!hydrated) return null;
  const preselectedId = Number(searchParams.get("firma"));
  const preselected = companies.find((company) => company.id === preselectedId);
  const editId = Number(searchParams.get("edit"));
  const existingOffer = offers.find((offer) => offer.id === editId);
  return <OfferWizard companies={companies} existingOffer={existingOffer} tests={tests.filter((test) => test.active)} preselected={preselected} />;
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

function wizardFromOffer(offer: Offer, tests: TestItem[]): WizardState {
  return {
    ...emptyWizard,
    companyId: offer.companyId,
    company: offer.company,
    offerType: offer.offerType || "",
    employeeCount: Math.max(1, tests.find((test) => offer.lines?.some((line) => line.testId === test.id)) ? (offer.lines?.[0]?.quantity || 1) : 1),
    contact: offer.contact,
    email: "",
    title: offer.title,
    validUntil: labelToIso(offer.validUntil),
    discount: String(offer.discount ?? 0),
    discountType: "fixed",
    tax: String(offer.tax ?? 0),
    paymentTerms: offer.paymentTerms === "peşin" || offer.paymentTerms === "net15" || offer.paymentTerms === "net30" || offer.paymentTerms === "net45" || offer.paymentTerms === "net60" || offer.paymentTerms === "taksit" ? offer.paymentTerms : "net30",
    deliveryDays: String(offer.deliveryDays ?? 7),
    tests: (offer.lines ?? []).map((line) => {
      const test = tests.find((item) => item.id === line.testId);
      return test ? { ...test, quantity: line.quantity, unitPrice: line.unitPrice } : { id: line.testId, code: "", name: line.name, category: "", price: line.unitPrice, active: true, quantity: line.quantity, unitPrice: line.unitPrice };
    }),
    coverLetterId: offer.coverLetterId ?? null,
    coverLetterText: offer.coverLetterText ?? "",
    selectedTerms: offer.terms ?? [],
    conditionsText: offer.conditionsText ?? "",
  };
}

function OfferWizard({
  companies,
  tests,
  preselected,
  existingOffer,
}: {
  companies: Company[];
  tests: TestItem[];
  preselected?: Company;
  existingOffer?: Offer;
}) {
  const router = useRouter();
  const [offers, setOffers] = useOffers();
  const [notice, showNotice] = useNotice();
  const [step, setStep] = useState<Step>(1);
  const [wizard, setWizard] = useState<WizardState>(() => existingOffer ? wizardFromOffer(existingOffer, tests) : initialWizard(preselected));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleEdited, setTitleEdited] = useState(Boolean(existingOffer));
  const price = calculatePrice(wizard);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setWizard((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" || titleEdited || !next.company || !next.offerType || !next.validUntil) return next;
      const monthYear = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
        new Date(`${next.validUntil}T12:00:00`),
      );
      return { ...next, title: `${next.company} - ${next.offerType} - ${monthYear} teklifi` };
    });
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
    goTo(Math.min(6, step + 1) as Step);
  };
  const back = () => goTo(Math.max(1, step - 1) as Step);
  const goToStep = (target: Step) => {
    const stepsBefore = Array.from({ length: target - 1 }, (_, i) => (i + 1) as Step);
    if (!stepsBefore.every((s) => isStepValid(s))) {
      setSubmitted(true);
      return;
    }
    goTo(target);
  };
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
    if (!isStepValid(1) || !isStepValid(2)) {
      setSubmitted(true);
      setStep(!isStepValid(1) ? 1 : 2);
      showNotice("Lütfen zorunlu alanları doldurun.");
      return;
    }
    setSaving(true);
    const offerId = existingOffer?.id ?? nextNumericId(offers);
    setOffers((current) => {
      const offer: Offer = {
        id: offerId,
        number: existingOffer?.number ?? nextOfferNumber(current),
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
        discount: price.discount,
        tax: price.tax,
        paymentTerms: wizard.paymentTerms,
        deliveryDays: Number(wizard.deliveryDays) || undefined,
        coverLetterId: wizard.coverLetterId,
        coverLetterText: wizard.coverLetterText.trim() || undefined,
        terms: wizard.selectedTerms,
        conditionsText: wizard.conditionsText.trim() || undefined,
      };
      if (!existingOffer) return [...current, offer];
      const revision = existingOffer.revision ?? 1;
      return current.map((item) => item.id === existingOffer.id ? {
        ...offer,
        revision: revision + 1,
        revisionHistory: [...(existingOffer.revisionHistory ?? []), { revision, createdAt: existingOffer.createdAt, note: "Düzenleme öncesi sürüm", status: existingOffer.status }],
        activities: [...(existingOffer.activities ?? []), { id: `${Date.now()}`, type: "revised" as const, title: `Revizyon ${revision + 1} kaydedildi`, description: "Teklif düzenlenerek yeni sürüm oluşturuldu.", createdAt: new Date().toLocaleString("tr-TR") }],
      } : item);
    });
    showNotice(existingOffer ? "Teklif düzenlendi. Yeni revizyon oluşturuldu." : "Teklif taslağı oluşturuldu. Detay sayfasına yönlendiriliyorsunuz...");
    window.setTimeout(() => router.push(`/teklifler/${offerId}`), 700);
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
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-heading">
              {existingOffer ? "Teklifi düzenle" : "Yeni teklif oluştur"}
            </h1>
            <p className="mt-2 text-xs leading-5 text-muted">
              {existingOffer
                ? "Hizmet kapsamını güncelleyin; kayıt yeni bir revizyon olarak saklanır."
                : "Hizmet kapsamını adım adım tamamlayın."}
            </p>
          </Card>
          <WizardStepper current={step} onStep={goTo} />
        </aside>
        <Card className="flex min-w-0 flex-col rounded-3xl">
          <div className="p-5 sm:p-7">
            {step === 1 && (
              <StepCompany
                companies={companies}
                onTitleEdited={() => {
                  setTitleEdited(true);
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
            {step === 4 && <StepTerms update={update} wizard={wizard} />}
            {step === 5 && <StepConditions update={update} wizard={wizard} />}
            {step === 6 && <StepReview price={price} wizard={wizard} />}
            {notice && <Alert className="mt-5">{notice}</Alert>}
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 rounded-b-3xl border-t border-divider bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-muted">Adım {step} / 6</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href="/teklifler">Vazgeç</Link>
              </Button>
              {step > 1 && (
                <Button onClick={back} size="sm" variant="outline">
                  <ArrowLeft /> Geri
                </Button>
              )}
              {step < 6 ? (
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
