"use client";

import { Check, UsersRound } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { companyLocation, offerTypes, type Company, type OfferType } from "@/lib/demo-data";
import { todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import type { UpdateWizard, WizardState } from "./types";

const quickDays = [7, 15, 30, 45, 60];
const requiredMessage = "Bu alan zorunludur.";

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
  const chooseCompany = (value: string) => {
    const company = companies.find((item) => String(item.id) === value);
    update("companyId", company?.id ?? null);
    update("company", company?.name ?? "");
    update("employeeCount", Math.max(1, company?.employees ?? 1));
    update("contact", company?.contact ?? "");
    update("email", company?.email ?? "");
    onGenerateTitle(company?.name ?? "", wizard.offerType, wizard.validUntil);
  };
  const chooseDate = (value: string) => {
    update("validUntil", value);
    onGenerateTitle(wizard.company, wizard.offerType, value);
  };
  return (
    <div>
      <StepHeading
        eyebrow="1. Adım · Müşteri"
        title="Firma ve teklif bilgileri"
        description="Teklifin kime ait olduğunu, türünü ve temel tanımını oluşturun."
        icon={UsersRound}
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Firma" required error={submitted && !wizard.companyId && requiredMessage}>
          <Select
            invalid={submitted && !wizard.companyId}
            onChange={(event) => chooseCompany(event.target.value)}
            value={wizard.companyId ?? ""}
          >
            <option value="">Firma seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Teklif türü" required error={submitted && !wizard.offerType && requiredMessage}>
          <div className="grid grid-cols-2 gap-2">
            {offerTypes.map((type) => {
              const active = wizard.offerType === type;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors",
                    active
                      ? "border-brand-outline bg-brand-soft text-brand-soft-fg"
                      : "border-border bg-card-muted text-muted hover:border-border-strong",
                  )}
                  key={type}
                  onClick={() => {
                    update("offerType", type);
                    onGenerateTitle(wizard.company, type, wizard.validUntil);
                  }}
                  type="button"
                >
                  {type}
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-soft">
                    {active && <Check className="size-3.5" />}
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
            placeholder="Firma ve teklif türü seçince otomatik oluşur"
            value={wizard.title}
          />
        </Field>
        <Field label="Geçerlilik tarihi" required error={submitted && !wizard.validUntil && requiredMessage}>
          <Input
            invalid={submitted && !wizard.validUntil}
            min={todayIso()}
            onChange={(event) => chooseDate(event.target.value)}
            type="date"
            value={wizard.validUntil}
          />
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium text-muted">Hızlı seçim:</span>
            {quickDays.map((days) => (
              <button
                className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                key={days}
                onClick={() => chooseDate(todayIso(days))}
                type="button"
              >
                {days} gün
              </button>
            ))}
          </span>
        </Field>
        <Field label="Firma yetkilisi">
          <Input onChange={(event) => update("contact", event.target.value)} placeholder="Ad soyad" value={wizard.contact} />
        </Field>
        <Field label="Yetkili e-posta">
          <Input
            onChange={(event) => update("email", event.target.value)}
            placeholder="yetkili@firma.com"
            type="email"
            value={wizard.email}
          />
        </Field>
        {selected && (
          <p className="rounded-xl bg-card-muted p-3 text-xs text-muted sm:col-span-2">
            Firma seçildi: <strong className="text-foreground">{selected.name}</strong>
            {companyLocation(selected) && <span> · {companyLocation(selected)}</span>}
            <span> · {selected.employees} çalışan</span>
            {wizard.offerType && <span> · {wizard.offerType}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
