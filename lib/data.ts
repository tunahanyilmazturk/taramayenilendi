"use client";

/*
  Typed hooks over the localStorage records. Each hook wraps a single key, so pages keep their
  own data set but read/write through one place. All hooks are safe during SSR (they return the
  demo defaults until the client hydrates).
*/

import { useMemo } from "react";
import {
  demoCompanies,
  demoOffers,
  demoRoles,
  demoSectors,
  demoTeam,
  demoTestCategories,
  demoTests,
  normalizeCompany,
  type Company,
  type Offer,
  type Role,
  type TeamMember,
  type TestItem,
} from "@/lib/demo-data";
import { storageKeys, useStoredState } from "@/lib/storage";

export function useCompanies() {
  const [raw, setCompanies] = useStoredState<Array<Partial<Company> & { id: number; name: string }>>(
    storageKeys.companies,
    demoCompanies,
  );
  const companies = useMemo(() => (Array.isArray(raw) ? raw.map(normalizeCompany) : demoCompanies), [raw]);
  return [companies, setCompanies as (next: Company[] | ((current: Company[]) => Company[])) => void] as const;
}

export function useSectors() {
  return useStoredState<string[]>(storageKeys.sectors, demoSectors);
}

export function useOffers() {
  const [raw, setOffers] = useStoredState<Offer[]>(storageKeys.offers, demoOffers);
  const offers = useMemo(
    () =>
      (Array.isArray(raw) ? raw : demoOffers).map((offer) => ({
        ...offer,
        companyId: offer.companyId ?? null,
        contact: offer.contact ?? "",
      })),
    [raw],
  );
  return [offers, setOffers] as const;
}

export function useTests() {
  const [raw, setTests] = useStoredState<TestItem[]>(storageKeys.tests, demoTests);
  const tests = useMemo(() => (Array.isArray(raw) ? raw : demoTests), [raw]);
  return [tests, setTests] as const;
}

export function useTestCategories() {
  return useStoredState<string[]>(storageKeys.testCategories, demoTestCategories);
}

export function useTeam() {
  const [raw, setTeam] = useStoredState<TeamMember[]>(storageKeys.team, demoTeam);
  const team = useMemo(
    () =>
      (Array.isArray(raw) ? raw : demoTeam).map((member, index) => ({
        ...member,
        id: member.id ?? index + 1,
        phone: member.phone ?? "",
        role: member.role ?? "Saha personeli",
        active: member.active ?? true,
      })),
    [raw],
  );
  return [team, setTeam] as const;
}

export function useRoles() {
  return useStoredState<Role[]>(storageKeys.roles, demoRoles);
}
