"use client";

import {
  Bell,
  Building2,
  ClipboardCheck,
  FileKey2,
  LockKeyhole,
  Palette,
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
import { Page, PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        description="Hesabınızı ve HanTech çalışma alanınızı yönetin. Her bölüm kendi değişikliklerini ayrı kaydeder."
        eyebrow="Çalışma alanı tercihleri"
        title="Ayarlar"
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
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
    <nav
      aria-label="Ayarlar navigasyonu"
      className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:px-0 lg:pb-0"
    >
      {sections.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        return (
          <button
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors lg:w-full lg:py-3",
              selected
                ? "bg-brand-soft text-brand-soft-fg"
                : "text-muted hover:bg-card-muted hover:text-foreground lg:hover:bg-brand-soft/60",
            )}
            key={id}
            onClick={() => onSelect(id)}
            type="button"
          >
            <Icon className="size-[18px] shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>
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
