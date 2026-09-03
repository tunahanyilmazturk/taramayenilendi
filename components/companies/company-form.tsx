"use client";

import { ArrowRight, Building2, CalendarDays, Check, FileText, ShieldCheck, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Alert, Modal } from "@/components/ui/modal";
import { contractStatuses, type Company, type ContractStatus } from "@/lib/demo-data";
import { isoToLabel, labelToIso } from "@/lib/format";

export type CompanyFormValues = {
  name: string;
  sector: string;
  city: string;
  district: string;
  contact: string;
  email: string;
  phone: string;
  employees: string;
  contract: ContractStatus;
  contractEnd: string;
};
type FormErrors = Partial<Record<keyof CompanyFormValues, string>>;

export const emptyCompanyForm: CompanyFormValues = {
  name: "",
  sector: "",
  city: "",
  district: "",
  contact: "",
  email: "",
  phone: "",
  employees: "",
  contract: "Aktif",
  contractEnd: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function companyToForm(company: Company): CompanyFormValues {
  return {
    name: company.name,
    sector: company.sector,
    city: company.city,
    district: company.district,
    contact: company.contact,
    email: company.email,
    phone: company.phone,
    employees: String(company.employees || ""),
    contract: company.contract,
    contractEnd: labelToIso(company.contractEnd),
  };
}

export function validateCompanyForm(form: CompanyFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Firma unvanı zorunludur.";
  if (!form.sector.trim()) errors.sector = "Sektör seçin.";
  if (!form.city.trim()) errors.city = "İl bilgisi zorunludur.";
  if (!form.contact.trim()) errors.contact = "Firma yetkilisi zorunludur.";
  if (!(Number(form.employees) > 0)) errors.employees = "Çalışan sayısı 0'dan büyük olmalıdır.";
  if (form.email.trim() && !emailPattern.test(form.email.trim())) errors.email = "Geçerli bir e-posta adresi girin.";
  return errors;
}

/** Creates a new record or updates `editingId` with the submitted form values. */
export function applyCompanyForm(companies: Company[], form: CompanyFormValues, editingId: number | null): Company[] {
  const values = {
    name: form.name.trim(),
    sector: form.sector.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    contact: form.contact.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    employees: Math.max(0, Number(form.employees) || 0),
    contract: form.contract,
    contractEnd: isoToLabel(form.contractEnd),
  };
  if (editingId === null) {
    const id = companies.length ? Math.max(...companies.map((company) => company.id)) + 1 : 1;
    return [...companies, { ...values, id, screenings: 0, lastScreening: "Henüz yok" }];
  }
  return companies.map((company) => (company.id === editingId ? { ...company, ...values } : company));
}

type CompanyFormProps = {
  open: boolean;
  company?: Company | null;
  sectors: string[];
  onClose: () => void;
  onSave: (values: CompanyFormValues) => void;
};

/** Create / edit dialog. Remounts on every open so the form state always starts fresh. */
export function CompanyForm({ open, ...props }: CompanyFormProps) {
  if (!open) return null;
  return <CompanyFormDialog {...props} />;
}

function CompanyFormDialog({ company, sectors, onClose, onSave }: Omit<CompanyFormProps, "open">) {
  const editing = Boolean(company);
  const [form, setForm] = useState<CompanyFormValues>(company ? companyToForm(company) : emptyCompanyForm);
  const [submitted, setSubmitted] = useState(false);
  const errors = validateCompanyForm(form);
  const shown = submitted ? errors : {};
  const hasErrors = Object.keys(errors).length > 0;
  const sectorOptions = form.sector && !sectors.includes(form.sector) ? [form.sector, ...sectors] : sectors;
  const setField = <K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    setSubmitted(true);
    if (hasErrors) return;
    onSave(form);
  };

  return (
    <Modal
      description="OSGB hizmet süreçleri için firma profilini temel bilgilerle oluşturun."
      eyebrow="Firma kaydı"
      footer={
        <>
          <p className="mr-auto text-[11px] text-subtle">Daha sonra firma detaylarından güncelleyebilirsiniz.</p>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={submit}>
            <Check /> {editing ? "Değişiklikleri kaydet" : "Firmayı oluştur"}
            <ArrowRight />
          </Button>
        </>
      }
      icon={Building2}
      onClose={onClose}
      open
      size="xl"
      title={editing ? "Firma bilgilerini düzenle" : "Yeni firma ekle"}
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FormSection
          description="Firmanızı listelerde ve raporlarda tanımlayacak bilgiler."
          icon={Building2}
          title="Firma kimliği"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field error={shown.name} label="Firma unvanı" required>
              <Input
                invalid={Boolean(shown.name)}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Örn. HanTech Sanayi A.Ş."
                value={form.name}
              />
            </Field>
            <Field error={shown.sector} label="Sektör" required>
              <Select
                invalid={Boolean(shown.sector)}
                onChange={(event) => setField("sector", event.target.value)}
                value={form.sector}
              >
                <option value="">Sektör seçin</option>
                {sectorOptions.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </Select>
            </Field>
            <Field error={shown.employees} label="Çalışan sayısı" required>
              <Input
                inputMode="numeric"
                invalid={Boolean(shown.employees)}
                min={1}
                onChange={(event) => setField("employees", event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Örn. 120"
                type="number"
                value={form.employees}
              />
            </Field>
            <Field error={shown.city} label="İl" required>
              <Input
                invalid={Boolean(shown.city)}
                onChange={(event) => setField("city", event.target.value)}
                placeholder="Örn. İstanbul"
                value={form.city}
              />
            </Field>
            <Field label="İlçe">
              <Input
                onChange={(event) => setField("district", event.target.value)}
                placeholder="Örn. Ataşehir"
                value={form.district}
              />
            </Field>
          </div>
        </FormSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSection description="Firma yetkilisi ve iletişim bilgileri." icon={UsersRound} title="İletişim kişisi">
            <div className="space-y-4">
              <Field error={shown.contact} label="Firma yetkilisi" required>
                <Input
                  invalid={Boolean(shown.contact)}
                  onChange={(event) => setField("contact", event.target.value)}
                  placeholder="Ad soyad"
                  value={form.contact}
                />
              </Field>
              <Field error={shown.email} label="E-posta">
                <Input
                  invalid={Boolean(shown.email)}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="yetkili@firma.com"
                  type="email"
                  value={form.email}
                />
              </Field>
              <Field label="Telefon">
                <Input
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                  type="tel"
                  value={form.phone}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection
            description="Sözleşme durumunu ve yenileme takibini tanımlayın."
            icon={ShieldCheck}
            title="Sözleşme ve hizmet"
          >
            <div className="space-y-4">
              <Field label="Sözleşme bitiş tarihi">
                <Input
                  icon={CalendarDays}
                  onChange={(event) => setField("contractEnd", event.target.value)}
                  type="date"
                  value={form.contractEnd}
                />
              </Field>
              <Field label="Sözleşme durumu">
                <Select
                  onChange={(event) => setField("contract", event.target.value as ContractStatus)}
                  value={form.contract}
                >
                  {contractStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </FormSection>
        </div>
        {submitted && hasErrors && (
          <Alert icon={FileText} tone="danger">
            Lütfen işaretli alanları kontrol edin.
          </Alert>
        )}
        <button className="hidden" type="submit" />
      </form>
    </Modal>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card-muted p-4 sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <IconBadge icon={Icon} />
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
