"use client";

import {
  Bell,
  Building2,
  ClipboardCheck,
  FileKey2,
  LockKeyhole,
  Palette,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import AppearanceSettings from "@/components/settings/appearance-settings";
import NotificationSettings from "@/components/settings/notification-settings";
import OrganizationSettings from "@/components/settings/organization-settings";
import ProfileSettings from "@/components/settings/profile-settings";
import RolesSettings from "@/components/settings/roles-settings";
import SecuritySettings from "@/components/settings/security-settings";
import TeamSettings from "@/components/settings/team-settings";
import TestsSettings from "@/components/settings/tests-settings";
import { Card, IconBadge } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

type SectionId = "profil" | "kurum" | "ekip" | "roller" | "testler" | "gorunum" | "bildirimler" | "guvenlik";
type Section = { id: SectionId; label: string; icon: LucideIcon };

const sections: Section[] = [
  { id: "profil", label: "Profil bilgileri", icon: UserRound },
  { id: "kurum", label: "Kurum bilgileri", icon: Building2 },
  { id: "ekip", label: "Ekip", icon: UsersRound },
  { id: "roller", label: "Rol ve kullanıcı yönetimi", icon: FileKey2 },
  { id: "testler", label: "Test kataloğu", icon: ClipboardCheck },
  { id: "gorunum", label: "Görünüm", icon: Palette },
  { id: "bildirimler", label: "Bildirimler", icon: Bell },
  { id: "guvenlik", label: "Güvenlik", icon: LockKeyhole },
];
const defaultSection: SectionId = "profil";
const isSectionId = (value: string): value is SectionId => sections.some((section) => section.id === value);

const subscribeHash = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const readHash = (): SectionId => {
  const hash = window.location.hash.slice(1);
  return isSectionId(hash) ? hash : defaultSection;
};

function useActiveSection() {
  const active = useSyncExternalStore(subscribeHash, readHash, () => defaultSection);
  const setActive = useCallback((id: SectionId) => {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);
  return [active, setActive] as const;
}

export default function SettingsPage() {
  const [active, setActive] = useActiveSection();

  return (
    <Page size="narrow">
      <section className="relative isolate overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-fg-strong shadow-primary sm:px-7 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-right" style={{ backgroundImage: "url('/headers/settings.png')" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-sidebar/75" />
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 size-72 rounded-full border border-sidebar-accent/20 bg-sidebar-active/35" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sidebar-accent/15 text-sidebar-accent">
              <Settings2 className="size-6" />
            </span>
            <div>
              <p className="text-sidebar-accent text-[10px] font-bold tracking-[0.16em] uppercase">Çalışma alanı tercihleri</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Ayarlar</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-sidebar-fg/80">
                Hesabınızı, ekibinizi ve HanTech çalışma alanınızı tek merkezden yönetin.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-hover/60 px-3 py-2">
            <ShieldCheck className="size-4 text-sidebar-accent" />
            <span className="text-[11px] font-medium text-sidebar-fg">Değişiklikler cihazda saklanır</span>
          </div>
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr] lg:items-start">
        <SectionNav active={active} onSelect={setActive} />
        <div className="min-w-0 space-y-6">
          <SectionContent id={active} />
        </div>
      </div>
    </Page>
  );
}

function SectionNav({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  return (
    <Card className="p-3 lg:sticky lg:top-20">
      <div className="px-2 pb-3">
        <p className="text-heading text-sm font-semibold">Çalışma alanı</p>
        <p className="text-muted mt-1 text-[11px] leading-4">Hızlıca bir ayar bölümü seçin.</p>
      </div>
      <nav aria-label="Ayarlar navigasyonu" className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {sections.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={cn(
                "group flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors lg:w-full",
                selected
                  ? "border-brand-outline/40 bg-brand-soft text-brand-soft-fg"
                  : "border-transparent text-muted hover:border-border hover:bg-card-muted hover:text-foreground",
              )}
              key={id}
              onClick={() => onSelect(id)}
              type="button"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors", selected ? "bg-brand text-brand-fg" : "bg-card-muted text-muted group-hover:text-brand") }>
                <Icon className="size-4" />
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-divider mt-3 hidden items-center gap-2 border-t px-2 pt-3 lg:flex">
        <IconBadge icon={ShieldCheck} size="sm" tone="info" />
        <p className="text-subtle text-[10px] leading-4">Her bölüm kendi değişikliğini ayrı kaydeder.</p>
      </div>
    </Card>
  );
}

function SectionContent({ id }: { id: SectionId }) {
  switch (id) {
    case "profil":
      return <ProfileSettings />;
    case "kurum":
      return <OrganizationSettings />;
    case "ekip":
      return <TeamSettings />;
    case "roller":
      return <RolesSettings />;
    case "testler":
      return <TestsSettings />;
    case "gorunum":
      return <AppearanceSettings />;
    case "bildirimler":
      return <NotificationSettings />;
    case "guvenlik":
      return <SecuritySettings />;
  }
}
