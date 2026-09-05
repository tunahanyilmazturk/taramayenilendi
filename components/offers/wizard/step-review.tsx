"use client";

import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  Receipt,
  ScrollText,
  UsersRound,
} from "lucide-react";
import { isoToLongLabel, money } from "@/lib/format";
import { useCoverLetterTemplates, useOrganization } from "@/lib/data";
import { StepHeading } from "./step-heading";
import { PriceSummary } from "./step-pricing";
import {
  defaultCoverLetterTemplates,
  lineTotal,
  paymentTermsLabels,
  type PriceBreakdown,
  type WizardState,
} from "./types";

export default function StepReview({ wizard, price }: { wizard: WizardState; price: PriceBreakdown }) {
  const [organization] = useOrganization();
  const [templates] = useCoverLetterTemplates(defaultCoverLetterTemplates);
  const selectedTemplate = templates.find((t) => t.id === wizard.coverLetterId);
  const contactLine = [wizard.contact, wizard.email].filter(Boolean).join(" · ") || "Belirtilmedi";
  const totalTests = wizard.tests.length;
  const totalQuantity = wizard.tests.reduce((sum, t) => sum + t.quantity, 0);
  const conditionCount = wizard.selectedTerms.length;

  return (
    <div>
      <StepHeading
        eyebrow="6. Adım · Onay"
        title="Teklifi son kez kontrol edin"
        description="Aşağıdaki bilgileri kontrol edin ve taslağı kaydedin. Daha sonra teklif listesinden düzenleyebilirsiniz."
        icon={CheckCircle2}
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Company & offer info */}
          <ReviewSection icon={Building2} title="Firma ve teklif">
            <ReviewGrid>
              <ReviewField label="Firma" value={wizard.company || "Belirtilmedi"} />
              <ReviewField label="Teklif türü" value={wizard.offerType || "Belirtilmedi"} />
              <ReviewField label="Yetkili" value={contactLine} />
              <ReviewField label="Personel sayısı" value={`${wizard.employeeCount} kişi`} />
              <ReviewField label="Geçerlilik" value={isoToLongLabel(wizard.validUntil) || "Belirtilmedi"} />
              <ReviewField label="Teklif başlığı" value={wizard.title || "—"} full />
            </ReviewGrid>
          </ReviewSection>

          {/* Service items */}
          <ReviewSection
            icon={FileText}
            title="Hizmet kalemleri"
            badge={`${totalTests} test · ${totalQuantity} adet`}
          >
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left">
                <thead className="border-b border-divider bg-card-muted">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-bold tracking-wider text-subtle uppercase">Test</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold tracking-wider text-subtle uppercase">Adet</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold tracking-wider text-subtle uppercase">Birim</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold tracking-wider text-subtle uppercase">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {wizard.tests.map((test) => (
                    <tr className="text-xs" key={test.id}>
                      <td className="px-3 py-2 font-semibold text-foreground">{test.name}</td>
                      <td className="px-3 py-2 text-right text-muted">{test.quantity}</td>
                      <td className="px-3 py-2 text-right text-muted">{money(test.unitPrice ?? test.price)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">{money(lineTotal(test))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-divider bg-card-muted">
                  <tr className="text-xs font-bold">
                    <td className="px-3 py-2 text-muted" colSpan={3}>Ara toplam</td>
                    <td className="px-3 py-2 text-right text-foreground">{money(price.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ReviewSection>

          {/* Cover letter */}
          {wizard.coverLetterText && (
            <ReviewSection
              icon={Mail}
              title="Ön yazı"
              badge={selectedTemplate?.name}
            >
              <div className="whitespace-pre-line rounded-xl bg-card-muted p-4 text-[11px] leading-6 text-muted">
                {wizard.coverLetterText}
              </div>
            </ReviewSection>
          )}

          {/* Conditions */}
          {wizard.conditionsText && (
            <ReviewSection
              icon={ScrollText}
              title="Şartlar ve koşullar"
              badge={`${conditionCount} madde`}
            >
              <div className="whitespace-pre-line rounded-xl bg-card-muted p-4 text-[11px] leading-6 text-muted">
                {wizard.conditionsText}
              </div>
            </ReviewSection>
          )}

          {/* Organization info */}
          <ReviewSection icon={UsersRound} title="Teklifi sunan kurum">
            <ReviewGrid>
              <ReviewField label="Unvan" value={organization.title} />
              <ReviewField label="E-posta" value={organization.email} />
              <ReviewField label="Telefon" value={organization.phone} />
              <ReviewField
                label="Adres"
                value={`${organization.address}, ${organization.district} / ${organization.city}`}
                full
              />
              {organization.licenseNumber && (
                <ReviewField label="OSGB yetki belge no" value={organization.licenseNumber} full />
              )}
            </ReviewGrid>
          </ReviewSection>
        </div>

        {/* Sticky sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <PriceSummary price={price} wizard={wizard} />
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Receipt className="size-4 text-brand" />
              Ödeme ve teslimat
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Ödeme vadesi</dt>
                <dd className="font-semibold text-foreground">{paymentTermsLabels[wizard.paymentTerms]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Teslim süresi</dt>
                <dd className="font-semibold text-foreground">{wizard.deliveryDays} iş günü</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">KDV oranı</dt>
                <dd className="font-semibold text-foreground">%{wizard.tax}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">İndirim</dt>
                <dd className="font-semibold text-foreground">
                  {wizard.discountType === "percent" ? `%${wizard.discount}` : `${money(Number(wizard.discount))}`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Building2;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
            <Icon className="size-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-card-muted px-2.5 py-1 text-[10px] font-semibold text-muted">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function ReviewGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function ReviewField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`rounded-xl bg-card-muted px-3 py-2.5 ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-semibold tracking-wider text-subtle uppercase">{label}</p>
      <p className="mt-1 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
