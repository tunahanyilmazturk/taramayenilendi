"use client";

import {
  Bell,
  Building2,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import ThemeToggle from "@/components/shared/theme-toggle";

const searchableModules = [
  { href: "/dashboard", label: "Genel Bakış", description: "Operasyon özeti", icon: LayoutDashboard },
  { href: "/firmalar", label: "Firmalar", description: "Müşteri ve sözleşmeler", icon: Building2 },
  { href: "/taramalar", label: "Taramalar", description: "Saha tarama planları", icon: CalendarClock },
  { href: "/teklifler", label: "Teklifler", description: "Teklif ve fiyatlandırma", icon: FileText },
  { href: "/ayarlar", label: "Ayarlar", description: "Çalışma alanı tercihleri", icon: Settings2 },
];

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [query, setQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [read, setRead] = useState(false);
  const results = useMemo(
    () =>
      searchableModules.filter((item) =>
        `${item.label} ${item.description}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")),
      ),
    [query],
  );
  const closeMenus = () => {
    setNotificationOpen(false);
    setProfileOpen(false);
  };
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e2eee9] bg-white/90 px-5 backdrop-blur-xl sm:px-8 dark:border-[#1d4941] dark:bg-[#0b2422]/90">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Menüyü aç"
          className="rounded-xl p-2 text-[#51716a] hover:bg-[#ebf6f0] lg:hidden dark:text-[#a7c9be] dark:hover:bg-[#12372f]"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
          <input
            aria-label="Panelde ara"
            className="h-10 w-64 rounded-xl border border-[#e0ece8] bg-[#f8fbfa] pr-9 pl-9 text-sm outline-none placeholder:text-[#9ab1ab] focus:border-[#7bcdae] dark:border-[#28554c] dark:bg-[#102f2d] dark:text-[#e8f7f1] dark:placeholder:text-[#75968c]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Panelde ara..."
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Aramayı temizle"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-[#81958f] hover:bg-[#e5f5ec]"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
          {query && (
            <div className="absolute top-12 left-0 z-50 w-80 overflow-hidden rounded-2xl border border-[#dceee4] bg-white p-2 shadow-xl dark:border-[#1d4941] dark:bg-[#0e2927]">
              <p className="px-3 py-2 text-[10px] font-bold tracking-[0.12em] text-[#91aaa4] uppercase">Hızlı erişim</p>
              {results.length > 0 ? (
                results.map(({ href, label, description, icon: Icon }) => (
                  <Link
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0faf4] dark:hover:bg-[#12372f]"
                    href={href}
                    key={href}
                    onClick={() => {
                      setQuery("");
                      closeMenus();
                    }}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#e5f5ec] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{label}</span>
                      <span className="block truncate text-[10px] text-[#81958f]">{description}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-4 text-xs text-[#81958f]">Eşleşen modül bulunamadı.</p>
              )}
            </div>
          )}
        </div>
        <div className="sm:hidden">
          <p className="text-sm font-bold text-[#103c3a] dark:text-[#e9faf3]">HanTech OSGB</p>
          <p className="text-[10px] text-[#78908b] dark:text-[#8db0a6]">Operasyon merkezi</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className="relative">
          <button
            aria-expanded={notificationOpen}
            aria-label="Bildirimler"
            className={`relative rounded-xl p-2.5 text-[#68837c] hover:bg-[#ebf6f0] dark:text-[#a7c9be] dark:hover:bg-[#12372f] ${notificationOpen ? "bg-[#e5f5ec] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]" : ""}`}
            onClick={() => {
              setNotificationOpen((value) => !value);
              setProfileOpen(false);
            }}
            type="button"
          >
            <Bell className="size-[18px]" />
            {!read && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#e28c5e]" />}
          </button>
          {notificationOpen && (
            <div className="absolute top-12 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dceee4] bg-white shadow-xl dark:border-[#1d4941] dark:bg-[#0e2927]">
              <div className="flex items-center justify-between border-b border-[#edf3f0] px-4 py-3 dark:border-[#1d4941]">
                <div>
                  <p className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">Bildirimler</p>
                  <p className="mt-0.5 text-[10px] text-[#81958f]">Son operasyon güncellemeleri</p>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#278b70]"
                  onClick={() => setRead(true)}
                  type="button"
                >
                  <CheckCheck className="size-3.5" />
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
                <NotificationItem
                  icon={CalendarClock}
                  title="Yarın 3 tarama planlandı"
                  description="Saha ekiplerinizi ve saatleri kontrol edin."
                />
                <NotificationItem
                  icon={ShieldAlert}
                  title="2 sözleşme yenileme bekliyor"
                  description="Firmalar sayfasından detayları inceleyin."
                />
              </div>
              <Link
                className="block border-t border-[#edf3f0] px-4 py-3 text-center text-xs font-semibold text-[#278b70] hover:bg-[#f7fcf9] dark:border-[#1d4941] dark:hover:bg-[#12372f]"
                href="/ayarlar"
                onClick={closeMenus}
              >
                Bildirim tercihlerini yönet
              </Link>
            </div>
          )}
        </div>
        <ThemeToggle />
        <div className="hidden h-8 w-px bg-[#e1ece8] sm:block dark:bg-[#28554c]" />
        <div className="relative">
          <button
            aria-expanded={profileOpen}
            aria-label="Ahmet Yılmaz kullanıcı menüsü"
            className="flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-[#f0faf4] dark:hover:bg-[#12372f]"
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotificationOpen(false);
            }}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#d9f5e7] text-xs font-bold text-[#278b70] dark:bg-[#1a5541] dark:text-[#a7f3d0]">
              AY
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">Ahmet Yılmaz</span>
              <span className="mt-0.5 block text-[10px] text-[#8aa09c] dark:text-[#8eaea4]">Yönetici</span>
            </span>
            <ChevronDown
              className={`hidden size-3.5 text-[#81958f] transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>
          {profileOpen && (
            <div className="absolute top-12 right-0 z-50 w-56 overflow-hidden rounded-2xl border border-[#dceee4] bg-white p-2 shadow-xl dark:border-[#1d4941] dark:bg-[#0e2927]">
              <div className="border-b border-[#edf3f0] px-3 py-2.5 dark:border-[#1d4941]">
                <p className="text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">Ahmet Yılmaz</p>
                <p className="mt-1 truncate text-[10px] text-[#81958f]">ahmet.yilmaz@hantech.com.tr</p>
              </div>
              <Link
                className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#52776d] hover:bg-[#f0faf4] dark:text-[#b8d4c9] dark:hover:bg-[#12372f]"
                href="/ayarlar"
                onClick={closeMenus}
              >
                <UserRound className="size-4" /> Profil ve ayarlar
              </Link>
              <Link
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#a66f60] hover:bg-[#fff4ef] dark:hover:bg-[#3a2925]"
                href="/login"
                onClick={closeMenus}
              >
                <LogOut className="size-4" /> Oturumu kapat
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5f5ec] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-[#81958f]">{description}</p>
      </div>
    </div>
  );
}
