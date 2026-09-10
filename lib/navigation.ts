import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  HardHat,
  FileText,
  LayoutDashboard,
  ScanLine,
  Settings2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon };
export type NavGroup = { label: string; links: NavItem[] };

/** Single source of truth for the sidebar, the topbar quick search and breadcrumbs. */
export const navGroups: NavGroup[] = [
  {
    label: "Çalışma alanı",
    links: [
      { href: "/dashboard", label: "Günlük operasyon", description: "Bugünün operasyon planı", icon: LayoutDashboard },
      { href: "/firmalar", label: "Firmalar", description: "Müşteri ve sözleşmeler", icon: Building2 },
      { href: "/personeller", label: "Personeller", description: "Firma çalışanları", icon: UsersRound },
    ],
  },
  {
    label: "Operasyonlar",
    links: [
      { href: "/taramalar", label: "Taramalar", description: "Saha tarama planları", icon: ScanLine },
      { href: "/teklifler", label: "Teklifler", description: "Teklif ve fiyatlandırma", icon: FileText },
      { href: "/istatistikler", label: "Analiz ve Raporlar", description: "Operasyon ve performans analizleri", icon: BarChart3 },
      { href: "/sonuclar", label: "Sonuçlar", description: "Tarama sonuç teslim durumu", icon: ClipboardCheck },
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
