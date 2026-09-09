"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Repeat2,
  ReceiptText,
  Pencil,
  ShieldCheck,
  StickyNote,
  Upload,
  Download,
  Trash2,
  UsersRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { applyCompanyForm, CompanyForm, type CompanyFormValues } from "@/components/companies/company-form";
import { Badge, contractTone, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, ConfirmDialog } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { Pagination, paginate } from "@/components/ui/pagination";
import { useCompanies, useOffers, usePersonnel, useScreenings, useSectors } from "@/lib/data";
import { companyLocation, type Company, type CompanyDocument, type Offer, type Screening } from "@/lib/demo-data";
import { isoToLabel, labelToIso, money } from "@/lib/format";
import { useConfirm, useNotice } from "@/lib/hooks";
import type { Personnel } from "@/lib/personnel";
import { useHydrated } from "@/lib/storage";
import { cn, initials } from "@/lib/utils";

const tabs = [
  ["genel", "Genel bakış"],
  ["personeller", "Personeller"],
  ["taramalar", "Taramalar"],
  ["teklifler", "Teklifler"],
  ["sozlesme", "Sözleşme ve belgeler"],
  ["notlar", "Notlar"],
] as const;
type TabId = (typeof tabs)[number][0];

const recentActivity = [
  ["02 Eyl 2026", "Mobil sağlık taraması başladı", "Ekip 04 · 84 çalışan"],
  ["28 Ağu 2026", "Tarama sonuçları tamamlandı", "246 sonuç · Rapor hazır"],
  ["15 Ağu 2026", "Sözleşme belgesi güncellendi", "Yönetici tarafından"],
];

