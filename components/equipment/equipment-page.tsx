"use client";

import { BusFront, CalendarClock, Check, Edit3, HardHat, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { useEquipment, useTeam } from "@/lib/data";
import { equipmentStatuses, type Equipment, type EquipmentKind, type EquipmentStatus } from "@/lib/demo-data";
import { useConfirm, useNotice } from "@/lib/hooks";
import { includesQuery } from "@/lib/utils";

type EquipmentForm = Omit<Equipment, "id">;
const emptyForm: EquipmentForm = { kind: "Ekipman", name: "", type: "", brandModel: "", serialNumber: "", status: "Kullanımda", location: "", responsible: "", calibrationDate: "", nextCalibration: "", lastMaintenance: "", notes: "", plateNumber: "", inspectionDate: "", insuranceEnd: "" };
const statusTone: Record<EquipmentStatus, "brand" | "warning" | "danger" | "neutral"> = { "Kullanımda": "brand", "Bakımda": "warning", "Kalibrasyon bekliyor": "warning", "Pasif": "danger" };

export default function EquipmentPage() {
  const [equipment, setEquipment] = useEquipment();
  const [team] = useTeam();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tümü");
  const [kind, setKind] = useState<EquipmentKind>("Ekipman");
  const [editor, setEditor] = useState<{ open: boolean; item: Equipment | null }>({ open: false, item: null });

  const filtered = useMemo(() => equipment.filter((item) => item.kind === kind && (status === "Tümü" || item.status === status) && includesQuery(`${item.name} ${item.type} ${item.brandModel} ${item.serialNumber} ${item.plateNumber ?? ""} ${item.location} ${item.responsible}`, query)), [equipment, query, status, kind]);
  const openNew = () => setEditor({ open: true, item: null });
  const openEdit = (item: Equipment) => setEditor({ open: true, item });
  const save = (values: EquipmentForm) => {
    const normalized = { ...values, kind, type: kind === "Mobil araç" ? "Mobil araç" : values.type.trim(), name: values.name.trim(), serialNumber: values.serialNumber.trim() };
    if (!normalized.name || !normalized.type) return;
    setEquipment((current) => editor.item ? current.map((item) => item.id === editor.item?.id ? { ...normalized, id: item.id } : item) : [...current, { ...normalized, id: Date.now() }]);
    setEditor({ open: false, item: null });
    showNotice(editor.item ? "Kayıt güncellendi." : `${kind === "Mobil araç" ? "Mobil araç" : "Ekipman"} envantere eklendi.`);
  };
  const remove = (item: Equipment) => confirm({ title: `${item.kind} kaydını sil`, description: `${item.name} envanterden kaldırılacak.`, onConfirm: () => { setEquipment((current) => current.filter((entry) => entry.id !== item.id)); showNotice("Kayıt envanterden kaldırıldı."); } });

  return (
    <Page>
      <PageHeader actions={<Button onClick={openNew}><Plus /> {kind === "Mobil araç" ? "Mobil araç ekle" : "Ekipman ekle"}</Button>} description="Tarama ve muayene süreçlerinde kullandığınız araç ve cihazları tek merkezden yönetin." eyebrow="Operasyon kaynakları" title="Araç ve ekipmanlar" />
      {notice && <Alert className="mt-4" icon={Check}>{notice}</Alert>}
      <div className="mt-7 flex gap-1 border-b border-divider" role="tablist" aria-label="Varlık türü">
        {(["Ekipman", "Mobil araç"] as EquipmentKind[]).map((item) => <button aria-selected={kind === item} className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${kind === item ? "text-brand" : "text-muted hover:text-foreground"}`} key={item} onClick={() => { setKind(item); setStatus("Tümü"); setQuery(""); }} role="tab" type="button">{item === "Ekipman" ? <HardHat className="size-4" /> : <BusFront className="size-4" />}{item}{kind === item && <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-brand" />}</button>)}
      </div>
      <Card aria-label="Ekipman filtreleri" className="mt-7 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-sm font-semibold text-foreground">{kind} envanteri</h2><p className="mt-1 text-xs text-subtle">{kind === "Mobil araç" ? "Plaka, model, görev bölgesi veya sorumlu kişiyle arayın." : "Cihaz adı, seri numarası, konum veya sorumlu kişiyle arayın."}</p></div>
          <Select aria-label="Ekipman durumu" className="h-10 w-full text-xs lg:w-52" onChange={(event) => setStatus(event.target.value)} value={status}><option>Tümü</option>{equipmentStatuses.map((item) => <option key={item}>{item}</option>)}</Select>
        </div>
        <label className="relative mt-4 block"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" /><Input aria-label={`${kind} ara`} className="h-11 pl-10" onChange={(event) => setQuery(event.target.value)} placeholder={kind === "Mobil araç" ? "Araç, plaka, model veya sorumlu ara..." : "Ekipman, model, seri no veya sorumlu ara..."} value={query} /></label>
      </Card>
      {filtered.length === 0 ? <EmptyState className="mt-6" description="Arama veya durum filtresini değiştirerek tekrar deneyin." icon={HardHat} title="Ekipman bulunamadı" /> : (
        <Card className="mt-6 overflow-hidden p-0">
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead className="border-b border-divider bg-card-muted"><tr>{(kind === "Mobil araç" ? ["Araç", "Plaka / model", "Görev bölgesi / sorumlu", "Muayene / sigorta", "Durum", "İşlemler"] : ["Ekipman", "Kimlik", "Konum / sorumlu", "Kalibrasyon", "Durum", "İşlemler"]).map((header) => <th className="px-5 py-3 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-divider">{filtered.map((item) => <EquipmentRow item={item} key={item.id} onEdit={openEdit} onRemove={remove} />)}</tbody></table></div>
          <div className="divide-y divide-divider md:hidden">{filtered.map((item) => <EquipmentMobileCard item={item} key={item.id} onEdit={openEdit} onRemove={remove} />)}</div>
        </Card>
      )}
      <EquipmentDialog equipment={editor.item} key={`${editor.item?.id ?? "new"}-${editor.open}-${kind}`} kind={editor.item?.kind ?? kind} onClose={() => setEditor({ open: false, item: null })} onSave={save} open={editor.open} team={team} />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function EquipmentRow({ item, onEdit, onRemove }: { item: Equipment; onEdit: (item: Equipment) => void; onRemove: (item: Equipment) => void }) {
  const vehicle = item.kind === "Mobil araç";
  return <tr className="transition-colors hover:bg-card-muted/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{vehicle ? <BusFront className="size-5" /> : <HardHat className="size-5" />}</span><span><strong className="block text-sm text-foreground">{item.name}</strong><span className="mt-1 block text-xs text-muted">{item.type}</span></span></div></td><td className="px-5 py-4"><p className="text-xs font-semibold text-foreground">{vehicle ? item.plateNumber || "Plaka yok" : item.brandModel || "—"}</p><p className="mt-1 text-[11px] text-subtle">{vehicle ? item.brandModel : item.serialNumber || "Seri no yok"}</p></td><td className="px-5 py-4"><p className="flex items-center gap-1 text-xs text-foreground"><MapPin className="size-3.5 text-brand" />{item.location || "—"}</p><p className="mt-1 text-[11px] text-subtle">{item.responsible || "Sorumlu atanmadı"}</p></td><td className="px-5 py-4"><p className="flex items-center gap-1 text-xs text-foreground"><CalendarClock className="size-3.5 text-subtle" />{vehicle ? item.inspectionDate || "Planlanmadı" : item.nextCalibration || "Planlanmadı"}</p><p className="mt-1 text-[11px] text-subtle">{vehicle ? `Sigorta: ${item.insuranceEnd || "—"}` : `Son bakım: ${item.lastMaintenance || "—"}`}</p></td><td className="px-5 py-4"><Badge tone={statusTone[item.status]}>{item.status}</Badge></td><td className="px-5 py-4"><div className="flex gap-1"><Button aria-label={`${item.name} düzenle`} onClick={() => onEdit(item)} size="icon-sm" variant="ghost"><Edit3 /></Button><Button aria-label={`${item.name} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger"><Trash2 /></Button></div></td></tr>;
}

function EquipmentMobileCard({ item, onEdit, onRemove }: { item: Equipment; onEdit: (item: Equipment) => void; onRemove: (item: Equipment) => void }) {
  const vehicle = item.kind === "Mobil araç";
  return <div className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{vehicle ? <BusFront className="size-5" /> : <HardHat className="size-5" />}</span><div><strong className="block text-sm text-foreground">{item.name}</strong><span className="mt-1 block text-xs text-muted">{item.type}</span></div></div><Badge tone={statusTone[item.status]}>{item.status}</Badge></div><div className="grid grid-cols-2 gap-3 text-xs"><span className="rounded-xl bg-card-muted p-3 text-muted">{vehicle ? "Plaka" : "Seri no"}<strong className="mt-1 block text-foreground">{vehicle ? item.plateNumber || "—" : item.serialNumber || "—"}</strong></span><span className="rounded-xl bg-card-muted p-3 text-muted">{vehicle ? "Muayene" : "Kalibrasyon"}<strong className="mt-1 block text-foreground">{vehicle ? item.inspectionDate || "—" : item.nextCalibration || "—"}</strong></span></div><div className="flex items-center justify-between"><span className="text-xs text-subtle">{item.location || "Konum yok"} · {item.responsible || "Sorumlu yok"}</span><div className="flex gap-1"><Button aria-label={`${item.name} düzenle`} onClick={() => onEdit(item)} size="icon-sm" variant="ghost"><Edit3 /></Button><Button aria-label={`${item.name} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger"><Trash2 /></Button></div></div></div>;
}

function EquipmentDialog({ equipment, kind, open, onClose, onSave, team }: { equipment: Equipment | null; kind: EquipmentKind; open: boolean; onClose: () => void; onSave: (values: EquipmentForm) => void; team: Array<{ id: number; name: string; active: boolean }> }) {
  const [form, setForm] = useState<EquipmentForm>(() => {
    if (!equipment) return emptyForm;
    const { id: _id, ...values } = equipment;
    return values;
  });
  const setField = (key: keyof EquipmentForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const vehicle = kind === "Mobil araç";
  const title = equipment ? `${vehicle ? "Mobil aracı" : "Ekipmanı"} düzenle` : `${vehicle ? "Yeni mobil araç" : "Yeni ekipman"} ekle`;
  return <Modal description={vehicle ? "Araç kimliği, saha görevi, muayene ve sigorta bilgilerini kaydedin." : "Cihaz kimliği, konumu ve bakım/kalibrasyon takvimini kaydedin."} eyebrow={vehicle ? "Mobil filo yönetimi" : "Cihaz envanteri"} footer={<><Button onClick={onClose} variant="ghost">Vazgeç</Button><Button disabled={!form.name.trim() || (!vehicle && !form.type.trim())} onClick={() => onSave({ ...form, kind })}><Check /> {equipment ? "Değişiklikleri kaydet" : "Envantere ekle"}</Button></>} icon={vehicle ? BusFront : HardHat} onClose={onClose} open={open} size="lg" title={title}><div className="grid gap-4 sm:grid-cols-2"><Field label={vehicle ? "Araç adı" : "Ekipman adı"} required><Input onChange={(event) => setField("name", event.target.value)} placeholder={vehicle ? "Örn. Mobil sağlık aracı 03" : "Örn. Odyometre"} value={form.name} /></Field>{vehicle ? <><Field label="Plaka"><Input onChange={(event) => setField("plateNumber", event.target.value)} placeholder="41 HNT 003" value={form.plateNumber} /></Field><Field label="Marka / model"><Input onChange={(event) => setField("brandModel", event.target.value)} value={form.brandModel} /></Field><Field label="Şasi numarası"><Input onChange={(event) => setField("serialNumber", event.target.value)} value={form.serialNumber} /></Field><Field label="Durum"><Select onChange={(event) => setField("status", event.target.value)} value={form.status}>{equipmentStatuses.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Görev bölgesi"><Input onChange={(event) => setField("location", event.target.value)} placeholder="İstanbul Anadolu yakası" value={form.location} /></Field><Field label="Araç sorumlusu"><Select onChange={(event) => setField("responsible", event.target.value)} value={form.responsible}><option value="">Sorumlu seçin</option>{team.filter((member) => member.active).map((member) => <option key={member.id}>{member.name}</option>)}</Select></Field><Field label="Muayene geçerlilik tarihi"><Input onChange={(event) => setField("inspectionDate", event.target.value)} placeholder="gg.aa.yyyy" value={form.inspectionDate} /></Field><Field label="Sigorta bitiş tarihi"><Input onChange={(event) => setField("insuranceEnd", event.target.value)} placeholder="gg.aa.yyyy" value={form.insuranceEnd} /></Field></> : <><Field label="Ekipman türü" required><Input onChange={(event) => setField("type", event.target.value)} placeholder="Örn. İşitme ölçüm cihazı" value={form.type} /></Field><Field label="Marka / model"><Input onChange={(event) => setField("brandModel", event.target.value)} value={form.brandModel} /></Field><Field label="Seri numarası"><Input onChange={(event) => setField("serialNumber", event.target.value)} value={form.serialNumber} /></Field><Field label="Durum"><Select onChange={(event) => setField("status", event.target.value)} value={form.status}>{equipmentStatuses.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Kullanım konumu"><Input onChange={(event) => setField("location", event.target.value)} placeholder="Merkez depo / Mobil araç 01" value={form.location} /></Field><Field label="Sorumlu kişi"><Select onChange={(event) => setField("responsible", event.target.value)} value={form.responsible}><option value="">Sorumlu seçin</option>{team.filter((member) => member.active).map((member) => <option key={member.id}>{member.name}</option>)}</Select></Field><Field label="Son bakım tarihi"><Input onChange={(event) => setField("lastMaintenance", event.target.value)} placeholder="gg.aa.yyyy" value={form.lastMaintenance} /></Field><Field label="Son kalibrasyon tarihi"><Input onChange={(event) => setField("calibrationDate", event.target.value)} placeholder="gg.aa.yyyy" value={form.calibrationDate} /></Field><Field label="Bir sonraki kalibrasyon"><Input onChange={(event) => setField("nextCalibration", event.target.value)} placeholder="gg.aa.yyyy" value={form.nextCalibration} /></Field></>}<Field className="sm:col-span-2" label={vehicle ? "Araç notları" : "Ekipman notları"}><Textarea onChange={(event) => setField("notes", event.target.value)} placeholder={vehicle ? "Donanım, güzergah veya bakım notları..." : "Sertifika, aksesuar veya kullanım notları..."} value={form.notes} /></Field></div></Modal>;
}
