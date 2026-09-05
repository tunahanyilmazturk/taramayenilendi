"use client";

import { Field, Input } from "@/components/ui/field";
import { companyLocation, type Company } from "@/lib/demo-data";
import CompanyPicker from "../offers/wizard/company-picker";

type Draft = {
  companyId: number;
  screeningType: "Periyodik sağlık taraması" | "İşe giriş muayenesi";
  title: string;
  date: string;
  time: string;
  location: string;
  contact: string;
  email: string;
  participants: number;
};
type Update = <K extends string>(key: K, value: unknown) => void;

export default function ScreeningStepCompany({
  companies,
  draft,
  update,
}: {
  companies: Company[];
  draft: Draft;
  update: Update;
}) {
  const selected = companies.find((company) => company.id === draft.companyId);
  const chooseCompany = (company: Company) => {
    update("companyId", company.id);
    update("title", draft.title || `${company.name} - ${draft.screeningType}`);
    update("contact", company.contact);
    update("email", company.email);
    update("location", draft.location || companyLocation(company));
    update("participants", company.employees);
  };
  const chooseType = (type: Draft["screeningType"]) => {
    update("screeningType", type);
    if (selected && !draft.title) update("title", `${selected.name} - ${type}`);
  };
  return (
    <section>
      <div className="mt-4 grid min-h-[420px] gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="text-foreground mb-4 text-sm font-bold">Firma seçimi</p>
            <Field label="Firma" required>
              <CompanyPicker companies={companies} onSelect={chooseCompany} value={draft.companyId} />
            </Field>
            {selected && (
              <p className="text-muted mt-3 text-[11px]">
                {selected.sector} · {selected.employees} çalışan · {companyLocation(selected)}
              </p>
            )}
          </div>
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="text-foreground mb-4 text-sm font-bold">İletişim kişisi</p>
            <div className="space-y-4">
              <Field label="Firma yetkilisi">
                <Input
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder="Ad soyad"
                  value={draft.contact}
                />
              </Field>
              <Field label="Yetkili e-posta">
                <Input
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="yetkili@firma.com"
                  type="email"
                  value={draft.email}
                />
              </Field>
            </div>
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <p className="text-foreground mb-4 text-sm font-bold">Tarama detayları</p>
          <div className="space-y-5">
            <Field label="Tarama türü" required>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={`rounded-xl border p-3 text-left transition ${draft.screeningType === "Periyodik sağlık taraması" ? "border-brand-outline bg-brand-soft ring-brand-ring ring-2" : "border-border hover:border-brand-outline"}`}
                  onClick={() => chooseType("Periyodik sağlık taraması")}
                  type="button"
                >
                  <span className="text-foreground block text-xs font-bold">Periyodik sağlık taraması</span>
                  <span className="text-muted mt-1 block text-[10px]">Düzenli çalışan sağlığı taraması</span>
                </button>
                <button
                  className={`rounded-xl border p-3 text-left transition ${draft.screeningType === "İşe giriş muayenesi" ? "border-brand-outline bg-brand-soft ring-brand-ring ring-2" : "border-border hover:border-brand-outline"}`}
                  onClick={() => chooseType("İşe giriş muayenesi")}
                  type="button"
                >
                  <span className="text-foreground block text-xs font-bold">İşe giriş muayenesi</span>
                  <span className="text-muted mt-1 block text-[10px]">Yeni çalışan başlangıç muayenesi</span>
                </button>
              </div>
            </Field>
            <Field label="Tarama başlığı" required>
              <Input
                onChange={(event) => update("title", event.target.value)}
                placeholder="Firma ve tarama türünden otomatik oluşur"
                value={draft.title}
              />
            </Field>
            <p className="bg-card-muted text-muted rounded-xl px-3 py-2 text-[11px]">
              Tarih, saat ve saha konumu bir sonraki adımda planlanır.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
