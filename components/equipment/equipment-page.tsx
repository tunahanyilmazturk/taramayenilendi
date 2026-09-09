"use client";

import {
  BusFront,
  CalendarClock,
  Check,
  Edit3,
  HardHat,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { VisualFilterSurface } from "@/components/ui/visual-filter-surface";
import { ListViewToggle } from "@/components/ui/list-view-toggle";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination, paginate } from "@/components/ui/pagination";
import { useEquipment, useTeam } from "@/lib/data";
import { equipmentStatuses, type Equipment, type EquipmentKind, type EquipmentStatus } from "@/lib/demo-data";
import { useConfirm, useNotice } from "@/lib/hooks";
import { cn, includesQuery, nextNumericId } from "@/lib/utils";

type EquipmentForm = Omit<Equipment, "id">;
const emptyForm: EquipmentForm = {
  kind: "Ekipman",
  name: "",
  type: "",
  brandModel: "",
  serialNumber: "",
  status: "Kullanımda",
  location: "",
  responsible: "",
  calibrationDate: "",
  nextCalibration: "",
  lastMaintenance: "",
  notes: "",
  plateNumber: "",
  inspectionDate: "",
  insuranceEnd: "",
};
const statusTone: Record<EquipmentStatus, "brand" | "warning" | "danger" | "neutral"> = {
  Kullanımda: "brand",
  Bakımda: "warning",
  "Kalibrasyon bekliyor": "warning",
  Pasif: "danger",
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useEquipment();
  const [team] = useTeam();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tümü");
  const [locationFilter, setLocationFilter] = useState("Tümü");
  const [responsibleFilter, setResponsibleFilter] = useState("Tümü");
  const [kind, setKind] = useState<EquipmentKind>("Ekipman");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; item: Equipment | null }>({ open: false, item: null });

  const filtered = useMemo(
    () =>
      equipment.filter(
        (item) =>
          item.kind === kind &&
          (status === "Tümü" || item.status === status) &&
          (locationFilter === "Tümü" || item.location === locationFilter) &&
          (responsibleFilter === "Tümü" || item.responsible === responsibleFilter) &&
          includesQuery(
            `${item.name} ${item.type} ${item.brandModel} ${item.serialNumber} ${item.plateNumber ?? ""} ${item.location} ${item.responsible}`,
            query,
          ),
      ),
    [equipment, locationFilter, query, responsibleFilter, status, kind],
  );
  const locationOptions = useMemo(() => ["Tümü", ...Array.from(new Set(equipment.filter((item) => item.kind === kind).map((item) => item.location).filter(Boolean)))], [equipment, kind]);
  const responsibleOptions = useMemo(() => ["Tümü", ...Array.from(new Set(equipment.filter((item) => item.kind === kind).map((item) => item.responsible).filter(Boolean)))], [equipment, kind]);
  const clearFilters = () => {
    setQuery("");
    setStatus("Tümü");
    setLocationFilter("Tümü");
    setResponsibleFilter("Tümü");
    setCurrentPage(1);
  };
  const { safePage, items: pageItems } = paginate(filtered, currentPage, pageSize);
  const toggleSelected = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const togglePageSelection = () => {
    const pageIds = pageItems.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])));
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    confirm({ title: "Seçilen kayıtları sil", description: `${count} ${kind.toLocaleLowerCase("tr-TR")} kaydı kalıcı olarak silinecek.`, confirmLabel: "Kayıtları sil", onConfirm: () => { setEquipment((current) => current.filter((item) => !selectedIds.includes(item.id))); setSelectedIds([]); showNotice(`${count} kayıt envanterden kaldırıldı.`); } });
  };

  const openNew = () => setEditor({ open: true, item: null });
  const openEdit = (item: Equipment) => setEditor({ open: true, item });
  const save = (values: EquipmentForm) => {
    const normalized = {
      ...values,
      kind,
      type: kind === "Mobil araç" ? values.type.trim() || "Mobil araç" : values.type.trim(),
      name: values.name.trim(),
      serialNumber: values.serialNumber.trim(),
    };
    if (!normalized.name || !normalized.type) return;
    setEquipment((current) =>
      editor.item
        ? current.map((item) => (item.id === editor.item?.id ? { ...normalized, id: item.id } : item))
        : [...current, { ...normalized, id: nextNumericId(current) }],
    );
    setEditor({ open: false, item: null });
    showNotice(
      editor.item ? "Kayıt güncellendi." : `${kind === "Mobil araç" ? "Mobil araç" : "Ekipman"} envantere eklendi.`,
    );
  };
  const remove = (item: Equipment) =>
    confirm({
      title: `${item.kind} kaydını sil`,
      description: `${item.name} envanterden kaldırılacak.`,
      onConfirm: () => {
        setEquipment((current) => current.filter((entry) => entry.id !== item.id));
        setSelectedIds((current) => current.filter((id) => id !== item.id));
        showNotice("Kayıt envanterden kaldırıldı.");
      },
    });

  return (
    <Page>
      <VisualFilterSurface visual="/headers/equipment.png">
      <PageHeader
        className="border-0 bg-transparent p-0 shadow-none before:hidden"
        actions={
          <Button onClick={openNew}>
            <Plus /> {kind === "Mobil araç" ? "Mobil araç ekle" : "Ekipman ekle"}
          </Button>
        }
        description="Tarama ve muayene süreçlerinde kullandığınız araç ve cihazları tek merkezden yönetin."
        eyebrow="Operasyon kaynakları"
        title="Araç ve ekipmanlar"
        dark
      />
      {notice && (
        <Alert className="mt-4" icon={Check}>
          {notice}
        </Alert>
      )}
      {selectedIds.length > 0 && <Card className="border-brand/30 bg-brand-soft/40 mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-foreground text-sm font-medium"><strong>{selectedIds.length}</strong> kayıt seçildi.</p><Button onClick={removeSelected} size="sm" variant="danger"><Trash2 /> Seçilenleri sil</Button></Card>}
      <div className="border-sidebar-border/80 bg-sidebar/55 mt-5 flex w-full max-w-md gap-1 rounded-xl border p-1.5 shadow-inner" role="tablist" aria-label="Varlık türü">
        {(["Ekipman", "Mobil araç"] as EquipmentKind[]).map((item) => (
          <button
            aria-selected={kind === item}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all sm:flex-none sm:px-5 ${kind === item ? "bg-sidebar-accent text-sidebar shadow-sm" : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-strong"}`}
            key={item}
            onClick={() => {
              setKind(item);
              setStatus("Tümü");
              setLocationFilter("Tümü");
              setResponsibleFilter("Tümü");
              setQuery("");
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            role="tab"
            type="button"
          >
            {item === "Ekipman" ? <HardHat className="size-4" /> : <BusFront className="size-4" />}
            {item}
            {kind === item && <span className="bg-sidebar absolute right-3 bottom-1 left-3 h-0.5 rounded-full opacity-70" />}
          </button>
        ))}
      </div>
      <ListToolbar advancedOpen={advancedOpen} count={filtered.length} description={kind === "Mobil araç" ? "Araç, plaka, görev bölgesi veya sorumlu kişiyle arayın." : "Cihaz adı, seri numarası, konum veya sorumlu kişiyle arayın."} onAdvanced={() => setAdvancedOpen((value) => !value)} onCards={() => setView("cards")} onList={() => setView("table")} onQuery={(value) => { setQuery(value); setCurrentPage(1); }} placeholder={kind === "Mobil araç" ? "Araç, plaka, model veya sorumlu ara..." : "Ekipman, model, seri no veya sorumlu ara..."} query={query} title={`${kind} envanteri`} view={view}>
        <Select aria-label={`${kind} durumu`} onChange={(event) => { setStatus(event.target.value); setCurrentPage(1); }} value={status}><option>Tümü</option>{equipmentStatuses.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label={`${kind} konum filtresi`} onChange={(event) => { setLocationFilter(event.target.value); setCurrentPage(1); }} value={locationFilter}><option>Tümü</option>{locationOptions.filter((item) => item !== "Tümü").map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label={`${kind} sorumlu filtresi`} onChange={(event) => { setResponsibleFilter(event.target.value); setCurrentPage(1); }} value={responsibleFilter}><option>Tümü</option>{responsibleOptions.filter((item) => item !== "Tümü").map((item) => <option key={item}>{item}</option>)}</Select>
        {(query || status !== "Tümü" || locationFilter !== "Tümü" || responsibleFilter !== "Tümü") && <Button onClick={clearFilters} size="sm" variant="danger"><RotateCcw /> Filtreleri temizle</Button>}
      </ListToolbar>
      {/*
      <Card aria-label="Ekipman filtreleri" className="mt-4 rounded-xl border border-sidebar-border/70 bg-sidebar/35 p-3 shadow-none sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-sm font-semibold">{kind} envanteri</h2>
              <CountPill>{filtered.length} kayıt</CountPill>
            </div>
            <p className="text-subtle mt-1 text-xs">
              {kind === "Mobil araç"
                ? "Plaka, model, görev bölgesi veya sorumlu kişiyle arayın."
                : "Cihaz adı, seri numarası, konum veya sorumlu kişiyle arayın."}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <Select
              aria-label={`${kind} durumu`}
              className="h-10 min-w-0 flex-1 text-xs lg:w-52 lg:flex-none"
              onChange={(event) => {
                setStatus(event.target.value);
                setCurrentPage(1);
              }}
              value={status}
            >
              <option>Tümü</option>
              {equipmentStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            {(query || status !== "Tümü") && (
              <Button aria-label="Filtreleri temizle" onClick={clearFilters} size="icon-sm" variant="outline">
                <RotateCcw />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            aria-label={`${kind} ara`}
            className="h-11 pl-10"
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              kind === "Mobil araç"
                ? "Araç, plaka, model veya sorumlu ara..."
                : "Ekipman, model, seri no veya sorumlu ara..."
            }
            value={query}
          />
        </label>
        <ListViewToggle onCards={() => setView("cards")} onList={() => setView("table")} value={view} />
        </div>
      </Card> */}
      </VisualFilterSurface>
      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          description={query || status !== "Tümü" ? "Arama veya durum filtresini değiştirerek tekrar deneyin." : `${kind} kaydı eklemek için yukarıdaki butonu kullanın.`}
          icon={HardHat}
          title={`${kind} bulunamadı`}
        />
      ) : (
        view === "cards" ? <div className="mt-6 grid gap-4 xl:grid-cols-2">{pageItems.map((item) => <Card key={item.id}><EquipmentMobileCard item={item} onEdit={openEdit} onRemove={remove} onToggle={() => toggleSelected(item.id)} selected={selectedIds.includes(item.id)} /></Card>)}</div> : <Card className="mt-6 overflow-hidden p-0">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="border-divider bg-card-muted border-b">
                <tr>
                  <th className="px-5 py-3"><input aria-label={`Sayfadaki ${kind.toLocaleLowerCase("tr-TR")} kayıtlarını seç`} checked={pageItems.length > 0 && pageItems.every((item) => selectedIds.includes(item.id))} className="size-4 accent-brand" onChange={togglePageSelection} type="checkbox" /></th>
                  {(kind === "Mobil araç"
                    ? ["Araç", "Plaka / model", "Görev bölgesi / sorumlu", "Muayene / sigorta", "Durum", "İşlemler"]
                    : ["Ekipman", "Kimlik", "Konum / sorumlu", "Kalibrasyon", "Durum", "İşlemler"]
                  ).map((header) => (
                    <th
                      className="text-subtle px-5 py-3 text-[10px] font-bold tracking-[0.12em] uppercase"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {pageItems.map((item) => (
                  <EquipmentRow item={item} key={item.id} onEdit={openEdit} onRemove={remove} onToggle={() => toggleSelected(item.id)} selected={selectedIds.includes(item.id)} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-divider divide-y md:hidden">
            {pageItems.map((item) => (
              <EquipmentMobileCard item={item} key={item.id} onEdit={openEdit} onRemove={remove} onToggle={() => toggleSelected(item.id)} selected={selectedIds.includes(item.id)} />
            ))}
          </div>
        </Card>
      )}
      <Pagination
        noun={kind === "Mobil araç" ? "mobil araç" : "ekipman"}
        onPage={setCurrentPage}
        onPageSize={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
      />
      <EquipmentDialog
        equipment={editor.item}
        key={`${editor.item?.id ?? "new"}-${editor.open}-${kind}`}
        kind={editor.item?.kind ?? kind}
        onClose={() => setEditor({ open: false, item: null })}
        onSave={save}
        open={editor.open}
        team={team}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function EquipmentRow({
  item,
  onEdit,
  onRemove,
  onToggle,
  selected,
}: {
  item: Equipment;
  onEdit: (item: Equipment) => void;
  onRemove: (item: Equipment) => void;
  onToggle: () => void;
  selected: boolean;
}) {
  const vehicle = item.kind === "Mobil araç";
  return (
    <tr className="hover:bg-card-muted/60 transition-colors">
      <td className="px-5 py-4"><input aria-label={`${item.name} seç`} checked={selected} className="size-4 accent-brand" onChange={onToggle} type="checkbox" /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-xl">
            {vehicle ? <BusFront className="size-5" /> : <HardHat className="size-5" />}
          </span>
          <span>
            <strong className="text-foreground block text-sm">{item.name}</strong>
            <span className="text-muted mt-1 block text-xs">{item.type}</span>
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-foreground text-xs font-semibold">
          {vehicle ? item.plateNumber || "Plaka yok" : item.brandModel || "—"}
        </p>
        <p className="text-subtle mt-1 text-[11px]">{vehicle ? item.brandModel : item.serialNumber || "Seri no yok"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-foreground flex items-center gap-1 text-xs">
          <MapPin className="text-brand size-3.5" />
          {item.location || "—"}
        </p>
        <p className="text-subtle mt-1 text-[11px]">{item.responsible || "Sorumlu atanmadı"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-foreground flex items-center gap-1 text-xs">
          <CalendarClock className="text-subtle size-3.5" />
          {vehicle ? item.inspectionDate || "Planlanmadı" : item.nextCalibration || "Planlanmadı"}
        </p>
        <p className="text-subtle mt-1 text-[11px]">
          {vehicle ? `Sigorta: ${item.insuranceEnd || "—"}` : `Son bakım: ${item.lastMaintenance || "—"}`}
        </p>
      </td>
      <td className="px-5 py-4">
        <Badge tone={statusTone[item.status]}>{item.status}</Badge>
      </td>
      <td className="px-5 py-4">
        <div className="flex gap-1">
          <Button aria-label={`${item.name} düzenle`} onClick={() => onEdit(item)} size="icon-sm" variant="ghost">
            <Edit3 />
          </Button>
          <Button aria-label={`${item.name} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function EquipmentMobileCard({
  item,
  onEdit,
  onRemove,
  onToggle,
  selected,
}: {
  item: Equipment;
  onEdit: (item: Equipment) => void;
  onRemove: (item: Equipment) => void;
  onToggle: () => void;
  selected: boolean;
}) {
  const vehicle = item.kind === "Mobil araç";
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <input aria-label={`${item.name} seç`} checked={selected} className="mt-1 size-4 accent-brand" onChange={onToggle} type="checkbox" />
          <span className="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-xl">
            {vehicle ? <BusFront className="size-5" /> : <HardHat className="size-5" />}
          </span>
          <div>
            <strong className="text-foreground block text-sm">{item.name}</strong>
            <span className="text-muted mt-1 block text-xs">{item.type}</span>
          </div>
        </div>
        <Badge tone={statusTone[item.status]}>{item.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <span className="bg-card-muted text-muted rounded-xl p-3">
          {vehicle ? "Plaka" : "Seri no"}
          <strong className="text-foreground mt-1 block">
            {vehicle ? item.plateNumber || "—" : item.serialNumber || "—"}
          </strong>
        </span>
        <span className="bg-card-muted text-muted rounded-xl p-3">
          {vehicle ? "Muayene" : "Kalibrasyon"}
          <strong className="text-foreground mt-1 block">
            {vehicle ? item.inspectionDate || "—" : item.nextCalibration || "—"}
          </strong>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-subtle text-xs">
          {item.location || "Konum yok"} · {item.responsible || "Sorumlu yok"}
        </span>
        <div className="flex gap-1">
          <Button aria-label={`${item.name} düzenle`} onClick={() => onEdit(item)} size="icon-sm" variant="ghost">
            <Edit3 />
          </Button>
          <Button aria-label={`${item.name} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EquipmentDialog({
  equipment,
  kind,
  open,
  onClose,
  onSave,
  team,
}: {
  equipment: Equipment | null;
  kind: EquipmentKind;
  open: boolean;
  onClose: () => void;
  onSave: (values: EquipmentForm) => void;
  team: Array<{ id: number; name: string; active: boolean }>;
}) {
  const [form, setForm] = useState<EquipmentForm>(() => {
    if (!equipment) return emptyForm;
    const { id: _id, ...values } = equipment;
    return values;
  });
  const setField = (key: keyof EquipmentForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const vehicle = kind === "Mobil araç";
  const title = equipment
    ? `${vehicle ? "Mobil aracı" : "Ekipmanı"} düzenle`
    : `${vehicle ? "Yeni mobil araç" : "Yeni ekipman"} ekle`;
  return (
    <Modal
      description={
        vehicle
          ? "Araç kimliği, saha görevi, muayene ve sigorta bilgilerini kaydedin."
          : "Cihaz kimliği, konumu ve bakım/kalibrasyon takvimini kaydedin."
      }
      eyebrow={vehicle ? "Mobil filo yönetimi" : "Cihaz envanteri"}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button
            disabled={!form.name.trim() || (!vehicle && !form.type.trim())}
            onClick={() => onSave({ ...form, kind })}
          >
            <Check /> {equipment ? "Değişiklikleri kaydet" : "Envantere ekle"}
          </Button>
        </>
      }
      icon={vehicle ? BusFront : HardHat}
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={vehicle ? "Araç adı" : "Ekipman adı"} required>
          <Input
            onChange={(event) => setField("name", event.target.value)}
            placeholder={vehicle ? "Örn. Mobil sağlık aracı 03" : "Örn. Odyometre"}
            value={form.name}
          />
        </Field>
        {vehicle ? (
          <>
            <Field label="Plaka">
              <Input
                onChange={(event) => setField("plateNumber", event.target.value)}
                placeholder="41 HNT 003"
                value={form.plateNumber}
              />
            </Field>
            <Field label="Marka / model">
              <Input onChange={(event) => setField("brandModel", event.target.value)} value={form.brandModel} />
            </Field>
            <Field label="Şasi numarası">
              <Input onChange={(event) => setField("serialNumber", event.target.value)} value={form.serialNumber} />
            </Field>
            <Field label="Durum">
              <Select onChange={(event) => setField("status", event.target.value)} value={form.status}>
                {equipmentStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Görev bölgesi">
              <Input
                onChange={(event) => setField("location", event.target.value)}
                placeholder="İstanbul Anadolu yakası"
                value={form.location}
              />
            </Field>
            <Field label="Araç sorumlusu">
              <Select onChange={(event) => setField("responsible", event.target.value)} value={form.responsible}>
                <option value="">Sorumlu seçin</option>
                {team
                  .filter((member) => member.active)
                  .map((member) => (
                    <option key={member.id}>{member.name}</option>
                  ))}
              </Select>
            </Field>
            <Field label="Muayene geçerlilik tarihi">
              <Input
                onChange={(event) => setField("inspectionDate", event.target.value)}
                placeholder="gg.aa.yyyy"
                value={form.inspectionDate}
              />
            </Field>
            <Field label="Sigorta bitiş tarihi">
              <Input
                onChange={(event) => setField("insuranceEnd", event.target.value)}
                placeholder="gg.aa.yyyy"
                value={form.insuranceEnd}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Ekipman türü" required>
              <Input
                onChange={(event) => setField("type", event.target.value)}
                placeholder="Örn. İşitme ölçüm cihazı"
                value={form.type}
              />
            </Field>
            <Field label="Marka / model">
              <Input onChange={(event) => setField("brandModel", event.target.value)} value={form.brandModel} />
            </Field>
            <Field label="Seri numarası">
              <Input onChange={(event) => setField("serialNumber", event.target.value)} value={form.serialNumber} />
            </Field>
            <Field label="Durum">
              <Select onChange={(event) => setField("status", event.target.value)} value={form.status}>
                {equipmentStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Kullanım konumu">
              <Input
                onChange={(event) => setField("location", event.target.value)}
                placeholder="Merkez depo / Mobil araç 01"
                value={form.location}
              />
            </Field>
            <Field label="Sorumlu kişi">
              <Select onChange={(event) => setField("responsible", event.target.value)} value={form.responsible}>
                <option value="">Sorumlu seçin</option>
                {team
                  .filter((member) => member.active)
                  .map((member) => (
                    <option key={member.id}>{member.name}</option>
                  ))}
              </Select>
            </Field>
            <Field label="Son bakım tarihi">
              <Input
                onChange={(event) => setField("lastMaintenance", event.target.value)}
                placeholder="gg.aa.yyyy"
                value={form.lastMaintenance}
              />
            </Field>
            <Field label="Son kalibrasyon tarihi">
              <Input
                onChange={(event) => setField("calibrationDate", event.target.value)}
                placeholder="gg.aa.yyyy"
                value={form.calibrationDate}
              />
            </Field>
            <Field label="Bir sonraki kalibrasyon">
              <Input
                onChange={(event) => setField("nextCalibration", event.target.value)}
                placeholder="gg.aa.yyyy"
                value={form.nextCalibration}
              />
            </Field>
          </>
        )}
        <Field className="sm:col-span-2" label={vehicle ? "Araç notları" : "Ekipman notları"}>
          <Textarea
            onChange={(event) => setField("notes", event.target.value)}
            placeholder={
              vehicle ? "Donanım, güzergah veya bakım notları..." : "Sertifika, aksesuar veya kullanım notları..."
            }
            value={form.notes}
          />
        </Field>
      </div>
    </Modal>
  );
}
