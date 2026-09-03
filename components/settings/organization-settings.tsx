"use client";

import { Building2, Check, FileText, Save, Upload } from "lucide-react";
import { useState } from "react";
import SettingsCard from "./settings-card";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm text-[#173e3b] outline-none transition focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#e8f7f1] dark:focus:ring-[#1d5a4b]";

export default function OrganizationSettings() {
  const [saved, setSaved] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  return (
    <SettingsCard
      icon={Building2}
      title="Kurum bilgileri"
      description="Uygulamayı kullanan OSGB’nin resmi ve iletişim bilgilerini yönetin."
    >
      <div className="mt-6 space-y-7">
        <section>
          <SectionHeading
            title="Temel bilgiler"
            description="PDF, teklif ve raporlarda kullanılacak kurum bilgileri."
          />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Kurum unvanı" value="HanTech OSGB" />
            <Field label="Kısa ad" value="HanTech" />
            <Field label="Vergi numarası" value="" placeholder="Vergi numarası" />
            <Field label="Yetki belge numarası" value="" placeholder="OSGB yetki belge numarası" />
          </div>
        </section>
        <section className="border-t border-[#edf3f0] pt-7 dark:border-[#26364a]">
          <SectionHeading title="İletişim ve adres" description="Kurumun iletişim ve resmi yazışma bilgileri." />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Kurumsal e-posta" value="info@hantech.com.tr" type="email" />
            <Field label="Telefon" value="+90 212 000 00 00" type="tel" />
            <Field label="İl" value="İstanbul" />
            <Field label="İlçe" value="Ataşehir" />
            <label className="text-sm font-medium text-[#31534f] sm:col-span-2 dark:text-[#c4dfd5]">
              Açık adres
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] p-3 text-sm text-[#173e3b] outline-none focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] dark:border-[#2b4057] dark:bg-[#111827] dark:text-[#e8f7f1] dark:focus:ring-[#1d5a4b]"
                defaultValue="İçerenköy Mah. HanTech Plaza, Ataşehir / İstanbul"
              />
            </label>
          </div>
        </section>
        <section className="border-t border-[#edf3f0] pt-7 dark:border-[#26364a]">
          <SectionHeading
            title="Logo ve belgeler"
            description="İleride PDF ve kurum belgeleri bu alandan yönetilecek."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <UploadBox
              title="Kurum logosu"
              description="PNG, JPG veya SVG · Maks. 5 MB"
              accept="image/png,image/jpeg,image/svg+xml"
              fileName={logoName}
              onChange={setLogoName}
            />
            <UploadBox
              title="Yetki belgesi"
              description="PDF veya görsel belge · Maks. 10 MB"
              accept="application/pdf,image/png,image/jpeg"
              fileName={documentName}
              onChange={setDocumentName}
            />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f7fcf9] p-3 text-xs leading-5 text-[#718783] dark:bg-[#111827] dark:text-[#9ebbb3]">
            <FileText className="mt-0.5 size-4 shrink-0 text-[#299b7c]" /> Belgeler sonraki aşamada güvenli dosya
            alanına aktarılacak ve PDF/teklif çıktılarında otomatik kullanılacak.
          </div>
        </section>
        <div className="flex justify-end border-t border-[#edf3f0] pt-6 dark:border-[#26364a]">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174e4b]"
            onClick={save}
            type="button"
          >
            {saved ? <Check className="size-4" /> : <Save className="size-4" />}{" "}
            {saved ? "Kurum bilgileri kaydedildi" : "Kurum bilgilerini kaydet"}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">{title}</p>
      <p className="mt-1 text-xs text-[#81958f] dark:text-[#91b0a6]">{description}</p>
    </div>
  );
}
function Field({
  label,
  value,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
      {label}
      <input className={inputClass} defaultValue={value} placeholder={placeholder} type={type} />
    </label>
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
    <label className="group cursor-pointer rounded-2xl border border-dashed border-[#cfe6da] bg-[#fbfdfc] p-5 transition hover:border-[#55b99c] hover:bg-[#f7fcf9] dark:border-[#2b4057] dark:bg-[#111827] dark:hover:border-[#55b99c]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Upload className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">{title}</p>
          <p className="mt-1 text-[11px] text-[#81958f]">{fileName || description}</p>
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