export default function CompanyDetailPage({ companyId }: { companyId: string }) {
  const hydrated = useHydrated();
  const [companies, setCompanies] = useCompanies();
  const [personnel, setPersonnel] = usePersonnel();
  const [screenings, setScreenings] = useScreenings();
  const [offers, setOffers] = useOffers();
  const [sectors] = useSectors();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<TabId>("genel");
  const [editing, setEditing] = useState(false);
  const company = companies.find((item) => item.id === Number(companyId));
  const companyPersonnel = personnel.filter((item) => item.companyId === Number(companyId));
  const companyScreenings = screenings
    .filter((item) => item.companyId === Number(companyId))
    .sort((a, b) => labelToIso(b.date).localeCompare(labelToIso(a.date)));

  if (!hydrated) return <DetailSkeleton />;
  if (!company) {
    return (
      <Page>
        <BackLink />
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/firmalar">
                <ArrowLeft /> Firma listesine dön
              </Link>
            </Button>
          }
          className="mt-6"
          description="Aradığınız firma silinmiş veya bağlantı hatalı olabilir."
          icon={Building2}
          title="Firma bulunamadı"
        />
      </Page>
    );
  }

  const saveCompany = (values: CompanyFormValues) => {
    setCompanies(applyCompanyForm(companies, values, company.id));
    setEditing(false);
    showNotice("Firma bilgileri güncellendi.");
  };
  const saveNotes = (notes: string) => {
    setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, notes } : item));
    showNotice("Firma notları kaydedildi.");
  };
  const addDocument = (document: CompanyDocument) => {
    setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, contractDocuments: [...(item.contractDocuments ?? []), document] } : item));
    showNotice("Sözleşme belgesi eklendi.");
  };
  const removeDocument = (document: CompanyDocument) => {
    confirm({
      title: "Belgeyi sil",
      description: `${document.name} belgesi kalıcı olarak silinecek.`,
      confirmLabel: "Belgeyi sil",
      onConfirm: () => {
        setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, contractDocuments: (item.contractDocuments ?? []).filter((entry) => entry.id !== document.id) } : item));
        showNotice("Sözleşme belgesi silindi.");
      },
    });
  };
  const removePersonnel = (item: Personnel) => confirm({ title: "Personeli sil", description: `${item.name} personel kaydı kalıcı olarak silinecek.`, confirmLabel: "Personeli sil", onConfirm: () => { setPersonnel((current) => current.filter((entry) => entry.id !== item.id)); showNotice("Personel kaydı silindi."); } });
  const cancelScreening = (item: Screening) => confirm({ title: "Taramayı iptal et", description: `${item.title} planı iptal edilecek.`, confirmLabel: "Taramayı iptal et", onConfirm: () => { setScreenings((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "İptal" } : entry)); showNotice("Tarama iptal edildi."); } });
  const removeScreening = (item: Screening) => confirm({ title: "Taramayı sil", description: `${item.title} kaydı kalıcı olarak silinecek.`, confirmLabel: "Taramayı sil", onConfirm: () => { setScreenings((current) => current.filter((entry) => entry.id !== item.id)); showNotice("Tarama silindi."); } });
  const removeOffer = (item: Offer) => confirm({ title: "Teklifi sil", description: `${item.title || item.number || "Teklif"} kaydı kalıcı olarak silinecek.`, confirmLabel: "Teklifi sil", onConfirm: () => { setOffers((current) => current.filter((entry) => entry.id !== item.id)); showNotice("Teklif silindi."); } });

  return (
    <Page>
      <BackLink />
      {notice && <Alert className="mt-4 w-fit">{notice}</Alert>}
      <Card className="mt-6 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" text={initials(company.name)} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-heading">{company.name}</h1>
                <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                <Building2 className="size-4" /> {company.sector || "—"}
                <span className="mx-1">·</span>
                <MapPin className="size-4" /> {companyLocation(company) || "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)} size="sm" variant="secondary">
              <Edit3 /> Firma bilgilerini düzenle
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/personeller">
                <UsersRound /> Personeller
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/taramalar/yeni">
                <CalendarDays /> Yeni tarama
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={UsersRound} label="Çalışan sayısı" value={company.employees} />
          <StatTile icon={ClipboardList} label="Toplam tarama" value={company.screenings} />
          <StatTile icon={FileText} label="Sözleşme bitişi" value={company.contractEnd || "—"} />
          <StatTile icon={ShieldCheck} label="Firma yetkilisi" value={company.contact || "—"} />
        </div>
      </Card>

      <nav aria-label="Firma detay sekmeleri" className="mt-6 flex gap-5 overflow-x-auto border-b border-border">
        {tabs.map(([id, label]) => (
          <button
            aria-selected={activeTab === id}
            className={cn(
              "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
              activeTab === id ? "border-brand text-brand-soft-fg" : "border-transparent text-muted hover:text-foreground",
            )}
            key={id}
            onClick={() => setActiveTab(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === "genel" && <Overview company={company} />}
        {activeTab === "personeller" && <CompanyPersonnel company={company} personnel={companyPersonnel} onRemove={removePersonnel} />}
        {activeTab === "taramalar" && <CompanyScreenings company={company} screenings={companyScreenings} onCancel={cancelScreening} onRemove={removeScreening} />}
        {activeTab === "teklifler" && <CompanyOffers company={company} offers={offers.filter((offer) => offer.companyId === company.id || offer.company === company.name)} onRemove={removeOffer} />}
        {activeTab === "sozlesme" && <ContractPanel company={company} onAddDocument={addDocument} onEdit={() => setEditing(true)} onRemoveDocument={removeDocument} />}
        {activeTab === "notlar" && (
          <CompanyNotes company={company} onSave={saveNotes} />
        )}
      </div>

      <CompanyForm
        company={company}
        onClose={() => setEditing(false)}
        onSave={saveCompany}
        open={editing}
        sectors={sectors}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function BackLink() {
  return (
    <Link className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand" href="/firmalar">
      <ArrowLeft className="size-4" /> Firmalara dön
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <Page className="animate-pulse">
      <div className="h-4 w-28 rounded bg-card-muted" />
      <Card className="mt-6 p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-card-muted" />
          <div className="space-y-3">
            <div className="h-6 w-56 rounded bg-card-muted" />
            <div className="h-4 w-40 rounded bg-card-muted" />
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-20 rounded-xl bg-card-muted" key={index} />
          ))}
        </div>
      </Card>
      <div className="mt-6 h-10 rounded bg-card-muted" />
      <div className="mt-6 h-48 rounded-2xl bg-card-muted" />
    </Page>
  );
}

function Overview({ company }: { company: Company }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <Card className="p-5 sm:p-6">
        <CardHeader description="Firma ile ilgili son hareketler" title="Son operasyonlar" />
        <div className="mt-5 divide-y divide-divider">
          {recentActivity.map(([date, title, detail]) => (
            <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0" key={title}>
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted">{detail}</p>
              </div>
              <time className="ml-auto shrink-0 text-[10px] text-subtle">{date}</time>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardHeader title="İletişim" />
        <div className="mt-5 space-y-4 text-sm">
          <ContactLine icon={UsersRound} value={company.contact} />
          <ContactLine icon={Phone} value={company.phone} />
          <ContactLine icon={Mail} value={company.email} />
          <ContactLine icon={MapPin} value={companyLocation(company)} />
        </div>
      </Card>
    </div>
  );
}

function CompanyPersonnel({ company, personnel, onRemove }: { company: Company; personnel: Personnel[]; onRemove: (item: Personnel) => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { safePage, items: paged } = paginate(personnel, page, pageSize);
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        action={
          <>
            <CountPill>{personnel.length} kayıt</CountPill>
            <Button asChild size="sm">
              <Link href="/personeller">
                <UsersRound /> Personelleri yönet
              </Link>
            </Button>
          </>
        }
        description={`${company.name} firmasına bağlı personel kayıtları ve temel görev bilgileri.`}
        icon={UsersRound}
        title="Firma personelleri"
      />
      {personnel.length === 0 ? (
        <EmptyState
          action={
            <Button asChild size="sm">
              <Link href="/personeller">
                <Plus /> Personel ekle
              </Link>
            </Button>
          }
          className="mt-6"
          compact
          description="Bu firmaya henüz personel bağlanmamış. Personeller sayfasından firma seçerek kayıt ekleyebilirsiniz."
          icon={UsersRound}
          title="Personel kaydı bulunmuyor"
        />
      ) : (
        <div className="mt-5 divide-y divide-divider">
          {paged.map((item) => (
            <CompanyPersonnelRow item={item} onRemove={onRemove} key={item.id} />
          ))}
        </div>
      )}
      {personnel.length > 0 && <Pagination noun="personel" onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} page={safePage} pageSize={pageSize} total={personnel.length} />}
    </Card>
  );
}

function CompanyPersonnelRow({ item, onRemove }: { item: Personnel; onRemove: (item: Personnel) => void }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="sm" text={initials(item.name)} />
        <div className="min-w-0">
          <Link className="truncate text-sm font-semibold text-foreground hover:text-brand" href={`/personeller/${item.id}`}>{item.name}</Link>
          <p className="mt-1 truncate text-xs text-muted">
            {item.title || "Görev belirtilmedi"}
            {item.department ? ` · ${item.department}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted sm:justify-end">
        <span>{item.employeeNo || "Sicil no yok"}</span>
        <span>{item.nationalId || "Kimlik no yok"}</span>
        <span>{item.startDate ? `İşe giriş: ${isoToLabel(item.startDate)}` : "İşe giriş tarihi yok"}</span>
        <Badge tone={item.status === "Aktif" ? "brand" : item.status === "İzinli" ? "warning" : "danger"}>{item.status}</Badge>
        <div className="flex items-center gap-1">
          <Button asChild aria-label={`${item.name} düzenle`} size="icon-sm" variant="ghost"><Link href={`/personeller?duzenle=${item.id}`}><Pencil /></Link></Button>
          <Button aria-label={`${item.name} sil`} onClick={() => onRemove(item)} size="icon-sm" variant="danger"><Trash2 /></Button>
        </div>
      </div>
    </div>
  );
}

function CompanyScreenings({ company, screenings, onCancel, onRemove }: { company: Company; screenings: Screening[]; onCancel: (item: Screening) => void; onRemove: (item: Screening) => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { safePage, items: paged } = paginate(screenings, page, pageSize);
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        action={
          <>
            <CountPill>{screenings.length} tarama</CountPill>
            <Button asChild size="sm">
              <Link href={`/taramalar/yeni?firma=${company.id}`}>
                <Plus /> Yeni tarama
              </Link>
            </Button>
          </>
        }
        description={`${company.name} firmasına ait planlanan ve tamamlanan tarama kayıtları.`}
        icon={ClipboardList}
        title="Tarama geçmişi"
      />
      {screenings.length === 0 ? (
        <EmptyState
          action={
            <Button asChild size="sm">
              <Link href={`/taramalar/yeni?firma=${company.id}`}>
                <Plus /> Tarama planla
              </Link>
            </Button>
          }
          className="mt-6"
          compact
          description="Bu firmaya henüz bağlı bir tarama kaydı bulunmuyor."
          icon={ClipboardList}
          title="Tarama kaydı bulunmuyor"
        />
      ) : (
        <div className="mt-5 divide-y divide-divider">
          {paged.map((screening) => (
            <div className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={screening.id}>
              <Link className="min-w-0 flex-1" href={`/taramalar/${screening.id}`}>
                <p className="truncate text-sm font-semibold text-foreground">{screening.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span><CalendarDays className="mr-1 inline size-3.5" />{screening.date}{screening.time ? ` · ${screening.time}` : ""}</span>
                  <span><UsersRound className="mr-1 inline size-3.5" />{screening.completed}/{screening.participants} tamamlandı</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle"><MapPin className="size-3" />{screening.location || "Konum belirtilmedi"}</p>
              </Link>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Badge tone={screening.status === "İptal" ? "danger" : screening.status === "Tamamlandı" ? "brand" : screening.status === "Hazırlanıyor" ? "warning" : "info"}>{screening.status}</Badge>
                {screening.status !== "İptal" && screening.status !== "Tamamlandı" && <Button aria-label={`${screening.title} iptal et`} onClick={() => onCancel(screening)} size="icon-sm" variant="ghost"><XCircle /></Button>}
                <Button asChild aria-label={`${screening.title} düzenle`} size="icon-sm" variant="ghost"><Link href={`/taramalar/yeni?edit=${screening.id}`}><Pencil /></Link></Button>
                <Button asChild aria-label={`${screening.title} taramasını tekrarla`} size="sm" variant="outline">
                  <Link href={`/taramalar/yeni?tekrarla=${screening.id}`}>
                    <Repeat2 /> <span className="hidden sm:inline">Tekrarla</span>
                  </Link>
                </Button>
                <Button aria-label={`${screening.title} sil`} onClick={() => onRemove(screening)} size="icon-sm" variant="danger"><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {screenings.length > 0 && <Pagination noun="tarama" onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} page={safePage} pageSize={pageSize} total={screenings.length} />}
    </Card>
  );
}

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <p className="flex items-center gap-2 text-muted">
      <Icon className="size-4 shrink-0 text-brand" />
      <span className={cn("truncate", !value && "text-subtle")}>{value || "Belirtilmedi"}</span>
    </p>
  );
}

function daysUntil(label: string) {
  const iso = labelToIso(label);
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function ContractPanel({ company, onAddDocument, onEdit, onRemoveDocument }: { company: Company; onAddDocument: (document: CompanyDocument) => void; onEdit: () => void; onRemoveDocument: (document: CompanyDocument) => void }) {
  const remaining = daysUntil(company.contractEnd);
  const remainingLabel =
    remaining === null
      ? "—"
      : remaining < 0
        ? `${Math.abs(remaining)} gün önce sona erdi`
        : remaining === 0
          ? "Bugün sona eriyor"
          : `${remaining} gün kaldı`;
  const remainingTone = remaining === null ? "neutral" : remaining < 0 ? "danger" : remaining <= 30 ? "warning" : "brand";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card className="p-5 sm:p-6">
        <CardHeader
          action={
            <Button onClick={onEdit} size="sm" variant="secondary">
              <Edit3 /> Düzenle
            </Button>
          }
          description="Sözleşme durumu ve yenileme takibi"
          icon={ShieldCheck}
          title="Sözleşme bilgileri"
        />
        <dl className="mt-5 divide-y divide-divider text-sm">
          <ContractRow label="Durum">
            <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
          </ContractRow>
          <ContractRow label="Bitiş tarihi">{company.contractEnd || "Belirtilmedi"}</ContractRow>
          <ContractRow label="Kalan süre">
            <Badge tone={remainingTone}>{remainingLabel}</Badge>
          </ContractRow>
          <ContractRow label="Çalışan kapsamı">{company.employees} çalışan</ContractRow>
        </dl>
      </Card>
      <CompanyDocuments documents={company.contractDocuments ?? []} onAdd={onAddDocument} onRemove={onRemoveDocument} />
    </div>
  );
}

function CompanyDocuments({ documents, onAdd, onRemove }: { documents: CompanyDocument[]; onAdd: (document: CompanyDocument) => void; onRemove: (document: CompanyDocument) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Dosya boyutu 2 MB'dan büyük olamaz.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      onAdd({ id: `${Date.now()}-${file.name}`, name: file.name, size: file.size, type: file.type || "application/octet-stream", dataUrl: reader.result, createdAt: new Date().toISOString() });
    };
    reader.onerror = () => setError("Dosya okunamadı. Lütfen tekrar deneyin.");
    reader.readAsDataURL(file);
  };
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        action={<Button onClick={() => inputRef.current?.click()} size="sm"><Upload /> Belge yükle</Button>}
        description="Sözleşme kopyaları ve firma ile ilgili belgeler."
        icon={FileText}
        title="Belgeler"
      />
      <input accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} ref={inputRef} type="file" />
      {error && <Alert className="mt-4" tone="danger">{error}</Alert>}
      {documents.length === 0 ? (
        <EmptyState compact className="mt-6" description="Sözleşme, ek protokol veya ilgili bir belge yükleyebilirsiniz." icon={FileText} title="Henüz belge yok" />
      ) : (
        <div className="mt-5 divide-y divide-divider">
          {documents.map((document) => (
            <div className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileText className="size-4" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{document.name}</p><p className="mt-1 text-[11px] text-muted">{formatFileSize(document.size)} · {new Date(document.createdAt).toLocaleDateString("tr-TR")}</p></div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                {document.dataUrl && <Button asChild aria-label={`${document.name} indir`} size="icon-sm" variant="ghost"><a download={document.name} href={document.dataUrl}><Download /></a></Button>}
                <Button aria-label={`${document.name} sil`} onClick={() => onRemove(document)} size="icon-sm" variant="danger"><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CompanyNotes({ company, onSave }: { company: Company; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(company.notes ?? "");
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader description="Firma ile ilgili operasyonel notları ve takip bilgilerini burada saklayın." icon={StickyNote} title="Firma notları" />
      <textarea aria-label="Firma notları" className="border-border bg-card-muted text-foreground placeholder:text-subtle focus:border-brand-outline mt-5 min-h-56 w-full resize-y rounded-xl border p-4 text-sm leading-6 outline-none" onChange={(event) => setNotes(event.target.value)} placeholder="Örn. sözleşme görüşmeleri, saha notları veya takip edilecek konular..." value={notes} />
      <div className="mt-4 flex justify-end"><Button onClick={() => onSave(notes)}><Check /> Notları kaydet</Button></div>
    </Card>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ContractRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

function CompanyOffers({ company, offers, onRemove }: { company: Company; offers: Offer[]; onRemove: (item: Offer) => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { safePage, items: paged } = paginate(offers, page, pageSize);
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        action={
          <>
            <CountPill>{offers.length} teklif</CountPill>
            <Button asChild size="sm">
              <Link href={`/teklifler/yeni?firma=${company.id}`}>
                <Plus /> Yeni teklif
              </Link>
            </Button>
          </>
        }
        description="Bu firmaya hazırlanan ve gönderilen teklif kayıtları."
        icon={ReceiptText}
        title="Firma teklifleri"
      />
      {offers.length === 0 ? (
        <EmptyState
          className="mt-6"
          compact
          description="Bu firma için oluşturulan teklifler burada listelenecek."
          icon={ReceiptText}
          title="Henüz teklif bulunmuyor"
        />
      ) : (
        <div className="mt-5 divide-y divide-divider">
          {paged.map((offer) => (
            <OfferRow key={offer.id} offer={offer} onRemove={onRemove} />
          ))}
        </div>
      )}
      {offers.length > 0 && <Pagination noun="teklif" onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} page={safePage} pageSize={pageSize} total={offers.length} />}
    </Card>
  );
}

function OfferRow({ offer, onRemove }: { offer: Offer; onRemove: (item: Offer) => void }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link className="block truncate text-sm font-semibold text-foreground hover:text-brand" href={`/teklifler/${offer.id}`}>
          {offer.title || "Teklif"}
        </Link>
        <p className="mt-1 text-xs text-muted">
          {offer.number || "—"}
          {offer.offerType ? ` · ${offer.offerType}` : ""} · Geçerlilik: {offer.validUntil || "—"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-brand-soft-fg">{money(offer.total ?? 0)}</span>
        <Badge tone={offerTone[offer.status] ?? "neutral"}>{offer.status ?? "Taslak"}</Badge>
        <Button asChild aria-label={`${offer.title || offer.number || "Teklif"} düzenle`} size="icon-sm" variant="ghost"><Link href={`/teklifler/yeni?edit=${offer.id}`}><Pencil /></Link></Button>
        <Button aria-label={`${offer.title || offer.number || "Teklif"} sil`} onClick={() => onRemove(offer)} size="icon-sm" variant="danger"><Trash2 /></Button>
      </div>
    </div>
  );
}
