"use client";

/* Frontend-only offer list reads from browser storage. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  MoreHorizontal,
  Phone,
  ReceiptText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const companies = {
  "1": {
    name: "Artemis Otomotiv A.Ş.",
    sector: "Otomotiv",
    city: "Kocaeli · Gebze",
    contact: "Murat Şahin",
    phone: "+90 262 000 00 00",
    employees: 248,
    screenings: 18,
    contract: "Aktif",
    contractEnd: "31 Ara 2026",
    code: "AO",
  },
  "2": {
    name: "Mavi Hat Lojistik",
    sector: "Lojistik",
    city: "İstanbul · Tuzla",
    contact: "Büşra Aydın",
    phone: "+90 216 000 00 00",
    employees: 126,
    screenings: 12,
    contract: "Aktif",
    contractEnd: "18 Mar 2027",
    code: "MH",
  },
  "3": {
    name: "Nova Gıda Üretim",
    sector: "Gıda üretimi",
    city: "Tekirdağ · Çerkezköy",
    contact: "Emre Yıldız",
    phone: "+90 282 000 00 00",
    employees: 384,
    screenings: 24,
    contract: "Yenileniyor",
    contractEnd: "15 Eyl 2026",
    code: "NG",
  },
};
const tabs = [
  ["genel", "Genel bakış"],
  ["calisanlar", "Çalışanlar"],
  ["taramalar", "Taramalar"],
  ["teklifler", "Teklifler"],
  ["sozlesme", "Sözleşme ve belgeler"],
  ["notlar", "Notlar"],
] as const;

export default function CompanyDetailPage({ companyId }: { companyId: string }) {
  const company = companies[companyId as keyof typeof companies] ?? {
    name: "Yeni firma",
    sector: "Sektör bilgisi bekleniyor",
    city: "Konum bilgisi bekleniyor",
    contact: "-",
    phone: "-",
    employees: 0,
    screenings: 0,
    contract: "Aktif",
    contractEnd: "-",
    code: "NF",
  };
  const [activeTab, setActiveTab] = useState("genel");
  return (
    <main className="mx-auto max-w-[1440px] pb-10">
      <Link
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#718783] hover:text-[#258b71]"
        href="/firmalar"
      >
        <ArrowLeft className="size-4" /> Firmalara dön
      </Link>
      <section className="mt-6 rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-7 dark:border-[#1d4941] dark:bg-[#0e2927]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#d8f0e4] text-lg font-bold text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
              {company.code}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#173e3b] dark:text-[#e8f7f1]">
                  {company.name}
                </h1>
                <Status status={company.contract} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#81958f] dark:text-[#a7c9be]">
                <Building2 className="size-4" /> {company.sector}
                <span className="mx-1">·</span>
                <MapPin className="size-4" /> {company.city}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[#dbe9e4] px-3 py-2.5 text-xs font-semibold text-[#52776d] hover:bg-[#ebf6f0] dark:border-[#1d4941] dark:text-[#c4dfd5]"
              type="button"
            >
              <MoreHorizontal className="size-4" /> İşlemler
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#174e4b]"
              type="button"
            >
              <CalendarDays className="size-4" /> Yeni tarama
            </button>
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          <Info label="Çalışan sayısı" value={String(company.employees)} icon={UsersRound} />
          <Info label="Toplam tarama" value={String(company.screenings)} icon={ClipboardList} />
          <Info label="Sözleşme bitişi" value={company.contractEnd} icon={FileText} />
          <Info label="Firma yetkilisi" value={company.contact} icon={ShieldCheck} />
        </div>
      </section>
      <nav
        className="mt-6 flex gap-5 overflow-x-auto border-b border-[#e0ece8] dark:border-[#1d4941]"
        aria-label="Firma detay sekmeleri"
      >
        {tabs.map(([id, label]) => (
          <button
            className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold ${activeTab === id ? "border-[#299b7c] text-[#1f8068] dark:text-[#a7f3d0]" : "border-transparent text-[#81958f] hover:text-[#52776d]"}`}
            key={id}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-6">
        {activeTab === "genel" && <Overview company={company} />}
        {activeTab === "calisanlar" && (
          <EmptyModule
            title="Firma çalışanları"
            description="Bu firmaya bağlı çalışan kayıtları, görevler ve sağlık taraması geçmişi burada yönetilecek."
            icon={UsersRound}
          />
        )}
        {activeTab === "taramalar" && (
          <EmptyModule
            title="Tarama geçmişi"
            description="Firmaya ait planlanan, devam eden ve tamamlanan mobil sağlık taramaları burada listelenecek."
            icon={ClipboardList}
          />
        )}
        {activeTab === "teklifler" && <CompanyOffers companyName={company.name} />}
        {activeTab === "sozlesme" && (
          <EmptyModule
            title="Sözleşme ve belgeler"
            description="Sözleşme tarihleri, yenileme durumu ve firma belgeleri bu alandan takip edilecek."
            icon={FileText}
          />
        )}
        {activeTab === "notlar" && (
          <EmptyModule
            title="Firma notları"
            description="Operasyon ekibinin firma ile ilgili notları ve takip kayıtları burada tutulacak."
            icon={FileText}
          />
        )}
      </div>
    </main>
  );
}

function Overview({ company }: { company: (typeof companies)[keyof typeof companies] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#0e2927]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Son operasyonlar</h2>
            <p className="mt-1 text-xs text-[#81958f]">Firma ile ilgili son hareketler</p>
          </div>
          <button className="text-xs font-semibold text-[#258b71]" type="button">
            Tümünü gör
          </button>
        </div>
        <div className="mt-5 divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
          {[
            ["02 Eyl 2026", "Mobil sağlık taraması başladı", "Ekip 04 · 84 çalışan"],
            ["28 Ağu 2026", "Tarama sonuçları tamamlandı", "246 sonuç · Rapor hazır"],
            ["15 Ağu 2026", "Sözleşme belgesi güncellendi", "Yönetici tarafından"],
          ].map(([date, title, detail]) => (
            <div className="flex items-start gap-3 py-4 first:pt-0" key={title}>
              <span className="mt-1 flex size-8 items-center justify-center rounded-lg bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
                <CheckCircle2 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</p>
                <p className="mt-1 text-xs text-[#81958f]">{detail}</p>
              </div>
              <time className="ml-auto shrink-0 text-[10px] text-[#91a49f]">{date}</time>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#0e2927]">
        <h2 className="text-base font-semibold text-[#173e3b] dark:text-[#e8f7f1]">İletişim</h2>
        <div className="mt-5 space-y-4 text-sm">
          <p className="flex items-center gap-2 text-[#718783] dark:text-[#a7c9be]">
            <UsersRound className="size-4 text-[#299b7c]" /> {company.contact}
          </p>
          <p className="flex items-center gap-2 text-[#718783] dark:text-[#a7c9be]">
            <Phone className="size-4 text-[#299b7c]" /> {company.phone}
          </p>
          <p className="flex items-center gap-2 text-[#718783] dark:text-[#a7c9be]">
            <MapPin className="size-4 text-[#299b7c]" /> {company.city}
          </p>
        </div>
      </section>
    </div>
  );
}
function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UsersRound }) {
  return (
    <div className="rounded-xl border border-[#e0ece8] bg-[#fbfdfc] p-3 dark:border-[#1d4941] dark:bg-[#102f2d]">
      <Icon className="size-4 text-[#299b7c]" />
      <p className="mt-2 text-[10px] text-[#91a49f]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{value}</p>
    </div>
  );
}
function Status({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === "Aktif" ? "bg-[#dff6eb] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]" : "bg-[#fff1e2] text-[#a16c3e] dark:bg-[#4b3825] dark:text-[#f4c994]"}`}
    >
      {status}
    </span>
  );
}
function EmptyModule({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof UsersRound;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#cfe6da] bg-white p-10 text-center dark:border-[#1d4941] dark:bg-[#0e2927]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <Icon className="size-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#81958f]">{description}</p>
      <span className="mt-5 inline-flex rounded-full bg-[#e5f5ec] px-3 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        Modül hazırlanıyor
      </span>
    </section>
  );
}
function CompanyOffers({ companyName }: { companyName: string }) {
  const [offers, setOffers] = useState<
    Array<{ number?: string; title?: string; offerType?: string; status?: string; total?: number; validUntil?: string }>
  >([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("hantech-offers") ?? "[]") as Array<{
        company?: string;
        number?: string;
        title?: string;
        offerType?: string;
        status?: string;
        total?: number;
        validUntil?: string;
      }>;
      setOffers(stored.filter((offer) => offer.company === companyName));
    } catch {
      setOffers([]);
    }
  }, [companyName]);
  return (
    <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#0e2927]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#173e3b] dark:text-[#e8f7f1]">
            <ReceiptText className="size-4 text-[#299b7c]" /> Firma teklifleri
          </h2>
          <p className="mt-1 text-xs text-[#81958f]">Bu firmaya hazırlanan ve gönderilen teklif kayıtları.</p>
        </div>
        <span className="rounded-full bg-[#e5f5ec] px-2.5 py-1 text-[10px] font-bold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          {offers.length} teklif
        </span>
      </div>
      {offers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#cfe6da] p-8 text-center dark:border-[#1d4941]">
          <ReceiptText className="mx-auto size-7 text-[#7da99b]" />
          <p className="mt-3 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">Henüz teklif bulunmuyor</p>
          <p className="mt-1 text-xs text-[#81958f]">Bu firma için oluşturulan teklifler burada listelenecek.</p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
          {offers.map((offer, index) => (
            <div
              className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              key={`${offer.number}-${index}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
                  {offer.title ?? "Teklif"}
                </p>
                <p className="mt-1 text-xs text-[#81958f]">
                  {offer.number ?? "—"}
                  {offer.offerType ? ` · ${offer.offerType}` : ""} · Geçerlilik: {offer.validUntil ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#278b70]">
                  {typeof offer.total === "number"
                    ? new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                        maximumFractionDigits: 0,
                      }).format(offer.total)
                    : "—"}
                </span>
                <span className="rounded-full bg-[#e5f5ec] px-2.5 py-1 text-[10px] font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                  {offer.status ?? "Taslak"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
