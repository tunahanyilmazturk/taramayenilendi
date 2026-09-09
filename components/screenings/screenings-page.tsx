"use client";

import {
  CalendarDays,
  Check,
  ClipboardList,
  Edit3,
  Eye,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  UsersRound,
  BusFront,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Pagination, paginate } from "@/components/ui/pagination";
import { useCompanies, useEquipment, useScreenings, useTeam } from "@/lib/data";
import { screeningStatuses, type Screening, type ScreeningStatus } from "@/lib/demo-data";
import { useConfirm, useNotice } from "@/lib/hooks";
import { storageKeys, useStoredState } from "@/lib/storage";
import { includesQuery } from "@/lib/utils";

type ScreeningForm = Omit<Screening, "id" | "company">;
const emptyForm: ScreeningForm = {
  title: "",
  companyId: 0,
  date: "",
  time: "",
  location: "",
  team: "",
  vehicle: "",
  participants: 0,
  completed: 0,
  status: "Planlandı",
  notes: "",
};
const tone: Record<ScreeningStatus, "brand" | "warning" | "danger" | "neutral" | "info"> = {
  Planlandı: "info",
  Hazırlanıyor: "warning",
  "Devam ediyor": "brand",
  Tamamlandı: "neutral",
  İptal: "danger",
};
const statusFilters = ["Tümü", ...screeningStatuses] as const;

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useScreenings();
  const router = useRouter();
  const [companies] = useCompanies();
  const [team] = useTeam();
  const [assets] = useEquipment();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tümü");
  const [view, setView] = useStoredState<"cards" | "list">(storageKeys.screeningView, "list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editor, setEditor] = useState<{ open: boolean; item: Screening | null }>({ open: false, item: null });
  const filtered = useMemo(
    () =>
      screenings.filter(
        (item) =>
          (status === "Tümü" || item.status === status) &&
          includesQuery(`${item.title} ${item.company} ${item.location} ${item.team} ${item.vehicle}`, query),
      ),
    [screenings, query, status],
  );
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const hasFilters = Boolean(query || status !== "Tümü");
  const openNew = () => router.push("/taramalar/yeni");
  const openEdit = (item: Screening) => setEditor({ open: true, item });
  const save = (values: ScreeningForm) => {
    const company = companies.find((item) => item.id === Number(values.companyId));
    if (!company || !values.title.trim() || !values.date) return;
    const record = {
      ...values,
      companyId: company.id,
      company: company.name,
      title: values.title.trim(),
      participants: Math.max(0, Number(values.participants) || 0),
      completed: Math.min(Number(values.participants) || 0, Math.max(0, Number(values.completed) || 0)),
    };
    setScreenings((current) =>
      editor.item
        ? current.map((item) => (item.id === editor.item?.id ? { ...record, id: item.id } : item))
        : [...current, { ...record, id: Date.now() }],
    );
    setEditor({ open: false, item: null });
    showNotice(editor.item ? "Tarama güncellendi." : "Yeni tarama planlandı.");
  };
  const remove = (item: Screening) =>
    confirm({
      title: "Taramayı sil",
      description: `${item.title} planı silinecek.`,
      onConfirm: () => {
        setScreenings((current) => current.filter((entry) => entry.id !== item.id));
        setSelectedIds((current) => current.filter((id) => id !== item.id));
        showNotice("Tarama silindi.");
      },
    });
  const toggleSelected = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const togglePageSelection = () => {
    const pageIds = paged.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
    );
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    confirm({
      title: "Seçilen taramaları sil",
      description: `${count} tarama kalıcı olarak silinecek.`,
      confirmLabel: "Taramaları sil",
      onConfirm: () => {
        setScreenings((current) => current.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        showNotice(`${count} tarama silindi.`);
      },
    });
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("Tümü");
    setPage(1);
  };
  return (
    <Page>
      <PageHeader
        className="border-border bg-card shadow-card rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
        actions={
          <Button onClick={openNew}>
            <Plus /> Yeni tarama planla
          </Button>
        }
        description="Mobil sağlık taramalarınızı, katılımcıları ve saha operasyonlarının sonuçlarını tek merkezden yönetin."
        eyebrow="Saha operasyonları"
        title="Taramalar"
        visual="/headers/screenings.png"
      />
      {notice && (
        <Alert className="mt-4" icon={Check}>
          {notice}
        </Alert>
      )}
      {selectedIds.length > 0 && (
        <Card className="border-brand/30 bg-brand-soft/40 mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground text-sm font-medium">
            <strong>{selectedIds.length}</strong> tarama seçildi.
          </p>
          <Button onClick={removeSelected} size="sm" variant="danger">
            <Trash2 /> Seçilenleri sil
          </Button>
        </Card>
      )}
      <Card aria-label="Tarama filtreleri" className="mt-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-sm font-semibold">Tarama listesi</h2>
              <CountPill>{filtered.length} kayıt</CountPill>
            </div>
            <p className="text-subtle mt-1 text-xs">Arama ve durum filtreleriyle saha planlarını hızlıca daraltın.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div aria-label="Tarama görünümü" className="border-border bg-card flex rounded-xl border p-1" role="group">
              <button
                aria-label="Kart görünümü"
                aria-pressed={view === "cards"}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  view === "cards" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-foreground"
                }`}
                onClick={() => setView("cards")}
                type="button"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Kart</span>
              </button>
              <button
                aria-label="Liste görünümü"
                aria-pressed={view === "list"}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  view === "list" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-foreground"
                }`}
                onClick={() => setView("list")}
                type="button"
              >
                <ListIcon className="size-3.5" />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <SearchInput
            aria-label="Tarama ara"
            className="min-w-0 flex-1"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Firma, tarama, konum veya ekip ara..."
            value={query}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-subtle px-1 text-[10px] font-bold tracking-[0.12em] uppercase">Durum</span>
            {statusFilters.map((item) => (
              <Button
                aria-pressed={status === item}
                className={status === item ? "border-brand-outline" : undefined}
                key={item}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                size="sm"
                variant={status === item ? "soft" : "outline"}
              >
                {item}
              </Button>
            ))}
            {hasFilters && (
              <Button onClick={clearFilters} size="sm" variant="danger">
                <RotateCcw /> Temizle
              </Button>
            )}
          </div>
        </div>
      </Card>
      {paged.length === 0 ? (
        <EmptyState
          className="mt-6"
          description="Arama veya durum filtresini değiştirerek tekrar deneyin."
          icon={ClipboardList}
          title="Tarama bulunamadı"
        />
      ) : view === "cards" ? (
        <div className="mt-6 grid items-stretch gap-4 xl:grid-cols-2">
          {paged.map((item) => (
            <ScreeningCard
              item={item}
              key={item.id}
              onEdit={openEdit}
              onRemove={remove}
              onToggle={toggleSelected}
              selected={selectedIds.includes(item.id)}
            />
          ))}
        </div>
      ) : (
        <ScreeningList
          items={paged}
          onEdit={openEdit}
          onRemove={remove}
          onToggle={toggleSelected}
          onToggleAll={togglePageSelection}
          selectedIds={selectedIds}
        />
      )}
      <Pagination
        noun="tarama"
        onPage={setPage}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
      />
      <ScreeningDialog
        companies={companies}
        equipment={assets}
        item={editor.item}
        key={`${editor.item?.id ?? "new"}-${editor.open}`}
        onClose={() => setEditor({ open: false, item: null })}
        onSave={save}
        open={editor.open}
        team={team}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function ScreeningCard({
  item,
  onEdit,
  onRemove,
  onToggle,
  selected,
}: {
  item: Screening;
  onEdit: (item: Screening) => void;
  onRemove: (item: Screening) => void;
  onToggle: (id: number) => void;
  selected: boolean;
}) {
  const progress = item.participants ? Math.round((item.completed / item.participants) * 100) : 0;
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <input
            aria-label={`${item.title} seç`}
            checked={selected}
            className="accent-brand mt-1 size-4 shrink-0"
            onChange={() => onToggle(item.id)}
            type="checkbox"
          />
          <span className="bg-brand-soft text-brand flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0">
            <Link
              className="text-foreground hover:text-brand block truncate text-sm font-semibold"
              href={`/taramalar/${item.id}`}
            >
              {item.title}
            </Link>
            <p className="text-brand mt-1 text-xs font-medium">{item.company}</p>
          </div>
        </div>
        <Badge tone={tone[item.status]}>{item.status}</Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <p className="text-muted flex items-center gap-2 text-xs">
          <CalendarDays className="text-brand size-4" />
          {item.date} · {item.time}
        </p>
        <p className="text-muted flex items-center gap-2 text-xs">
          <MapPin className="text-brand size-4" />
          {item.location || "Konum belirtilmedi"}
        </p>
        <p className="text-muted flex items-center gap-2 text-xs">
          <UsersRound className="text-brand size-4" />
          {item.team || "Ekip atanmadı"}
        </p>
        <p className="text-muted flex items-center gap-2 text-xs">
          <BusFront className="text-brand size-4" />
          {item.vehicle || "Araç atanmadı"}
        </p>
      </div>
      <div className="border-divider mt-5 flex-1 border-t pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted font-medium">Katılımcı ilerlemesi</span>
          <strong className="text-foreground">
            {item.completed} / {item.participants} kişi
          </strong>
        </div>
        <div className="bg-card-muted mt-2 h-2 overflow-hidden rounded-full">
          <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-1">
        <Button asChild aria-label={`${item.title} detayını aç`} size="icon-sm" variant="ghost">
          <Link href={`/taramalar/${item.id}`}>
            <Eye />
          </Link>
        </Button>
        <Button aria-label={`${item.title} düzenle`} onClick={() => onEdit(item)} size="icon-sm" variant="ghost">
          <Edit3 />
        </Button>
        <Button aria-label={`${item.title} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger">
          <Trash2 />
        </Button>
      </div>
    </Card>
  );
}

function ScreeningList({
  items,
  onEdit,
  onRemove,
  onToggle,
  onToggleAll,
  selectedIds,
}: {
  items: Screening[];
  onEdit: (item: Screening) => void;
  onRemove: (item: Screening) => void;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  selectedIds: number[];
}) {
  return (
    <div className="border-border bg-card shadow-card mt-6 overflow-hidden rounded-2xl border">
      <div className="bg-card-muted text-muted hidden grid-cols-[minmax(220px,1.4fr)_minmax(170px,1fr)_minmax(170px,1fr)_150px_100px] gap-4 px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase lg:grid">
        <span className="flex items-center gap-3">
          <input
            aria-label="Sayfadaki taramaları seç"
            checked={items.length > 0 && items.every((item) => selectedIds.includes(item.id))}
            className="accent-brand size-4"
            onChange={onToggleAll}
            type="checkbox"
          />
          Tarama
        </span>
        <span>Planlama</span>
        <span>Saha ekibi</span>
        <span>Durum / ilerleme</span>
        <span className="text-right">İşlemler</span>
      </div>
      <div className="divide-divider divide-y">
        {items.map((item) => {
          const progress = item.participants ? Math.round((item.completed / item.participants) * 100) : 0;
          return (
            <div
              className="grid gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(220px,1.4fr)_minmax(170px,1fr)_minmax(170px,1fr)_150px_100px] lg:items-center"
              key={item.id}
            >
              <div className="flex min-w-0 items-start gap-3">
                <input
                  aria-label={`${item.title} seç`}
                  checked={selectedIds.includes(item.id)}
                  className="accent-brand mt-2 size-4 shrink-0"
                  onChange={() => onToggle(item.id)}
                  type="checkbox"
                />
                <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <ClipboardList className="size-4" />
                </span>
                <div className="min-w-0">
                  <Link
                    className="text-foreground hover:text-brand block truncate text-sm font-semibold"
                    href={`/taramalar/${item.id}`}
                  >
                    {item.title}
                  </Link>
                  <p className="text-brand mt-1 truncate text-xs font-medium">{item.company}</p>
                </div>
              </div>
              <div className="text-muted space-y-1 text-xs">
                <p className="flex items-center gap-2">
                  <CalendarDays className="text-brand size-3.5" />
                  {item.date} · {item.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="text-brand size-3.5" />
                  {item.location || "Konum belirtilmedi"}
                </p>
              </div>
              <div className="text-muted space-y-1 text-xs">
                <p className="flex items-center gap-2">
                  <UsersRound className="text-brand size-3.5" />
                  {item.team || "Ekip atanmadı"}
                </p>
                <p className="flex items-center gap-2">
                  <BusFront className="text-brand size-3.5" />
                  {item.vehicle || "Araç atanmadı"}
                </p>
              </div>
              <div className="space-y-2">
                <Badge tone={tone[item.status]}>{item.status}</Badge>
                <div>
                  <div className="text-muted flex justify-between text-[11px]">
                    <span>İlerleme</span>
                    <strong className="text-foreground">{progress}%</strong>
                  </div>
                  <div className="bg-card-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <div className="bg-brand h-full rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex justify-start gap-1 lg:justify-end">
                <Button asChild aria-label={`${item.title} detayını aç`} size="icon-sm" variant="ghost">
                  <Link href={`/taramalar/${item.id}`}>
                    <Eye />
                  </Link>
                </Button>
                <Button
                  aria-label={`${item.title} düzenle`}
                  onClick={() => onEdit(item)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Edit3 />
                </Button>
                <Button aria-label={`${item.title} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger">
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreeningDialog({
  item,
  companies,
  team,
  equipment,
  open,
  onClose,
  onSave,
}: {
  item: Screening | null;
  companies: Array<{ id: number; name: string }>;
  team: Array<{ id: number; name: string; active: boolean }>;
  equipment: Array<{ id: number; name: string; kind: string; status: string }>;
  open: boolean;
  onClose: () => void;
  onSave: (values: ScreeningForm) => void;
}) {
  const [form, setForm] = useState<ScreeningForm>(() =>
    item ? { ...item, companyId: item.companyId, company: undefined as never } : emptyForm,
  );
  const setField = (key: keyof ScreeningForm, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal
      description="Firma, saha ekibi, araç ve katılımcı planını adımın ilk aşamasında tanımlayın."
      eyebrow="Tarama planlama"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button disabled={!form.title.trim() || !form.companyId || !form.date} onClick={() => onSave(form)}>
            <Check /> {item ? "Değişiklikleri kaydet" : "Taramayı planla"}
          </Button>
        </>
      }
      icon={ClipboardList}
      onClose={onClose}
      open={open}
      size="lg"
      title={item ? "Taramayı düzenle" : "Yeni tarama planla"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Tarama başlığı" required>
          <Input
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Örn. Artemis Otomotiv yıllık taraması"
            value={form.title}
          />
        </Field>
        <Field label="Firma" required>
          <Select onChange={(event) => setField("companyId", Number(event.target.value))} value={form.companyId}>
            <option value={0}>Firma seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tarama tarihi" required>
          <Input onChange={(event) => setField("date", event.target.value)} type="date" value={form.date} />
        </Field>
        <Field label="Başlangıç saati">
          <Input onChange={(event) => setField("time", event.target.value)} type="time" value={form.time} />
        </Field>
        <Field label="Konum">
          <Input
            onChange={(event) => setField("location", event.target.value)}
            placeholder="Firma adresi veya saha noktası"
            value={form.location}
          />
        </Field>
        <Field label="Saha ekibi">
          <Select onChange={(event) => setField("team", event.target.value)} value={form.team}>
            <option value="">Ekip seçin</option>
            {team
              .filter((member) => member.active)
              .map((member) => (
                <option key={member.id}>{member.name}</option>
              ))}
          </Select>
        </Field>
        <Field label="Mobil araç">
          <Select onChange={(event) => setField("vehicle", event.target.value)} value={form.vehicle}>
            <option value="">Araç seçin</option>
            {equipment
              .filter((asset) => asset.kind === "Mobil araç" && asset.status === "Kullanımda")
              .map((asset) => (
                <option key={asset.id}>{asset.name}</option>
              ))}
          </Select>
        </Field>
        <Field label="Katılımcı sayısı">
          <Input
            min={0}
            onChange={(event) => setField("participants", Number(event.target.value))}
            type="number"
            value={form.participants || ""}
          />
        </Field>
        <Field label="Tamamlanan kişi">
          <Input
            min={0}
            onChange={(event) => setField("completed", Number(event.target.value))}
            type="number"
            value={form.completed || ""}
          />
        </Field>
        <Field label="Durum">
          <Select onChange={(event) => setField("status", event.target.value)} value={form.status}>
            {screeningStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </Field>
        <Field className="sm:col-span-2" label="Notlar">
          <Textarea
            onChange={(event) => setField("notes", event.target.value)}
            placeholder="Vardiya, hazırlık veya saha notları..."
            value={form.notes}
          />
        </Field>
      </div>
    </Modal>
  );
}
