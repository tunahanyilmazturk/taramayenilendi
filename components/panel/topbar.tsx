"use client";

import {
  Bell,
  Building2,
  CheckCheck,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import ThemeToggle from "@/components/shared/theme-toggle";
import { IconBadge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut, userInitials, type Session } from "@/lib/auth";
import { useCompanies, useOffers } from "@/lib/data";
import { labelToIso, todayIso } from "@/lib/format";
import { useDismiss } from "@/lib/hooks";
import { allNavItems } from "@/lib/navigation";
import { cn, includesQuery, initials } from "@/lib/utils";

type SearchResult = { href: string; label: string; description: string; icon: LucideIcon; group: string };

export default function Topbar({ session, onMenuClick }: { session: Session; onMenuClick: () => void }) {
  return (
    <header className="border-border bg-card/90 sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b px-5 backdrop-blur-xl sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button aria-label="Menüyü aç" className="lg:hidden" onClick={onMenuClick} size="icon-lg" variant="ghost">
          <Menu className="size-5" />
        </Button>
        <QuickSearch />
        <div className="sm:hidden">
          <p className="text-heading text-sm font-bold">HanTech OSGB</p>
          <p className="text-muted text-[10px]">Operasyon merkezi</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <Notifications />
        <ThemeToggle />
        <div className="bg-border hidden h-8 w-px sm:block" />
        <ProfileMenu session={session} />
      </div>
    </header>
  );
}

function QuickSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [companies] = useCompanies();
  const [offers] = useOffers();
  useDismiss(ref, open, () => setOpen(false));

  const results = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const modules = allNavItems
      .filter((item) => includesQuery(`${item.label} ${item.description}`, trimmed))
      .map((item) => ({ ...item, group: "Modüller" }));
    const companyHits = companies
      .filter((company) =>
        includesQuery(`${company.name} ${company.sector} ${company.city} ${company.contact}`, trimmed),
      )
      .slice(0, 4)
      .map((company) => ({
        href: `/firmalar/${company.id}`,
        label: company.name,
        description: `${company.sector} · ${company.city}`,
        icon: Building2,
        group: "Firmalar",
      }));
    const offerHits = offers
      .filter((offer) => includesQuery(`${offer.number} ${offer.company} ${offer.title}`, trimmed))
      .slice(0, 4)
      .map((offer) => ({
        href: "/teklifler",
        label: `${offer.number} · ${offer.company}`,
        description: offer.title,
        icon: FileText,
        group: "Teklifler",
      }));
    return [...modules, ...companyHits, ...offerHits];
  }, [query, companies, offers]);

  const groups = useMemo(() => Array.from(new Set(results.map((result) => result.group))), [results]);
  const close = () => {
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        aria-label="Panelde ara"
        className="border-border bg-card-muted text-foreground placeholder:text-subtle focus:border-brand-outline h-10 w-64 rounded-xl border pr-9 pl-9 text-sm outline-none lg:w-80"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Firma, teklif veya modül ara..."
        type="search"
        value={query}
      />
      {query && (
        <button
          aria-label="Aramayı temizle"
          className="text-muted hover:bg-brand-soft absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1"
          onClick={close}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      )}
      {open && query.trim() && (
        <div className="border-border bg-card absolute top-12 left-0 z-50 w-96 overflow-hidden rounded-2xl border p-2 shadow-xl">
          {results.length === 0 && <p className="text-muted px-3 py-4 text-xs">Eşleşen kayıt bulunamadı.</p>}
          {groups.map((group) => (
            <div key={group}>
              <p className="text-subtle px-3 py-2 text-[10px] font-bold tracking-[0.12em] uppercase">{group}</p>
              {results
                .filter((result) => result.group === group)
                .map(({ href, label, description, icon }) => (
                  <Link
                    className="hover:bg-brand-soft flex items-center gap-3 rounded-xl px-3 py-2.5"
                    href={href}
                    key={`${group}-${href}-${label}`}
                    onClick={close}
                  >
                    <IconBadge icon={icon} size="sm" />
                    <span className="min-w-0">
                      <span className="text-foreground block truncate text-xs font-semibold">{label}</span>
                      <span className="text-muted block truncate text-[10px]">{description}</span>
                    </span>
                  </Link>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [companies] = useCompanies();
  const [offers] = useOffers();
  useDismiss(ref, open, () => setOpen(false));

  const items = useMemo(() => {
    const today = todayIso();
    const soon = todayIso(7);
    const renewing = companies.filter((company) => company.contract === "Yenileniyor").length;
    const expiring = offers.filter((offer) => {
      const iso = labelToIso(offer.validUntil);
      return ["Gönderildi", "Görüşülüyor"].includes(offer.status) && iso >= today && iso <= soon;
    }).length;
    const drafts = offers.filter((offer) => offer.status === "Taslak").length;
    const list: { icon: LucideIcon; title: string; description: string; href: string }[] = [];
    if (renewing)
      list.push({
        icon: ShieldAlert,
        title: `${renewing} sözleşme yenileme bekliyor`,
        description: "Firmalar sayfasından detayları inceleyin.",
        href: "/firmalar",
      });
    if (expiring)
      list.push({
        icon: FileText,
        title: `${expiring} teklifin geçerliliği bu hafta bitiyor`,
        description: "Müşteri dönüşlerini takip edin.",
        href: "/teklifler",
      });
    if (drafts)
      list.push({
        icon: FileText,
        title: `${drafts} taslak teklif gönderilmeyi bekliyor`,
        description: "Taslakları tamamlayıp firmalara iletin.",
        href: "/teklifler",
      });
    return list;
  }, [companies, offers]);

  return (
    <div className="relative" ref={ref}>
      <Button
        aria-expanded={open}
        aria-label="Bildirimler"
        className={cn("relative", open && "bg-brand-soft text-brand-soft-fg")}
        onClick={() => setOpen((value) => !value)}
        size="icon-lg"
        variant="ghost"
      >
        <Bell />
        {!read && items.length > 0 && (
          <span className="bg-warning ring-card absolute top-2 right-2 size-2 rounded-full ring-2" />
        )}
      </Button>
      {open && (
        <div className="border-border bg-card absolute top-12 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-xl">
          <div className="border-divider flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-foreground text-sm font-semibold">Bildirimler</p>
              <p className="text-muted mt-0.5 text-[10px]">Kayıtlarınızdan türetilen güncel uyarılar</p>
            </div>
            <button
              className="text-brand hover:text-brand-strong inline-flex items-center gap-1 text-[10px] font-semibold"
              onClick={() => setRead(true)}
              type="button"
            >
              <CheckCheck className="size-3.5" /> Okundu işaretle
            </button>
          </div>
          <div className="divide-divider divide-y">
            {items.length === 0 && <p className="text-muted px-4 py-6 text-center text-xs">Bekleyen bildirim yok.</p>}
            {items.map((item) => (
              <Link
                className="hover:bg-card-muted flex gap-3 px-4 py-3.5"
                href={item.href}
                key={item.title}
                onClick={() => setOpen(false)}
              >
                <IconBadge icon={item.icon} size="sm" />
                <span>
                  <span className="text-foreground block text-xs font-semibold">{item.title}</span>
                  <span className="text-muted mt-1 block text-[10px] leading-4">{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
          <Link
            className="border-divider text-brand hover:bg-card-muted block border-t px-4 py-3 text-center text-xs font-semibold"
            href="/ayarlar#bildirimler"
            onClick={() => setOpen(false)}
          >
            Bildirim tercihlerini yönet
          </Link>
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ session }: { session: Session }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const logout = () => {
    signOut();
    router.replace("/login");
  };
  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label={`${session.name} kullanıcı menüsü`}
        className="hover:bg-brand-soft flex items-center gap-2 rounded-xl p-1.5 text-left transition-colors"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="bg-brand-soft text-brand-soft-fg flex size-9 items-center justify-center rounded-xl text-xs font-bold">
          {userInitials(session.name) || initials(session.email)}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="text-foreground block text-xs font-semibold">{session.name}</span>
          <span className="text-muted mt-0.5 block text-[10px]">{session.role}</span>
        </span>
        <ChevronDown className={cn("text-muted hidden size-3.5 transition-transform sm:block", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-border bg-card absolute top-12 right-0 z-50 w-60 overflow-hidden rounded-2xl border p-2 shadow-xl">
          <div className="border-divider border-b px-3 py-2.5">
            <p className="text-foreground text-xs font-semibold">{session.name}</p>
            <p className="text-muted mt-1 truncate text-[10px]">{session.email}</p>
          </div>
          <Link
            className="text-muted hover:bg-brand-soft hover:text-brand-soft-fg mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium"
            href="/ayarlar"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4" /> Profil ve ayarlar
          </Link>
          <button
            className="text-danger hover:bg-danger-soft flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium"
            onClick={logout}
            type="button"
          >
            <LogOut className="size-4" /> Oturumu kapat
          </button>
        </div>
      )}
    </div>
  );
}
