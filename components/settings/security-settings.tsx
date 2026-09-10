"use client";

import { Check, Download, FileJson, LockKeyhole, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";
import SettingsCard, { SectionHeading } from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert, ConfirmDialog } from "@/components/ui/modal";
import { useConfirm, useNotice } from "@/lib/hooks";
import { removeStorage, storageKeys, writeStorage } from "@/lib/storage";

type PasswordForm = { current: string; next: string; confirm: string };
type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

const emptyForm: PasswordForm = { current: "", next: "", confirm: "" };

function validate(form: PasswordForm): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!form.current) errors.current = "Mevcut şifrenizi girin.";
  if (form.next.length < 8) errors.next = "Yeni şifre en az 8 karakter olmalıdır.";
  if (!/[A-Z]/.test(form.next) || !/[a-z]/.test(form.next) || !/[0-9]/.test(form.next))
    errors.next = "Büyük harf, küçük harf ve rakam içermelidir.";
  if (form.confirm !== form.next) errors.confirm = "Yeni şifre ve tekrarı eşleşmiyor.";
  return errors;
}

const strengthLabel = (password: string) => {
  if (!password) return { label: "", tone: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Zayıf", tone: "bg-danger" };
  if (score <= 3) return { label: "Orta", tone: "bg-warning" };
  return { label: "Güçlü", tone: "bg-brand" };
};

export default function SecuritySettings() {
  const [form, setForm] = useState<PasswordForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [notice, showNotice] = useNotice();
  const [backupError, setBackupError] = useState("");
  const [backupPreview, setBackupPreview] = useState<{ data: Record<string, string | null>; storedCount: number } | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const errors = validate(form);
  const shown = submitted ? errors : {};
  const strength = strengthLabel(form.next);
  const setField = (key: keyof PasswordForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setForm(emptyForm);
    setSubmitted(false);
    showNotice("Şifreniz güncellendi.");
  };
  const downloadBackup = () => {
    const keys = Object.values(storageKeys).filter((key) => key !== storageKeys.session);
    const data = Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]));
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hantech-osgb-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Yerel veri yedeği indirildi.");
  };
  const inspectBackup = async (file: File | undefined) => {
    if (!file) return;
    setBackupError("");
    setBackupPreview(null);
    try {
      const parsed = JSON.parse(await file.text()) as { version?: unknown; data?: unknown };
      if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
        throw new Error("Bu dosya geçerli bir HanTech yedeği değil.");
      }
      const data = parsed.data as Record<string, unknown>;
      const keys = Object.values(storageKeys).filter((key) => key !== storageKeys.session) as string[];
      const invalidKey = Object.keys(data).find((key) => !keys.includes(key));
      if (invalidKey) throw new Error("Yedek dosyasında tanınmayan veri alanı bulundu.");
      const invalidValue = keys.find((key) => data[key] !== null && typeof data[key] !== "string");
      if (invalidValue) throw new Error("Yedek dosyasındaki veri biçimi okunamadı.");
      const invalidJson = keys.find((key) => {
        const raw = data[key];
        if (raw === null || typeof raw !== "string") return false;
        try {
          JSON.parse(raw);
          return false;
        } catch {
          return true;
        }
      });
      if (invalidJson) throw new Error("Yedek dosyasındaki kayıtlar bozuk görünüyor.");
      const normalized = Object.fromEntries(keys.map((key) => [key, (data[key] as string | null | undefined) ?? null]));
      setBackupPreview({ data: normalized, storedCount: Object.values(normalized).filter((value) => value !== null).length });
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : "Yedek dosyası okunamadı.");
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = "";
    }
  };
  const requestRestore = () => {
    if (!backupPreview) return;
    confirm({
      title: "Yerel veriyi geri yükle",
      description: `${backupPreview.storedCount} veri alanı mevcut tarayıcı kayıtlarının üzerine yazılacak. Oturum bilgisi geri yüklenmez.`,
      confirmLabel: "Yedeği geri yükle",
      onConfirm: () => {
        Object.entries(backupPreview.data).forEach(([key, raw]) => {
          if (raw === null) {
            removeStorage(key);
            return;
          }
          writeStorage(key, JSON.parse(raw) as unknown);
        });
        setBackupPreview(null);
        showNotice("Yerel veri yedeği geri yüklendi. Sayfa verileri yenilendi.");
      },
    });
  };

  return (
    <SettingsCard
      description="Hesap güvenliğinizi ve oturum tercihlerinizi yönetin."
      icon={ShieldCheck}
      title="Güvenlik"
    >
      <div className="mt-6 space-y-7">
        <section>
          <SectionHeading
            description="Düzenli aralıklarla yenileyerek hesabınızı koruyun."
            title="Şifre değişikliği"
          />
          <form
            className="mt-4 max-w-lg space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Field error={shown.current} label="Mevcut şifre" required>
              <Input
                autoComplete="current-password"
                invalid={Boolean(shown.current)}
                onChange={(event) => setField("current", event.target.value)}
                type="password"
                value={form.current}
              />
            </Field>
            <Field error={shown.next} hint="En az 8 karakter · büyük/küçük harf ve rakam" label="Yeni şifre" required>
              <Input
                autoComplete="new-password"
                invalid={Boolean(shown.next)}
                onChange={(event) => setField("next", event.target.value)}
                type="password"
                value={form.next}
              />
              {form.next && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-muted">
                    <div
                      className={`h-full rounded-full transition-all ${strength.tone}`}
                      style={{ width: strength.label === "Zayıf" ? "33%" : strength.label === "Orta" ? "66%" : "100%" }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted">{strength.label}</span>
                </div>
              )}
            </Field>
            <Field error={shown.confirm} label="Yeni şifre tekrar" required>
              <Input
                autoComplete="new-password"
                invalid={Boolean(shown.confirm)}
                onChange={(event) => setField("confirm", event.target.value)}
                type="password"
                value={form.confirm}
              />
            </Field>
            {notice && (
              <Alert icon={Check}>{notice}</Alert>
            )}
            <div className="flex justify-end">
              <Button type="submit">
                <LockKeyhole /> Şifreyi güncelle
              </Button>
            </div>
          </form>
        </section>

        <section className="border-t border-divider pt-7">
          <SectionHeading description="Firma, teklif, tarama, ekipman ve ayarlar bu cihazdaki tarayıcı verilerinden alınır." title="Yerel veri yedeği" />
          <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card-muted p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted">Cihaz değişmeden veya tarayıcı verisini temizlemeden önce güncel bir JSON yedeği indirin.</p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button onClick={downloadBackup} size="sm" variant="secondary"><Download /> Yedeği indir</Button>
                <input accept="application/json,.json" className="hidden" onChange={(event) => void inspectBackup(event.target.files?.[0])} ref={backupInputRef} type="file" />
                <Button onClick={() => backupInputRef.current?.click()} size="sm" variant="outline"><Upload /> Yedek seç</Button>
              </div>
            </div>
            {backupError && <Alert tone="danger" icon={FileJson}>{backupError}</Alert>}
            {backupPreview && (
              <div className="flex flex-col gap-3 rounded-xl border border-brand-outline bg-brand-soft/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2"><FileJson className="mt-0.5 size-4 shrink-0 text-brand" /><p className="text-xs text-brand-soft-fg"><strong>Yedek hazır.</strong> {backupPreview.storedCount} veri alanı bulundu. Geri yükleme mevcut yerel verilerin üzerine yazılır.</p></div>
                <Button onClick={requestRestore} size="sm">Geri yükle</Button>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-divider pt-7">
          <SectionHeading
            description="Hesabınızla ilgili güvenlik ipuçları ve en iyi uygulamalar."
            title="Güvenlik önerileri"
          />
          <ul className="mt-4 space-y-3 text-xs text-muted">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              Şifrenizi en az 90 günde bir yenileyin ve farklı platformlarda tekrar kullanmayın.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              İki adımlı doğrulama aktif edildiğinde giriş güvenliğiniz ek katman kazanır.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              Şüpheli giriş denemelerini bildirim merkezinden takip edebilirsiniz.
            </li>
          </ul>
        </section>
      </div>
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </SettingsCard>
  );
}
