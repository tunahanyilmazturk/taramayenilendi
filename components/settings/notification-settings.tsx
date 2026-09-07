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
import { Button } from "@/components/ui/button";

const storageKey = "hantech-notification-preferences";
type NotificationPreferences = {
  inApp: boolean;
  assignmentUpdates: boolean;
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
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <button
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "açık" : "kapalı"}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-border-strong"}`}
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

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [screeningReminders, setScreeningReminders] = useState(true);
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
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card-muted px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Bildirim merkezi aktif</p>
              <p className="mt-1 text-xs text-muted">
                {enabledCount} tercih açık · Değişiklikler otomatik kaydedilir.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand-soft-fg">
            Hazır
          </span>
        </div>
        <section>
          <SectionHeading
            icon={Monitor}
            title="Bildirim kanalları"
            description="Uyarıların hangi kanallardan size iletileceğini seçin."
          />
          <div className="mt-3 divide-y divide-divider rounded-2xl border border-border px-4">
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
          <div className="mt-3 divide-y divide-divider rounded-2xl border border-border px-4">
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
          <div className="mt-3 grid gap-4 rounded-2xl border border-border p-4">
            <label className="text-sm font-medium text-foreground">
              Bildirim özeti
              <select
                aria-label="Bildirim özeti"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-card-muted px-3 text-sm outline-none focus:border-brand-outline"
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
              <div className="grid gap-3 border-t border-divider pt-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted">
                  Başlangıç
                  <input
                    aria-label="Sessiz saat başlangıcı"
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-card-muted px-3 text-sm text-foreground outline-none focus:border-brand-outline"
                    onChange={(event) => update("quietStart", event.target.value)}
                    type="time"
                    value={preferences.quietStart}
                  />
                </label>
                <label className="text-xs font-semibold text-muted">
                  Bitiş
                  <input
                    aria-label="Sessiz saat bitişi"
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-card-muted px-3 text-sm text-foreground outline-none focus:border-brand-outline"
                    onChange={(event) => update("quietEnd", event.target.value)}
                    type="time"
                    value={preferences.quietEnd}
                  />
                </label>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-warning-soft bg-warning-soft/40 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-xs font-semibold text-warning">Kritik güvenlik bildirimleri</p>
              <p className="mt-1 text-xs leading-5 text-muted">
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
        <div className="flex items-center justify-between gap-3 border-t border-divider pt-5">
          <p className="text-xs text-muted">Tercihleriniz bu cihazda saklanır.</p>
          <Button
            onClick={() =>
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({ ...preferences, emailNotifications, screeningReminders }),
              )
            }
            size="sm"
            variant="secondary"
          >
            <Save className="size-3.5" /> Tercihleri kaydet
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Bell; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}
