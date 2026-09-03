"use client";

import {
  BarChart3,
  Building2,
  CalendarClock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: string };
const navGroups: { label: string; links: NavItem[] }[] = [
  {
    label: "Çalışma alanı",
    links: [
      { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/firmalar", label: "Firmalar", icon: Building2 },
      { href: "/personeller", label: "Personeller", icon: UsersRound },
    ],
  },
  {
    label: "Operasyonlar",
    links: [
      { href: "/taramalar", label: "Taramalar", icon: ScanLine, badge: "24" },
      { href: "/teklifler", label: "Teklifler", icon: FileText },
      { href: "/istatistikler", label: "İstatistikler", icon: BarChart3 },
      { href: "/takvim", label: "Takvim", icon: CalendarClock },
    ],
  },
];

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const activeClass = "bg-[#1d5747] text-[#dcfaea] shadow-[inset_3px_0_0_#73d1a6]";
  const inactiveClass = "text-[#a7c9be] hover:bg-[#174238] hover:text-[#e4faef]";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const linkClass = (active: boolean) =>
    `group relative flex items-center rounded-xl py-3 text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? activeClass : inactiveClass}`;

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#1d4941] bg-[#0f2926] px-3 py-5 transition-[width,transform] duration-200 lg:translate-x-0 ${collapsed ? "lg:w-[84px]" : "lg:w-[260px]"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
          <Link aria-label="HanTech ana sayfa" className="flex items-center gap-3" href="/dashboard" onClick={onClose}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1a4a3d] text-lg font-bold text-[#a7f3d0]">
              H
            </span>
            {!collapsed && (
              <span className="leading-tight">
                <span className="block text-sm font-bold text-[#e9faf3]">HanTech</span>
                <span className="block text-[9px] font-semibold tracking-[0.12em] text-[#8db0a6]">
                  OSGB YÖNETİM SİSTEMİ
                </span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              className="rounded-lg p-1.5 text-[#8db0a6] hover:bg-[#174238] lg:hidden"
              onClick={onClose}
              aria-label="Menüyü kapat"
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <button
          aria-label={collapsed ? "Sidebarı genişlet" : "Sidebarı daralt"}
          className="absolute top-[72px] -right-3 hidden size-7 items-center justify-center rounded-full border border-[#37685a] bg-[#153c36] text-[#a7f3d0] shadow-sm transition hover:bg-[#1d5747] lg:flex"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>
        <div className={`mt-9 flex-1 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}>
          <nav aria-label="Panel navigasyonu" className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p
                  className={`px-3 text-[10px] font-bold tracking-[0.18em] text-[#79aa99] uppercase ${collapsed ? "sr-only" : ""}`}
                >
                  {group.label}
                </p>
                <div className="mt-3 space-y-1">
                  {group.links.map(({ href, label, icon: Icon, badge }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={linkClass(active)}
                        href={href}
                        key={href}
                        onClick={onClose}
                      >
                        <Icon className="size-[18px] shrink-0" />
                        <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>{label}</span>
                        {badge && !collapsed && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-[#d9f7e7] text-[#237d61]" : "bg-[#1b3b34] text-[#8db8a6]"}`}
                          >
                            {badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`size-3.5 ${collapsed ? "sr-only" : active ? "opacity-70" : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60"}`}
                        />
                        {collapsed && (
                          <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden rounded-lg bg-[#173c35] px-2.5 py-2 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
                            {label}
                            {badge && <span className="ml-1.5 text-[#a7f3d0]">{badge}</span>}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="pt-5">
          <Link
            aria-current={isActive("/ayarlar") ? "page" : undefined}
            className={linkClass(isActive("/ayarlar"))}
            href="/ayarlar"
            onClick={onClose}
          >
            <Settings2 className="size-[18px] shrink-0" />
            <span className={collapsed ? "sr-only" : "flex-1"}>Ayarlar</span>
            {!collapsed && <ChevronRight className="size-3.5 opacity-60" />}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden rounded-lg bg-[#173c35] px-2.5 py-2 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
                Ayarlar
              </span>
            )}
          </Link>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-30 bg-[#082421]/45 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
    </>
  );
}
