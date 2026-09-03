"use client";

import { Check, Save, UserRound } from "lucide-react";
import { useState } from "react";
import SettingsCard from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { demoUser } from "@/lib/demo-data";
import { useNotice } from "@/lib/hooks";
import { storageKeys, useHydrated, useStoredState } from "@/lib/storage";

type Profile = { firstName: string; lastName: string; email: string; phone: string; role: string };

const [demoFirstName, ...demoRest] = demoUser.name.split(" ");
const defaultProfile: Profile = {
  firstName: demoFirstName ?? "",
  lastName: demoRest.join(" "),
  email: demoUser.email,
  phone: "+90 532 000 00 00",
  role: demoUser.role,
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileSettings() {
  const [profile, setProfile] = useStoredState<Profile>(storageKeys.profile, defaultProfile);
  const hydrated = useHydrated();

  return (
    <SettingsCard
      description="Panelde görünen kullanıcı bilgilerinizi güncelleyin."
      icon={UserRound}
      title="Profil bilgileri"
    >
      <ProfileForm initial={{ ...defaultProfile, ...profile }} key={hydrated ? "client" : "server"} onSave={setProfile} />
    </SettingsCard>
  );
}

function ProfileForm({ initial, onSave }: { initial: Profile; onSave: (value: Profile) => void }) {
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [notice, showNotice] = useNotice();
  const errors = {
    firstName: form.firstName.trim() ? "" : "Ad zorunludur.",
    lastName: form.lastName.trim() ? "" : "Soyad zorunludur.",
    email: emailPattern.test(form.email.trim()) ? "" : "Geçerli bir e-posta adresi girin.",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = submitted ? errors : { firstName: "", lastName: "", email: "" };
  const setField = (key: keyof Profile, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    setSubmitted(true);
    if (hasErrors) return;
    onSave({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    showNotice("Profil bilgileri kaydedildi.");
  };

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={shown.firstName} label="Ad" required>
          <Input
            autoComplete="given-name"
            invalid={Boolean(shown.firstName)}
            onChange={(event) => setField("firstName", event.target.value)}
            value={form.firstName}
          />
        </Field>
        <Field error={shown.lastName} label="Soyad" required>
          <Input
            autoComplete="family-name"
            invalid={Boolean(shown.lastName)}
            onChange={(event) => setField("lastName", event.target.value)}
            value={form.lastName}
          />
        </Field>
        <Field className="sm:col-span-2" error={shown.email} label="Kurumsal e-posta" required>
          <Input
            autoComplete="email"
            invalid={Boolean(shown.email)}
            onChange={(event) => setField("email", event.target.value)}
            type="email"
            value={form.email}
          />
        </Field>
        <Field hint="Görev bilgisi rol yönetiminden belirlenir." label="Görev">
          <Input disabled readOnly value={form.role} />
        </Field>
        <Field label="Telefon">
          <Input
            autoComplete="tel"
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="+90 5xx xxx xx xx"
            type="tel"
            value={form.phone}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
        {notice ? (
          <Alert icon={Check}>{notice}</Alert>
        ) : (
          <p className="text-xs text-muted">Bilgiler bu cihazda saklanır ve panel başlığında kullanılır.</p>
        )}
        <Button className="sm:shrink-0" type="submit">
          <Save /> Profili kaydet
        </Button>
      </div>
    </form>
  );
}
