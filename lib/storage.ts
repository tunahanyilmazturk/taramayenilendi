"use client";

/*
  Frontend-only persistence layer. Every page keeps its own record set in localStorage
  (key prefix "hantech-"); this module centralises the read/write/subscribe plumbing so
  components can share data (e.g. Firmalar list ↔ Firma detayı ↔ Teklif sihirbazı)
  without duplicating hydration code. Swap the internals for API calls when the backend lands.
*/

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
let storageEventBound = false;

const isBrowser = () => typeof window !== "undefined";

/* One-time cleanup of keys left behind by the removed personnel/results/AI modules. */
if (isBrowser()) {
  [
    "hantech-employees",
    "hantech-result-records",
    "hantech-ai-settings",
    "hantech-personnel",
    "hantech-result-columns",
    "hantech-result-rows",
    "hantech-result-hidden-columns",
    "hantech-result-column-widths",
    "hantech-result-page-size",
    "hantech-result-cell-styles",
  ].forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* Storage unavailable: nothing to clean up. */
    }
  });
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function bindStorageEvent() {
  if (storageEventBound || !isBrowser()) return;
  storageEventBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key) emit(event.key);
  });
}

function subscribe(key: string, listener: Listener) {
  bindStorageEvent();
  const set = listeners.get(key) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
  };
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function writeStorage<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage quota or privacy mode: keep the in-memory snapshot so the UI still updates. */
    snapshots.set(key, { raw: null, value });
  }
  emit(key);
}

export function removeStorage(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  snapshots.delete(key);
  emit(key);
}

/**
 * React state that lives in localStorage. `fallback` must be a stable reference (module constant)
 * because it is returned as the server snapshot and when nothing is stored yet.
 */
export function useStoredState<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    useCallback((listener: Listener) => subscribe(key, listener), [key]),
    () => readStorage(key, fallback),
    () => fallback,
  );
  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(readStorage(key, fallback)) : next;
      writeStorage(key, resolved);
    },
    [key, fallback],
  );
  return [value, setValue] as const;
}

/** True once the component has hydrated on the client (false during SSR and the first paint). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const storageKeys = {
  session: "hantech-session",
  sidebar: "hantech-sidebar",
  density: "hantech-density",
  motion: "hantech-animations",
  companies: "hantech-companies",
  sectors: "hantech-sectors",
  offers: "hantech-offers",
  tests: "hantech-tests",
  equipment: "hantech-equipment",
  screenings: "hantech-screenings",
  testCategories: "hantech-test-categories",
  team: "hantech-team",
  personnel: "hantech-personnel",
  roles: "hantech-roles",
  notifications: "hantech-notification-preferences",
  profile: "hantech-profile",
  organization: "hantech-organization",
  coverLetterTemplates: "hantech-cover-letter-templates",
  conditionTemplates: "hantech-condition-templates",
  screeningView: "hantech-screening-view",
} as const;
