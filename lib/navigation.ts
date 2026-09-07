import {
  BarChart3,
  Building2,
  CalendarClock,
  HardHat,
  FileText,
  LayoutDashboard,
  ScanLine,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon };
export type NavGroup = { label: string; links: NavItem[] };

/** Single source of truth for the sidebar, the topbar quick search and breadcrumbs. */
export const navGroups: NavGroup[] = [
  {
    label: "Çalışma alanı",
    links: [
      { href: "/dashboard", label: "Genel Bakış", description: "Operasyon özeti", icon: LayoutDashboard },
      { href: "/firmalar", label: "Firmalar", description: "Müşteri ve sözleşmeler", icon: Building2 },
    ],
  },
  {
    label: "Operasyonlar",
    links: [
      { href: "/taramalar", label: "Taramalar", description: "Saha tarama planları", icon: ScanLine },
      { href: "/teklifler", label: "Teklifler", description: "Teklif ve fiyatlandırma", icon: FileText },
      { href: "/istatistikler", label: "İstatistikler", description: "Performans raporları", icon: BarChart3 },
      { href: "/takvim", label: "Takvim", description: "Planlama takvimi", icon: CalendarClock },
      { href: "/ekipmanlar", label: "Ekipmanlar", description: "Cihaz ve ekipman envanteri", icon: HardHat },
    ],
  },
];

export const settingsNav: NavItem = {
  href: "/ayarlar",
  label: "Ayarlar",
  description: "Çalışma alanı tercihleri",
  icon: Settings2,
};

export const allNavItems: NavItem[] = [...navGroups.flatMap((group) => group.links), settingsNav];

export const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
