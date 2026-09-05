"use client";

import {
  Building2,
  Calendar,
  Check,
  ClipboardCheck,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { companyLocation, type Company, type OfferType } from "@/lib/demo-data";
import { todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import CompanyPicker from "./company-picker";
import { StepHeading } from "./step-heading";
import type { UpdateWizard, WizardState } from "./types";

const quickDays = [7, 15, 30, 45, 60];
const requiredMessage = "Bu alan zorunludur.";

const offerTypeCards: { type: OfferType; description: string; icon: LucideIcon }[] = [
  {
    type: "Periyodik muayene",
    description: "Düzenli aralıklarla tekrarlanan çalışan sağlığı muayeneleri.",
    icon: ClipboardCheck,
  },
  {
    type: "İşe giriş muayenesi",
    description: "Yeni işe başlayan çalışanlar için tek seferlik muayene.",
    icon: UserPlus,
  },
];

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
  update: UpdateWizard;
  submitted: boolean;
  onGenerateTitle: (company: string, offerType: OfferType | "", validUntil: string) => void;
  onTitleEdited: () => void;
}) {
  const selected = companies.find((company) => company.id === wizard.companyId);
  const chooseCompany = (company: Company) => {
    update("companyId", company.id);
    update("company", company.name);
    update("employeeCount", Math.max(1, company.employees));
    update("contact", company.contact);
    update("email", company.email);
    onGenerateTitle(company.name, wizard.offerType, wizard.validUntil);
  };
  const chooseDate = (value: string) => {
    update("validUntil", value);
    onGenerateTitle(wizard.company, wizard.offerType, value);
  };
  const syncEmployeeCount = (value: number) => {
    const count = Math.max(1, value || 1);
    update("employeeCount", count);
    update(
      "tests",
      wizard.tests.map((test) => ({ ...test, quantity: count })),
    );
  };
  return (
    <div>
      <StepHeading
        eyebrow="1. Adım · Müşteri"
        title="Firma ve teklif bilgileri"
        description="Teklifin kime ait olduğunu, türünü ve temel tanımını oluşturun."
        icon={UsersRound}
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {/* Sol sütun: Firma seçimi + İletişim ve personel */}
        <div className="space-y-6">
          <FormSection icon={Building2} title="Firma seçimi">
            <Field label="Firma" required error={submitted && !wizard.companyId && requiredMessage}>
              <CompanyPicker
                companies={companies}
                invalid={submitted && !wizard.companyId}
                onSelect={chooseCompany}
                value={wizard.companyId}
              />
            </Field>
            {selected && (
              <CompanyDetailCard
                company={selected}
                employeeCount={wizard.employeeCount}
                offerType={wizard.offerType}
              />
            )}
          </FormSection>

          <FormSection icon={UsersRound} title="İletişim ve personel">
            <div className="grid gap-4">
              <Field label="Firma yetkilisi">
                <Input
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder="Ad soyad"
                  value={wizard.contact}
                />
              </Field>
              <Field label="Yetkili e-posta">
                <Input
                  icon={Mail}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="yetkili@firma.com"
                  type="email"
                  value={wizard.email}
                />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Sağ sütun: Teklif detayları */}
        <FormSection icon={ClipboardCheck} title="Teklif detayları">
          <Field label="Teklif türü" required error={submitted && !wizard.offerType && requiredMessage}>
            <div className="grid gap-3">
              {offerTypeCards.map((card) => {
                const active = wizard.offerType === card.type;
                const Icon = card.icon;
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all",
                      active
                        ? "border-brand-outline bg-brand-soft ring-2 ring-brand-ring"
                        : "border-border bg-card hover:border-border-strong hover:bg-card-muted",
                    )}
                    key={card.type}
                    onClick={() => {
                      update("offerType", card.type);
                      onGenerateTitle(wizard.company, card.type, wizard.validUntil);
                    }}
                    type="button"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        active ? "bg-brand text-brand-fg" : "bg-neutral-soft text-neutral",
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-bold leading-tight",
                          active ? "text-brand-soft-fg" : "text-foreground",
                        )}
                      >
                        {card.type}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-muted">{card.description}</p>
                    </div>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        active ? "border-brand bg-brand text-brand-fg" : "border-border-strong bg-transparent",
                      )}
                    >
                      {active && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Teklif başlığı" required error={submitted && !wizard.title.trim() && requiredMessage}>
            <Input
              invalid={submitted && !wizard.title.trim()}
              onChange={(event) => {
                onTitleEdited();
                update("title", event.target.value);
              }}
              placeholder="Otomatik oluşur"
              value={wizard.title}
            />
          </Field>
          <Field label="Geçerlilik tarihi" required error={submitted && !wizard.validUntil && requiredMessage}>
            <Input
              icon={Calendar}
              invalid={submitted && !wizard.validUntil}
              min={todayIso()}
              onChange={(event) => chooseDate(event.target.value)}
              type="date"
              value={wizard.validUntil}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted">Hızlı:</span>
              {quickDays.map((days) => (
                <button
                  className={cn(
                    "rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                    wizard.validUntil === todayIso(days)
                      ? "border-brand-outline bg-brand-soft text-brand-soft-fg"
                      : "border-border text-muted hover:border-brand-outline hover:text-brand",
                  )}
                  key={days}
                  onClick={() => chooseDate(todayIso(days))}
                  type="button"
                >
                  {days} gün
                </button>
              ))}
            </div>
          </Field>
          <Field hint="Tüm kalemlerin adedini günceller." label="Personel sayısı">
            <Input
              className="max-w-36"
              min={1}
              onChange={(event) => syncEmployeeCount(Number(event.target.value))}
              size="sm"
              suffix="kişi"
              type="number"
              value={wizard.employeeCount}
            />
          </Field>
        </FormSection>
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function CompanyDetailCard({
  company,
  employeeCount,
  offerType,
}: {
  company: Company;
  employeeCount: number;
  offerType: OfferType | "";
}) {
  const location = companyLocation(company);
  return (
    <div className="rounded-2xl border border-brand-outline bg-brand-soft/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{company.name}</p>
            {company.contract && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-soft-fg">
                {company.contract}
              </span>
            )}
          </div>
          <div className="mt-2 grid gap-2 text-xs text-muted sm:grid-cols-2">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-subtle" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <UsersRound className="size-3.5 shrink-0 text-subtle" />
              {company.employees} çalışan{" "}
              {employeeCount !== company.employees && <span className="text-brand">→ {employeeCount}</span>}
            </span>
            {company.contact && (
              <span className="flex items-center gap-1.5">
                <UsersRound className="size-3.5 shrink-0 text-subtle" />
                {company.contact}
              </span>
            )}
            {company.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0 text-subtle" />
                {company.phone}
              </span>
            )}
            {company.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0 text-subtle" />
                {company.email}
              </span>
            )}
          </div>
          {offerType && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand-soft-fg">
              <Check className="size-3" /> {offerType} teklifi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
