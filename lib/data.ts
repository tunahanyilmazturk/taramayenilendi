"use client";

/*
  Typed hooks over the localStorage records. Each hook wraps a single key, so pages keep their
  own data set but read/write through one place. All hooks are safe during SSR (they return the
  demo defaults until the client hydrates).
*/

import { useCallback, useMemo } from "react";
import {
  demoCompanies,
  demoEquipment,
  demoOffers,
  demoRoles,
  demoScreenings,
  demoSectors,
  demoTeam,
  demoTestCategories,
  demoTests,
  type Equipment,
  type Screening,
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
  const [raw, setSectors] = useStoredState<string[]>(storageKeys.sectors, demoSectors);
  return [Array.isArray(raw) ? raw : demoSectors, setSectors] as const;
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

export function useEquipment() {
  const [raw, setEquipment] = useStoredState<Equipment[]>(storageKeys.equipment, demoEquipment);
  const equipment = useMemo(() => {
    const normalized = (Array.isArray(raw) ? raw : demoEquipment).map((item) => ({
      ...item,
      kind: item.kind ?? "Ekipman",
    }));
    return normalized;
  }, [raw]);
  const updateEquipment = useCallback(
    (next: Equipment[] | ((current: Equipment[]) => Equipment[])) => {
      setEquipment((current) => {
        const safeCurrent = Array.isArray(current) ? current : demoEquipment;
        return typeof next === "function" ? next(safeCurrent) : next;
      });
    },
    [setEquipment],
  );
  return [equipment, updateEquipment] as const;
}

export function useScreenings() {
  const [raw, setScreenings] = useStoredState<Screening[]>(storageKeys.screenings, demoScreenings);
  const updateScreenings = useCallback(
    (next: Screening[] | ((current: Screening[]) => Screening[])) => {
      setScreenings((current) => {
        const safeCurrent = Array.isArray(current) ? current : demoScreenings;
        return typeof next === "function" ? next(safeCurrent) : next;
      });
    },
    [setScreenings],
  );
  return [Array.isArray(raw) ? raw : demoScreenings, updateScreenings] as const;
}

export function useTestCategories() {
  const [raw, setCategories] = useStoredState<string[]>(storageKeys.testCategories, demoTestCategories);
  return [Array.isArray(raw) ? raw : demoTestCategories, setCategories] as const;
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
  const [raw, setRoles] = useStoredState<Role[]>(storageKeys.roles, demoRoles);
  return [Array.isArray(raw) ? raw : demoRoles, setRoles] as const;
}

export type Organization = {
  title: string;
  shortName: string;
  taxNumber: string;
  licenseNumber: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  logoDataUrl?: string;
  stampDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export const defaultOrganization: Organization = {
  title: "HanTech OSGB",
  shortName: "HanTech",
  taxNumber: "",
  licenseNumber: "",
  email: "info@hantech.com.tr",
  phone: "+90 212 000 00 00",
  city: "İstanbul",
  district: "Ataşehir",
  address: "İçerenköy Mah. HanTech Plaza, Ataşehir / İstanbul",
  logoDataUrl: "",
  primaryColor: "#256da8",
  secondaryColor: "#123d56",
};

export function useOrganization() {
  return useStoredState<Organization>(storageKeys.organization, defaultOrganization);
}

export type CoverLetterTemplate = {
  id: number;
  name: string;
  description: string;
  icon: string;
  body: string;
  builtIn?: boolean;
};

export type ConditionTemplate = {
  id: number;
  title: string;
  body: string;
  builtIn?: boolean;
};

export function useCoverLetterTemplates(
  defaults: CoverLetterTemplate[],
): readonly [
  CoverLetterTemplate[],
  (next: CoverLetterTemplate[] | ((current: CoverLetterTemplate[]) => CoverLetterTemplate[])) => void,
] {
  return useStoredState<CoverLetterTemplate[]>(storageKeys.coverLetterTemplates, defaults);
}

export function useConditionTemplates(
  defaults: ConditionTemplate[],
): readonly [
  ConditionTemplate[],
  (next: ConditionTemplate[] | ((current: ConditionTemplate[]) => ConditionTemplate[])) => void,
] {
  return useStoredState<ConditionTemplate[]>(storageKeys.conditionTemplates, defaults);
}
