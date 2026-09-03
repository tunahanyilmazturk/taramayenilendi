"use client";

/*
  Demo-only session handling. There is no backend yet, so "login" simply records the demo
  user in localStorage and the panel layout checks for it. Replace with real auth later.
*/

import { demoUser } from "@/lib/demo-data";
import { removeStorage, storageKeys, useHydrated, useStoredState, writeStorage } from "@/lib/storage";

export type Session = { name: string; email: string; role: string; signedInAt: string };

const noSession = null;

export function useSession() {
  const [session, setSession] = useStoredState<Session | null>(storageKeys.session, noSession);
  const hydrated = useHydrated();
  return { session, hydrated, setSession };
}

export function signIn(email: string, password: string): { ok: true; session: Session } | { ok: false; error: string } {
  const normalized = email.trim().toLocaleLowerCase("tr-TR");
  if (normalized === demoUser.email && password === demoUser.password) {
    const session: Session = {
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      signedInAt: new Date().toISOString(),
    };
    writeStorage(storageKeys.session, session);
    return { ok: true, session };
  }
  return {
    ok: false,
    error: "Giriş servisi backend bağlantısı tamamlandığında aktif olacak. Şimdilik demo hesabı ile giriş yapabilirsiniz.",
  };
}

export function signOut() {
  removeStorage(storageKeys.session);
}

export function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}
