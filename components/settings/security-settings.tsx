"use client";

import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import SettingsCard, { SectionHeading } from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { useNotice } from "@/lib/hooks";

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
    </SettingsCard>
  );
}
