"use client";

import { Check, FileText, Mail, Pencil, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/field";
import { useCoverLetterTemplates, type CoverLetterTemplate } from "@/lib/data";
import { isoToLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import TemplateManagerModal from "../offers/wizard/template-manager-modal";

const defaultTemplates: CoverLetterTemplate[] = [
  { id: 1, name: "Standart", icon: "standard", description: "Profesyonel ve dengeli", body: "Sayın Yetkili,\n\n{{company}} firması çalışanlarının sağlığını desteklemek amacıyla planlanan {{type}} kapsamında hazırladığımız çalışma planını bilgilerinize sunarız. Tarama {{date}} tarihinde {{location}} adresinde, uzman ekibimiz ve uygun ekipmanlarımızla gerçekleştirilecektir.\n\nÇalışmanın {{employees}} çalışanı kapsaması ve sonuçların süreç tamamlandıktan sonra yetkili kişilere sunulması planlanmaktadır.\n\nSaygılarımızla," },
  { id: 2, name: "Kısa", icon: "standard", description: "Öz ve net", body: "Sayın Yetkili,\n\n{{company}} firması için hazırlanan {{type}} uygulama planını bilgilerinize sunarız. Tarama {{date}} tarihinde {{location}} adresinde gerçekleştirilecektir.\n\nSaygılarımızla," },
  { id: 3, name: "Detaylı", icon: "standard", description: "Kapsam ve süreç odaklı", body: "Sayın Yetkili,\n\n{{company}} firmasının çalışan sağlığı ihtiyaçları doğrultusunda planlanan {{type}}; belirlenen test kapsamı, sorumlu ekip ve mobil ekipmanlarla yürütülecektir. {{employees}} çalışan için planlanan uygulama {{date}} tarihinde {{location}} adresinde gerçekleştirilecektir.\n\nKatılımcı süreci, saha koordinasyonu, ölçüm ve raporlama adımları ilgili mevzuata ve kurumunuzun saha kurallarına uygun biçimde takip edilecektir.\n\nİş birliğiniz için teşekkür eder, sağlıklı günler dileriz.\n\nSaygılarımızla," },
  { id: 4, name: "Kurumsal", icon: "standard", description: "Resmî ve mevzuat odaklı", body: "Sayın Yetkili,\n\n6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili mevzuat kapsamında {{company}} firması için planlanan {{type}} hizmetini sunarız. Uygulama, {{employees}} çalışanın katılımıyla {{date}} tarihinde {{location}} adresinde gerçekleştirilecektir.\n\nSüreç boyunca kişisel verilerin korunmasına, sağlık bilgilerinin gizliliğine ve güvenli çalışma esaslarına riayet edilecektir.\n\nSaygılarımızla," },
];

const descriptions: Record<string, string> = {
  Standart: "Profesyonel ve dengeli",
  Kısa: "Öz ve net",
  Detaylı: "Kapsam ve süreç odaklı",
  Kurumsal: "Resmî ve mevzuat odaklı",
};

function fill(body: string, values: Record<string, string>) { return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "—"); }

export default function ScreeningCoverLetter({ value, update, company, draft }: { value: string; update: (value: string) => void; company: string; draft: { screeningType: string; date: string; location: string; participants: number } }) {
  const [templates, setTemplates] = useCoverLetterTemplates(defaultTemplates);
  const [selected, setSelected] = useState<number | null>(null);
  const values = { company, type: draft.screeningType, date: draft.date ? isoToLabel(draft.date) : "planlanan tarihte", location: draft.location || "belirlenecek saha konumunda", employees: String(draft.participants || 0) };
  const selectTemplate = (id: number) => { const template = templates.find((item) => item.id === id); if (!template) return; setSelected(id); update(fill(template.body, values)); };
  const active = templates.find((item) => item.id === selected);
  return <section><div className="mt-4 space-y-5"><div className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileText className="size-4" /></span><div><h3 className="text-sm font-bold text-foreground">Hazır ön yazı şablonları</h3><p className="mt-1 text-[10px] text-muted">Tarama bilgileri seçtiğiniz şablona otomatik işlenir.</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-card-muted px-2 py-1 text-[10px] font-semibold text-muted">{templates.length} seçenek</span><TemplateManagerModal onSave={setTemplates} templates={templates} type="coverLetter" /></div></div><div className="grid gap-2 sm:grid-cols-2">{templates.map((template) => { const isActive = selected === template.id; return <button aria-pressed={isActive} className={cn("rounded-xl border p-3 text-left transition-all", isActive ? "border-brand-outline bg-brand-soft ring-2 ring-brand-ring" : "border-border hover:border-brand-outline hover:bg-card-muted")} key={template.id} onClick={() => selectTemplate(template.id)} type="button"><span className="flex items-start gap-2"><span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", isActive ? "border-brand bg-brand text-brand-fg" : "border-border-strong")}>{isActive && <Check className="size-3" />}</span><span><strong className={cn("block text-xs", isActive ? "text-brand-soft-fg" : "text-foreground")}>{template.name}</strong><small className="mt-1 block text-[10px] text-muted">{descriptions[template.name] ?? "Özel ön yazı şablonu"}</small></span></span></button>; })}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Pencil className="size-4" /></span><h3 className="text-sm font-bold text-foreground">Ön yazı metni{active && <span className="ml-2 text-muted">· {active.name}</span>}</h3></div>{active && <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted hover:border-brand-outline hover:text-brand" onClick={() => update(fill(active.body, values))} type="button"><RefreshCcw className="size-3" /> Şablona sıfırla</button>}</div>{selected === null ? <div className="rounded-xl border border-dashed border-border-strong py-12 text-center"><Mail className="mx-auto size-8 text-subtle" /><p className="mt-3 text-xs font-semibold text-muted">Ön yazı seçilmedi</p><p className="mt-1 text-[10px] text-subtle">Yukarıdan bir şablon seçin.</p></div> : <Textarea className="min-h-72 text-xs leading-6" onChange={(event) => update(event.target.value)} value={value} />}</div></div></section>;
}
