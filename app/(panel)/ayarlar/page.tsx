"use client";

import {
  Bell,
  Building2,
  Check,
  ClipboardCheck,
  FileKey2,
  LockKeyhole,
  Palette,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import AppearanceSettings from "@/components/settings/appearance-settings";
import NotificationSettings from "@/components/settings/notification-settings";
import OrganizationSettings from "@/components/settings/organization-settings";
import ProfileSettings from "@/components/settings/profile-settings";
import RolesSettings from "@/components/settings/roles-settings";
import SecuritySettings from "@/components/settings/security-settings";
import TeamSettings from "@/components/settings/team-settings";
import TestsSettings from "@/components/settings/tests-settings";
import type { TeamMember } from "@/components/settings/types";

const sections = [
  ["profil", "Profil bilgileri", UserRound],
  ["kurum", "Kurum bilgileri", Building2],
  ["ekip", "Ekip", UsersRound],
  ["roller", "Rol ve kullanıcı yönetimi", FileKey2],
  ["testler", "Test kataloğu", ClipboardCheck],
  ["gorunum", "Görünüm", Palette],
  ["bildirimler", "Bildirimler", Bell],
  ["guvenlik", "Güvenlik", LockKeyhole],
] as const;

export default function SettingsRoute() {
  const { resolvedTheme, setTheme } = useTheme();
  const [active, setActive] = useState("profil");
  const [saved, setSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [screeningReminders, setScreeningReminders] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([
    { name: "Dr. Elif Kaya", profession: "İşyeri hekimi", email: "elif.kaya@hantech.com.tr", account: true },
    { name: "Seda Demir", profession: "Hemşire", email: "seda.demir@hantech.com.tr", account: true },
  ]);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  return (
    <main className="mx-auto max-w-6xl pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#6f8982] dark:text-[#9ebbb3]">Çalışma alanı tercihleri</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">Ayarlar</h1>
          <p className="mt-2 text-sm text-[#81958f] dark:text-[#91b0a6]">
            Hesabınızı ve HanTech çalışma alanınızı yönetin.
          </p>
        </div>
        <button
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,60,58,0.14)] transition hover:bg-[#174e4b]"
          onClick={save}
          type="button"
        >
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}{" "}
          {saved ? "Kaydedildi" : "Değişiklikleri kaydet"}
        </button>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1" aria-label="Ayarlar navigasyonu">
          {sections.map(([id, label, Icon]) => (
            <button
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors lg:w-full ${active === id ? "bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]" : "text-[#6c8580] hover:bg-[#ebf6f0] hover:text-[#1e6b59] dark:text-[#92aea5] dark:hover:bg-[#12372f]"}`}
              key={id}
              onClick={() => setActive(id)}
              type="button"
            >
              <Icon className="size-[18px]" />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-6">
          {active === "profil" && <ProfileSettings />}
          {active === "kurum" && <OrganizationSettings />}
          {active === "ekip" && <TeamSettings team={team} setTeam={setTeam} />}
          {active === "roller" && <RolesSettings />}
          {active === "testler" && <TestsSettings />}
          {active === "gorunum" && <AppearanceSettings resolvedTheme={resolvedTheme} setTheme={setTheme} />}
          {active === "bildirimler" && (
            <NotificationSettings
              emailNotifications={emailNotifications}
              setEmailNotifications={setEmailNotifications}
              screeningReminders={screeningReminders}
              setScreeningReminders={setScreeningReminders}
            />
          )}
          {active === "guvenlik" && <SecuritySettings />}
        </div>
      </div>
    </main>
  );
}
