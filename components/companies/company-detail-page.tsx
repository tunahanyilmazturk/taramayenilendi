"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  ShieldCheck,
  StickyNote,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { applyCompanyForm, CompanyForm, type CompanyFormValues } from "@/components/companies/company-form";
import { Badge, contractTone, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, useOffers, useSectors } from "@/lib/data";
import { companyLocation, type Company, type Offer } from "@/lib/demo-data";
import { labelToIso, money } from "@/lib/format";
import { useNotice } from "@/lib/hooks";
import { demoEmployees, type Employee } from "@/lib/employees";
import { storageKeys, useHydrated, useStoredState } from "@/lib/storage";
import { cn, initials } from "@/lib/utils";

const tabs = [
  ["genel", "Genel bakış"],
  ["calisanlar", "Çalışanlar"],
  ["taramalar", "Taramalar"],
  ["teklifler", "Teklifler"],
  ["sozlesme", "Sözleşme ve belgeler"],
  ["notlar", "Notlar"],
] as const;
type TabId = (typeof tabs)[number][0];

const emptyCompanyEmployees: Employee[] = demoEmployees;

const recentActivity = [
  ["02 Eyl 2026", "Mobil sağlık taraması başladı", "Ekip 04 · 84 çalışan"],
  ["28 Ağu 2026", "Tarama sonuçları tamamlandı", "246 sonuç · Rapor hazır"],
  ["15 Ağu 2026", "Sözleşme belgesi güncellendi", "Yönetici tarafından"],
];

export default function CompanyDetailPage({ companyId }: { companyId: string }) {
  const hydrated = useHydrated();
  const [companies, setCompanies] = useCompanies();
  const [sectors] = useSectors();
  const [notice, showNotice] = useNotice();
  const [allEmployees] = useStoredState<Employee[]>(storageKeys.employees, emptyCompanyEmployees);
  const [activeTab, setActiveTab] = useState<TabId>("genel");
  const [editing, setEditing] = useState(false);
  const company = companies.find((item) => item.id === Number(companyId));
  const companyEmployees = (allEmployees.length ? allEmployees : demoEmployees).filter((employee) => employee.companyId === Number(companyId));

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
            <Button asChild size="sm">
              <Link href="/taramalar">
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
        {activeTab === "calisanlar" && (
          <CompanyEmployees employees={companyEmployees} expectedCount={company.employees} />
        )}
        {activeTab === "taramalar" && (
          <PlaceholderModule
            description="Firmaya ait planlanan, devam eden ve tamamlanan mobil sağlık taramaları burada listelenecek."
            icon={ClipboardList}
            title="Tarama geçmişi"
          />
        )}
        {activeTab === "teklifler" && <CompanyOffers company={company} />}
        {activeTab === "sozlesme" && <ContractPanel company={company} onEdit={() => setEditing(true)} />}
        {activeTab === "notlar" && (
          <PlaceholderModule
            description="Operasyon ekibinin firma ile ilgili notları ve takip kayıtları burada tutulacak."
            icon={StickyNote}
            title="Firma notları"
          />
        )}
      </div>

      <CompanyForm
        company={company}
        onClose={() => setEditing(false)}
        onSave={saveCompany}
        open={editing}
        sectors={sectors}
      />
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

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <p className="flex items-center gap-2 text-muted">
      <Icon className="size-4 shrink-0 text-brand" />
      <span className={cn("truncate", !value && "text-subtle")}>{value || "Belirtilmedi"}</span>
    </p>
  );
}

function CompanyEmployees({ employees, expectedCount }: { employees: Employee[]; expectedCount: number }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader description={`${employees.length} kayıtlı personel · Firma çalışan sayısı ${expectedCount}`} icon={UsersRound} title="Firma çalışanları" />
      {employees.length === 0 ? (
        <EmptyState className="mt-5" description="Bu firmaya bağlı kayıtlı personel bulunmuyor. Personeller sayfasından Excel veya PDF ile aktarım yapabilirsiniz." icon={UsersRound} title="Henüz personel kaydı yok" />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-card-muted text-subtle"><tr><th className="px-4 py-3">Personel</th><th className="px-4 py-3">Departman / görev</th><th className="px-4 py-3">İletişim</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Sonuç</th></tr></thead>
            <tbody className="divide-divider divide-y">
              {employees.map((employee) => (
                <tr className="hover:bg-card-muted/60" key={employee.id}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar size="sm" text={initials(employee.name)} /><div><p className="text-heading font-semibold">{employee.name}</p><p className="text-subtle mt-0.5">{employee.email || "E-posta yok"}</p></div></div></td>
                  <td className="px-4 py-3"><p className="text-heading font-medium">{employee.department || "—"}</p><p className="text-subtle mt-0.5">{employee.position || "Görev belirtilmedi"}</p></td>
                  <td className="text-muted px-4 py-3">{employee.phone || "Telefon yok"}</td>
                  <td className="px-4 py-3"><Badge tone={employee.status === "Aktif" ? "brand" : "danger"}>{employee.status}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={employee.lastResult === "Sonuç var" ? "brand" : employee.lastResult === "Eksik" ? "danger" : "warning"}>{employee.lastResult}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PlaceholderModule({ title, description, icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <EmptyState
      action={<Badge tone="neutral">Modül hazırlanıyor</Badge>}
      compact
      description={description}
      icon={icon}
      title={title}
    />
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

function ContractPanel({ company, onEdit }: { company: Company; onEdit: () => void }) {
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
      <EmptyState
        action={<Badge tone="neutral">Modül hazırlanıyor</Badge>}
        compact
        description="Sözleşme kopyaları, ekler ve firma belgeleri bu alandan yüklenip takip edilecek."
        icon={FileText}
        title="Belgeler"
      />
    </div>
  );
}

function ContractRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

function CompanyOffers({ company }: { company: Company }) {
  const [allOffers] = useOffers();
  const offers = allOffers.filter((offer) => offer.companyId === company.id || offer.company === company.name);
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
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </Card>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link className="block truncate text-sm font-semibold text-foreground hover:text-brand" href="/teklifler">
          {offer.title || "Teklif"}
        </Link>
        <p className="mt-1 text-xs text-muted">
          {offer.number || "—"}
          {offer.offerType ? ` · ${offer.offerType}` : ""} · Geçerlilik: {offer.validUntil || "—"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-brand-soft-fg">{money(offer.total ?? 0)}</span>
        <Badge tone={offerTone[offer.status] ?? "neutral"}>{offer.status ?? "Taslak"}</Badge>
      </div>
    </div>
  );
}
