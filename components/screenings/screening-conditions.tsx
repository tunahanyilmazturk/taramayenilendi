"use client";

import { Check, FileText, Pencil, RefreshCcw, ScrollText } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/field";
import { useConditionTemplates, type ConditionTemplate } from "@/lib/data";
import { cn } from "@/lib/utils";
import TemplateManagerModal from "../offers/wizard/template-manager-modal";

const defaultTemplates: ConditionTemplate[] = [
  { id: 1, title: "Saha hazırlığı", body: "1. Firma, tarama öncesinde güncel çalışan listesini ve vardiya planını paylaşır.\n\n2. Tarama alanı; ekip, ekipman ve katılımcıların güvenli hareket edebileceği şekilde hazır bulundurulur.\n\n3. Katılımcıların belirlenen saat aralıklarında hazır olması sağlanır." },
  { id: 2, title: "Uygulama koşulları", body: "1. Tarama, planlanan tarih ve saha konumunda, sorumlu ekip tarafından gerçekleştirilir.\n\n2. Katılımcılar, kimlik kontrolü ve gerekli bilgilendirme sonrasında sırayla sürece dahil edilir.\n\n3. Uygulama sırasında sağlık ve iş güvenliği kurallarına uyulur." },
  { id: 3, title: "Katılım ve erteleme", body: "1. Tarama gününde katılamayan çalışanlar için ek uygulama planı ayrıca değerlendirilir.\n\n2. Saha koşullarının uygun olmaması halinde uygulama, tarafların mutabık kalacağı yeni bir tarihe alınabilir." },
  { id: 4, title: "Raporlama", body: "1. Tarama sonuçları hizmet tamamlandıktan sonra belirlenen yetkili kişilere teslim edilir.\n\n2. Raporlama süresi, testlerin niteliğine ve saha planına göre taraflarca belirlenir." },
  { id: 5, title: "Gizlilik ve KVKK", body: "1. Sağlık verileri ve kişisel bilgiler yalnızca yetkili kişilerle paylaşılır.\n\n2. Tüm kayıtlar yürürlükteki kişisel verilerin korunması mevzuatına uygun şekilde işlenir ve saklanır." },
];

const descriptions: Record<string, string> = {
  "Saha hazırlığı": "Tarama öncesi hazırlıklar",
  "Uygulama koşulları": "Saha uygulama esasları",
  "Katılım ve erteleme": "Katılımcı devamlılığı",
  Raporlama: "Sonuçların teslimi",
  "Gizlilik ve KVKK": "Veri güvenliği",
};

export default function ScreeningConditions({ value, update }: { value: string; update: (value: string) => void }) {
  const [templates, setTemplates] = useConditionTemplates(defaultTemplates);
  const [selected, setSelected] = useState<number[]>([]);
  const compiled = (ids: number[]) => templates.filter((template) => ids.includes(template.id)).map((template, index) => `${index + 1}. ${template.title.toUpperCase()}\n${template.body}`).join("\n\n");
  const toggle = (id: number) => { const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]; setSelected(next); update(compiled(next)); };
  const selectAll = () => { const all = templates.map((template) => template.id); setSelected(all); update(compiled(all)); };
  const clearAll = () => { setSelected([]); update(""); };
  return <section><div className="space-y-4"><div className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileText className="size-4" /></span><div><h3 className="text-sm font-bold text-foreground">Hazır koşul maddeleri</h3><p className="mt-1 text-[10px] text-muted">Birden fazla madde seçin veya kendi şablonunuzu yönetin.</p></div></div><div className="flex items-center gap-1.5"><button className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted hover:border-brand-outline hover:text-brand" onClick={selectAll} type="button">Tümünü seç</button><button className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted hover:border-danger hover:text-danger" onClick={clearAll} type="button">Temizle</button><TemplateManagerModal onSave={setTemplates} templates={templates} type="condition" /></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{templates.map((template) => { const active = selected.includes(template.id); return <button aria-pressed={active} className={cn("rounded-xl border p-3 text-left transition-all", active ? "border-brand-outline bg-brand-soft ring-2 ring-brand-ring" : "border-border hover:border-brand-outline hover:bg-card-muted")} key={template.id} onClick={() => toggle(template.id)} type="button"><span className="flex items-start gap-2"><span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-brand bg-brand text-brand-fg" : "border-border-strong")}>{active && <Check className="size-3" />}</span><span><strong className={cn("block text-xs", active ? "text-brand-soft-fg" : "text-foreground")}>{template.title}</strong><small className="mt-1 block text-[10px] text-muted">{descriptions[template.title] ?? "Tarama uygulama koşulu"}</small></span></span></button>; })}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-2.5"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Pencil className="size-4" /></span><h3 className="text-sm font-bold text-foreground">Şartlar metni{selected.length > 0 && <span className="ml-2 rounded-full bg-card-muted px-2 py-0.5 text-[10px] font-semibold text-muted">{selected.length} madde</span>}</h3></div>{selected.length > 0 && <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted hover:border-brand-outline hover:text-brand" onClick={() => update(compiled(selected))} type="button"><RefreshCcw className="size-3" /> Şablona sıfırla</button>}</div>{selected.length > 0 ? <Textarea className="min-h-72 text-xs leading-6" onChange={(event) => update(event.target.value)} value={value} /> : <div className="rounded-xl border border-dashed border-border-strong py-12 text-center"><ScrollText className="mx-auto size-8 text-subtle" /><p className="mt-3 text-xs font-semibold text-muted">Henüz şart seçilmedi</p><p className="mt-1 text-[10px] text-subtle">Yukarıdaki hazır maddelerden seçim yapın.</p></div>}</div></div></section>;
}
