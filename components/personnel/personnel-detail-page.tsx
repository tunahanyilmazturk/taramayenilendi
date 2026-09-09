"use client";

import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, Clock3, IdCard, Mail, Phone, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, usePersonnel } from "@/lib/data";
import { isoToLabel } from "@/lib/format";
import { useHydrated } from "@/lib/storage";
import { initials } from "@/lib/utils";

export default function PersonnelDetailPage({ personnelId }: { personnelId: string }) {
  const hydrated = useHydrated();
  const [personnel] = usePersonnel();
  const [companies] = useCompanies();
  const item = personnel.find((entry) => entry.id === Number(personnelId));
  const company = item ? companies.find((entry) => entry.id === item.companyId) : undefined;

  if (!hydrated) return <DetailSkeleton />;
  if (!item) {
    return (
      <Page>
        <EmptyState
          action={<Button asChild variant="secondary"><Link href="/personeller"><ArrowLeft /> Personeller listesine dön</Link></Button>}
          className="mt-6"
          description="Aradığınız personel kaydı silinmiş veya bağlantı hatalı olabilir."
          icon={UsersRound}
          title="Personel bulunamadı"
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/personeller"><ArrowLeft /> Personeller</Link></Button>{company && <Button asChild variant="secondary"><Link href={`/firmalar/${company.id}`}><Building2 /> Firma detayına git</Link></Button>}</div>}
        className="border-border bg-card shadow-card rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
        description="Firma çalışanının kimlik, görev, iletişim ve çalışma bilgilerini tek ekranda görüntüleyin."
        eyebrow="Personel detay kaydı"
        title={item.name}
        visual="/headers/personnel.png"
      />

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-divider bg-card-muted/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4"><Avatar size="lg" text={initials(item.name)} /><div><p className="text-lg font-semibold text-heading">{item.title || "Görev belirtilmedi"}</p><p className="mt-1 text-sm text-muted">{company?.name || "Firma bulunamadı"}{item.department ? ` · ${item.department}` : ""}</p></div></div>
          <Badge tone={item.status === "Aktif" ? "brand" : item.status === "İzinli" ? "warning" : "danger"}>{item.status}</Badge>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6"><StatTile icon={Building2} label="Bağlı firma" value={company?.name || "—"} /><StatTile icon={BriefcaseBusiness} label="Departman" value={item.department || "Belirtilmedi"} /><StatTile icon={CalendarDays} label="İşe giriş" value={isoToLabel(item.startDate) || "Belirtilmedi"} /><StatTile icon={Clock3} label="Vardiya" value={item.shift} /></div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <InfoCard icon={IdCard} title="Kimlik ve kişisel bilgiler"><InfoRow label="Ad soyad" value={item.name} /><InfoRow label="TC / yabancı kimlik no" value={item.nationalId || "Belirtilmedi"} /><InfoRow label="Doğum tarihi" value={isoToLabel(item.birthDate) || "Belirtilmedi"} /><InfoRow label="Sicil / personel no" value={item.employeeNo || "Belirtilmedi"} /></InfoCard>
        <InfoCard icon={Phone} title="İletişim bilgileri"><InfoRow icon={Mail} label="E-posta" value={item.email || "Belirtilmedi"} /><InfoRow icon={Phone} label="Telefon" value={item.phone || "Belirtilmedi"} /><InfoRow icon={ShieldCheck} label="Kayıt tarihi" value={isoToLabel(item.createdAt) || "Belirtilmedi"} /><InfoRow icon={Building2} label="Firma" value={company?.name || "Firma bulunamadı"} /></InfoCard>
      </div>

      <Card className="mt-5 p-5 sm:p-6"><CardHeader description="Kayıt üzerinde tutulmuş operasyonel açıklamalar." title="Notlar" />{item.notes ? <p className="mt-5 rounded-xl border border-border bg-card-muted p-4 text-sm leading-6 text-foreground">{item.notes}</p> : <p className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Bu personel için henüz not eklenmemiş.</p>}</Card>
    </Page>
  );
}

function InfoCard({ children, icon: Icon, title }: { children: React.ReactNode; icon: typeof IdCard; title: string }) {
  return <Card className="p-5 sm:p-6"><CardHeader icon={Icon} title={title} /><dl className="mt-5 divide-y divide-divider">{children}</dl></Card>;
}

function InfoRow({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><dt className="flex items-center gap-2 text-xs text-muted">{Icon && <Icon className="size-4 text-brand" />}{label}</dt><dd className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">{value}</dd></div>;
}

function DetailSkeleton() {
  return <Page className="animate-pulse"><div className="h-40 rounded-2xl bg-card-muted" /><div className="mt-5 h-44 rounded-2xl bg-card-muted" /><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="h-64 rounded-2xl bg-card-muted" /><div className="h-64 rounded-2xl bg-card-muted" /></div></Page>;
}
