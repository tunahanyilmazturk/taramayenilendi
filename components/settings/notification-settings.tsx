"use client";

/* Notification preferences are persisted locally until the backend notification service is added. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileWarning,
  Mail,
  Monitor,
  Save,
  ShieldAlert,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import SettingsCard from "./settings-card";

const storageKey = "hantech-notification-preferences";
type NotificationPreferences = {
  inApp: boolean;
  assignmentUpdates: boolean;
  resultReady: boolean;
  contractReminders: boolean;
  teamUpdates: boolean;
  securityAlerts: boolean;
  digest: "none" | "daily" | "weekly";
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
};
const defaults: NotificationPreferences = {
  inApp: true,
  assignmentUpdates: true,
  resultReady: true,
  contractReminders: true,
  teamUpdates: true,
  securityAlerts: true,
  digest: "daily",
  quietHours: false,
  quietStart: "22:00",
  quietEnd: "07:00",
};

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: typeof Bell;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5f5ec] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#81958f] dark:text-[#91b0a6]">{description}</p>
        </div>
      </div>
      <button
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "açık" : "kapalı"}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#299b7c]" : "bg-[#c8d6d1] dark:bg-[#3d594f]"}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettings({
  emailNotifications,
  setEmailNotifications,
  screeningReminders,
  setScreeningReminders,
}: {
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  screeningReminders: boolean;
  setScreeningReminders: (value: boolean) => void;
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const update = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<NotificationPreferences> & {
          emailNotifications?: boolean;
          screeningReminders?: boolean;
        };
        const next = { ...defaults, ...parsed };
        setPreferences({
          inApp: next.inApp ?? defaults.inApp,
          assignmentUpdates: next.assignmentUpdates ?? defaults.assignmentUpdates,
          resultReady: next.resultReady ?? defaults.resultReady,
          contractReminders: next.contractReminders ?? defaults.contractReminders,
          teamUpdates: next.teamUpdates ?? defaults.teamUpdates,
          securityAlerts: next.securityAlerts ?? defaults.securityAlerts,
          digest: next.digest === "none" || next.digest === "weekly" ? next.digest : "daily",
          quietHours: next.quietHours ?? defaults.quietHours,
          quietStart: next.quietStart ?? defaults.quietStart,
          quietEnd: next.quietEnd ?? defaults.quietEnd,
        });
        if (typeof parsed.emailNotifications === "boolean") setEmailNotifications(parsed.emailNotifications);
        if (typeof parsed.screeningReminders === "boolean") setScreeningReminders(parsed.screeningReminders);
      }
    } catch {
      /* Keep defaults when storage is unavailable. */
    }
    setHydrated(true);
  }, [setEmailNotifications, setScreeningReminders]);
  useEffect(() => {
    if (hydrated)
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...preferences, emailNotifications, screeningReminders }),
      );
  }, [emailNotifications, hydrated, preferences, screeningReminders]);
  const enabledCount = [
    emailNotifications,
    preferences.inApp,
    screeningReminders,
    preferences.assignmentUpdates,
    preferences.resultReady,
    preferences.contractReminders,
    preferences.teamUpdates,
    preferences.securityAlerts,
  ].filter(Boolean).length;
  return (
    <SettingsCard
      icon={Bell}
      title="Bildirim tercihleri"
      description="OSGB operasyonlarındaki önemli gelişmelerden nasıl haberdar olacağınızı yönetin."
    >
      <div className="mt-6 space-y-7">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dceee4] bg-[#f7fcf9] px-4 py-3 dark:border-[#1d4941] dark:bg-[#102f2d]">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">Bildirim merkezi aktif</p>
              <p className="mt-1 text-xs text-[#81958f]">
                {enabledCount} tercih açık · Değişiklikler otomatik kaydedilir.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#dff6eb] px-2.5 py-1 text-[10px] font-bold text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]">
            Hazır
          </span>
        </div>
        <section>
          <SectionHeading
            icon={Monitor}
            title="Bildirim kanalları"
            description="Uyarıların hangi kanallardan size iletileceğini seçin."
          />
          <div className="mt-3 divide-y divide-[#edf3f0] rounded-2xl border border-[#e5eee9] px-4 dark:divide-[#1d4941] dark:border-[#1d4941]">
            <ToggleRow
              icon={Mail}
              title="E-posta bildirimleri"
              description="Önemli hesap, sistem ve operasyon bildirimlerini e-posta ile alın."
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <ToggleRow
              icon={Monitor}
              title="Uygulama içi bildirimler"
              description="Panel açıkken yeni görev ve durum değişikliklerini anlık görün."
              checked={preferences.inApp}
              onChange={(value) => update("inApp", value)}
            />
            <ToggleRow
              icon={Smartphone}
              title="Mobil bildirimlere hazırla"
              description="Mobil erişim aktif olduğunda anlık bildirimleri bu kanala yönlendir."
              checked={false}
              onChange={() => undefined}
            />
          </div>
        </section>
        <section>
          <SectionHeading
            icon={CalendarClock}
            title="Operasyon bildirimleri"
            description="Saha ve müşteri süreçlerinde hangi olayların izleneceğini belirleyin."
          />
          <div className="mt-3 divide-y divide-[#edf3f0] rounded-2xl border border-[#e5eee9] px-4 dark:divide-[#1d4941]">
            <ToggleRow
              icon={CalendarClock}
              title="Tarama hatırlatıcıları"
              description="Yaklaşan tarama planları ve saha görevleri için hatırlatma alın."
              checked={screeningReminders}
              onChange={setScreeningReminders}
            />
            <ToggleRow
              icon={UsersRound}
              title="Ekip ve görev güncellemeleri"
              description="Ekip ataması, görev değişikliği ve saha personeli durumlarını izleyin."
              checked={preferences.assignmentUpdates}
              onChange={(value) => update("assignmentUpdates", value)}
            />
            <ToggleRow
              icon={CheckCircle2}
              title="Sonuç hazır bildirimleri"
              description="Tarama sonuçları ve raporlar hazır olduğunda haberdar olun."
              checked={preferences.resultReady}
              onChange={(value) => update("resultReady", value)}
            />
            <ToggleRow
              icon={FileWarning}
              title="Sözleşme yenileme uyarıları"
              description="Yaklaşan sözleşme bitişlerini ve yenileme dönemlerini kaçırmayın."
              checked={preferences.contractReminders}
              onChange={(value) => update("contractReminders", value)}
            />
            <ToggleRow
              icon={UsersRound}
              title="Ekip hesabı değişiklikleri"
              description="Yeni kullanıcı, rol veya hesap durumu değişikliklerinden haberdar olun."
              checked={preferences.teamUpdates}
              onChange={(value) => update("teamUpdates", value)}
            />
          </div>
        </section>
        <section>
          <SectionHeading
            icon={Clock3}
            title="Özet ve sessiz saatler"
            description="Bildirim yoğunluğunu çalışma düzeninize göre ayarlayın."
          />
          <div className="mt-3 grid gap-4 rounded-2xl border border-[#e5eee9] p-4 dark:border-[#1d4941]">
            <label className="text-sm font-medium text-[#31534f] dark:text-[#d3ebe2]">
              Bildirim özeti
              <select
                aria-label="Bildirim özeti"
                className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
                onChange={(event) => update("digest", event.target.value as NotificationPreferences["digest"])}
                value={preferences.digest}
              >
                <option value="none">Özet gönderme</option>
                <option value="daily">Her gün · 18:00</option>
                <option value="weekly">Her pazartesi · 09:00</option>
              </select>
            </label>
            <ToggleRow
              icon={Clock3}
              title="Sessiz saatler"
              description="Bu saat aralığında kritik güvenlik bildirimleri hariç uyarıları sessize al."
              checked={preferences.quietHours}
              onChange={(value) => update("quietHours", value)}
            />
            {preferences.quietHours && (
              <div className="grid gap-3 border-t border-[#edf3f0] pt-4 sm:grid-cols-2 dark:border-[#1d4941]">
                <label className="text-xs font-semibold text-[#52776d] dark:text-[#a7c9be]">
                  Başlangıç
                  <input
                    aria-label="Sessiz saat başlangıcı"
                    className="mt-2 h-10 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm text-[#31534f] outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
                    onChange={(event) => update("quietStart", event.target.value)}
                    type="time"
                    value={preferences.quietStart}
                  />
                </label>
                <label className="text-xs font-semibold text-[#52776d] dark:text-[#a7c9be]">
                  Bitiş
                  <input
                    aria-label="Sessiz saat bitişi"
                    className="mt-2 h-10 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm text-[#31534f] outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
                    onChange={(event) => update("quietEnd", event.target.value)}
                    type="time"
                    value={preferences.quietEnd}
                  />
                </label>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-[#f0ddd4] bg-[#fffaf8] p-4 dark:border-[#543d36] dark:bg-[#2d211e]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#b97967]" />
            <div>
              <p className="text-xs font-semibold text-[#825548] dark:text-[#edb9aa]">Kritik güvenlik bildirimleri</p>
              <p className="mt-1 text-xs leading-5 text-[#9b7064] dark:text-[#dca79a]">
                Güvenlik uyarıları, oturum ve hesap koruma bildirimleri sessiz saatlerden bağımsız olarak gösterilir.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <ToggleRow
              icon={ShieldAlert}
              title="Güvenlik ve hesap uyarıları"
              description="Şüpheli giriş ve kritik hesap hareketlerini anında bildirin."
              checked={preferences.securityAlerts}
              onChange={(value) => update("securityAlerts", value)}
            />
          </div>
        </section>
        <div className="flex items-center justify-between gap-3 border-t border-[#edf3f0] pt-5 dark:border-[#1d4941]">
          <p className="text-xs text-[#81958f]">Tercihleriniz bu cihazda saklanır.</p>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#174e4b]"
            onClick={() =>
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({ ...preferences, emailNotifications, screeningReminders }),
              )
            }
            type="button"
          >
            <Save className="size-3.5" /> Tercihleri kaydet
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Bell; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef8f2] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#81958f] dark:text-[#91b0a6]">{description}</p>
      </div>
    </div>
  );
}
