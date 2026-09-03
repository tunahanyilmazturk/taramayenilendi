"use client";

import { Building2, Check, FileText, Save, Upload } from "lucide-react";
import { useState } from "react";
import SettingsCard, { SectionHeading } from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { useNotice } from "@/lib/hooks";
import { storageKeys, useHydrated, useStoredState } from "@/lib/storage";

type Organization = {
  title: string;
  shortName: string;
  taxNumber: string;
  licenseNumber: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
};

const defaultOrganization: Organization = {
  title: "HanTech OSGB",
  shortName: "HanTech",
  taxNumber: "",
  licenseNumber: "",
  email: "info@hantech.com.tr",
  phone: "+90 212 000 00 00",
  city: "İstanbul",
  district: "Ataşehir",
  address: "İçerenköy Mah. HanTech Plaza, Ataşehir / İstanbul",
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OrganizationSettings() {
  const [organization, setOrganization] = useStoredState<Organization>(storageKeys.organization, defaultOrganization);
  const hydrated = useHydrated();

  return (
    <SettingsCard
      description="Uygulamayı kullanan OSGB’nin resmi ve iletişim bilgilerini yönetin."
      icon={Building2}
      title="Kurum bilgileri"
    >
      <OrganizationForm
        initial={{ ...defaultOrganization, ...organization }}
        key={hydrated ? "client" : "server"}
        onSave={setOrganization}
      />
    </SettingsCard>
  );
}

function OrganizationForm({ initial, onSave }: { initial: Organization; onSave: (value: Organization) => void }) {
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [notice, showNotice] = useNotice();
  const errors = {
    title: form.title.trim() ? "" : "Kurum unvanı zorunludur.",
    email: !form.email.trim() || emailPattern.test(form.email.trim()) ? "" : "Geçerli bir e-posta adresi girin.",
  };
  const shown = submitted ? errors : { title: "", email: "" };
  const setField = (key: keyof Organization, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave(
      Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as unknown as Organization,
    );
    showNotice("Kurum bilgileri kaydedildi.");
  };

  return (
    <form
      className="mt-6 space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <section>
        <SectionHeading description="PDF, teklif ve raporlarda kullanılacak kurum bilgileri." title="Temel bilgiler" />
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field error={shown.title} label="Kurum unvanı" required>
            <Input
              invalid={Boolean(shown.title)}
              onChange={(event) => setField("title", event.target.value)}
              value={form.title}
            />
          </Field>
          <Field label="Kısa ad">
            <Input onChange={(event) => setField("shortName", event.target.value)} value={form.shortName} />
          </Field>
          <Field label="Vergi numarası">
            <Input
              inputMode="numeric"
              onChange={(event) => setField("taxNumber", event.target.value)}
              placeholder="Vergi numarası"
              value={form.taxNumber}
            />
          </Field>
          <Field label="Yetki belge numarası">
            <Input
              onChange={(event) => setField("licenseNumber", event.target.value)}
              placeholder="OSGB yetki belge numarası"
              value={form.licenseNumber}
            />
          </Field>
        </div>
      </section>
      <section className="border-t border-divider pt-7">
        <SectionHeading description="Kurumun iletişim ve resmi yazışma bilgileri." title="İletişim ve adres" />
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field error={shown.email} label="Kurumsal e-posta">
            <Input
              invalid={Boolean(shown.email)}
              onChange={(event) => setField("email", event.target.value)}
              type="email"
              value={form.email}
            />
          </Field>
          <Field label="Telefon">
            <Input onChange={(event) => setField("phone", event.target.value)} type="tel" value={form.phone} />
          </Field>
          <Field label="İl">
            <Input onChange={(event) => setField("city", event.target.value)} value={form.city} />
          </Field>
          <Field label="İlçe">
            <Input onChange={(event) => setField("district", event.target.value)} value={form.district} />
          </Field>
          <Field className="sm:col-span-2" label="Açık adres">
            <Textarea
              className="min-h-24"
              onChange={(event) => setField("address", event.target.value)}
              value={form.address}
            />
          </Field>
        </div>
      </section>
      <section className="border-t border-divider pt-7">
        <SectionHeading
          description="İleride PDF ve kurum belgeleri bu alandan yönetilecek."
          title="Logo ve belgeler"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <UploadBox
            accept="image/png,image/jpeg,image/svg+xml"
            description="PNG, JPG veya SVG · Maks. 5 MB"
            fileName={logoName}
            onChange={setLogoName}
            title="Kurum logosu"
          />
          <UploadBox
            accept="application/pdf,image/png,image/jpeg"
            description="PDF veya görsel belge · Maks. 10 MB"
            fileName={documentName}
            onChange={setDocumentName}
            title="Yetki belgesi"
          />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-card-muted p-3 text-xs leading-5 text-muted">
          <FileText className="mt-0.5 size-4 shrink-0 text-brand" />
          Belgeler sonraki aşamada güvenli dosya alanına aktarılacak ve PDF/teklif çıktılarında otomatik kullanılacak.
        </div>
      </section>
      <div className="flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
        {notice ? (
          <Alert icon={Check}>{notice}</Alert>
        ) : (
          <p className="text-xs text-muted">Kurum bilgileri bu cihazda saklanır.</p>
        )}
        <Button className="sm:shrink-0" type="submit">
          <Save /> Kurum bilgilerini kaydet
        </Button>
      </div>
    </form>
  );
}

function UploadBox({
  title,
  description,
  accept,
  fileName,
  onChange,
}: {
  title: string;
  description: string;
  accept: string;
  fileName: string;
  onChange: (name: string) => void;
}) {
  return (
    <label className="group cursor-pointer rounded-2xl border border-dashed border-border-strong bg-card-muted p-5 transition-colors hover:border-brand-outline hover:bg-brand-soft/40">
      <div className="flex items-center gap-3">
        <IconBadge icon={Upload} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className={`mt-1 truncate text-[11px] ${fileName ? "font-medium text-brand-soft-fg" : "text-muted"}`}>
            {fileName || description}
          </p>
        </div>
      </div>
      <input
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0]?.name ?? "")}
        type="file"
      />
    </label>
  );
}
