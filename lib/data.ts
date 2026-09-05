"use client";

/*
  Typed hooks over the localStorage records. Each hook wraps a single key, so pages keep their
  own data set but read/write through one place. All hooks are safe during SSR (they return the
  demo defaults until the client hydrates).
*/

import { useCallback, useMemo } from "react";
import {
  demoCompanies,
  demoOffers,
  demoRoles,
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

const demoEquipment: Equipment[] = [
  {
    id: 1,
    kind: "Ekipman",
    name: "Odyometre",
    type: "İşitme ölçüm cihazı",
    brandModel: "Interacoustics AD226",
    serialNumber: "ODY-2024-001",
    status: "Kullanımda",
    location: "Mobil araç 01",
    responsible: "Ayşe Demir",
    calibrationDate: "15 Oca 2026",
    nextCalibration: "15 Oca 2027",
    lastMaintenance: "10 Tem 2026",
    notes: "Kulaklık seti eksiksiz.",
  },
  {
    id: 2,
    kind: "Ekipman",
    name: "Spirometre",
    type: "Solunum ölçüm cihazı",
    brandModel: "MIR Spirobank II",
    serialNumber: "SPI-2024-014",
    status: "Kalibrasyon bekliyor",
    location: "Merkez depo",
    responsible: "Mehmet Kaya",
    calibrationDate: "02 Eyl 2025",
    nextCalibration: "02 Eyl 2026",
    lastMaintenance: "20 Haz 2026",
    notes: "Kalibrasyon sertifikası yenilenecek.",
  },
  {
    id: 3,
    kind: "Ekipman",
    name: "EKG cihazı",
    type: "Kardiyoloji cihazı",
    brandModel: "Edan SE-1200",
    serialNumber: "EKG-2023-008",
    status: "Bakımda",
    location: "Teknik servis",
    responsible: "Teknik ekip",
    calibrationDate: "12 Mar 2026",
    nextCalibration: "12 Mar 2027",
    lastMaintenance: "28 Ağu 2026",
    notes: "Batarya değişimi bekleniyor.",
  },
  {
    id: 4,
    kind: "Ekipman",
    name: "Röntgen cihazı",
    type: "Görüntüleme cihazı",
    brandModel: "Carestream Vita Flex",
    serialNumber: "RNT-2022-003",
    status: "Kullanımda",
    location: "Mobil araç 02",
    responsible: "Can Erdem",
    calibrationDate: "18 Nis 2026",
    nextCalibration: "18 Nis 2027",
    lastMaintenance: "05 Ağu 2026",
    notes: "Yıllık bakım planına dahil.",
  },
  {
    id: 5,
    kind: "Ekipman",
    name: "Tansiyon ölçer seti",
    type: "Muayene ekipmanı",
    brandModel: "Omron HBP-1320",
    serialNumber: "TEN-2025-021",
    status: "Kullanımda",
    location: "Merkez depo",
    responsible: "Zeynep Koç",
    calibrationDate: "07 Haz 2026",
    nextCalibration: "07 Haz 2027",
    lastMaintenance: "01 Eyl 2026",
    notes: "3 manşet mevcut.",
  },
  {
    id: 6,
    kind: "Mobil araç",
    name: "Mobil sağlık aracı 01",
    type: "Mobil tarama aracı",
    brandModel: "Ford Transit Custom",
    serialNumber: "Şasi: WF0YXXTT",
    status: "Kullanımda",
    location: "Kocaeli saha bölgesi",
    responsible: "Ayşe Demir",
    calibrationDate: "",
    nextCalibration: "",
    lastMaintenance: "18 Ağu 2026",
    notes: "Günlük saha taramalarında kullanılır.",
    plateNumber: "41 HNT 001",
    inspectionDate: "20 May 2027",
    insuranceEnd: "12 Oca 2027",
  },
  {
    id: 7,
    kind: "Mobil araç",
    name: "Mobil sağlık aracı 02",
    type: "Mobil tarama aracı",
    brandModel: "Mercedes Sprinter",
    serialNumber: "Şasi: WDB906",
    status: "Bakımda",
    location: "Teknik servis",
    responsible: "Teknik ekip",
    calibrationDate: "",
    nextCalibration: "",
    lastMaintenance: "01 Eyl 2026",
    notes: "İç donanım kontrolü sürüyor.",
    plateNumber: "34 HNT 002",
    inspectionDate: "08 Kas 2026",
    insuranceEnd: "30 Mar 2027",
  },
];

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

const demoScreenings: Screening[] = [
  {
    id: 1,
    title: "Artemis Otomotiv yıllık sağlık taraması",
    companyId: 1,
    company: "Artemis Otomotiv A.Ş.",
    date: "05 Eyl 2026",
    time: "09:30",
    location: "Gebze Organize Sanayi",
    team: "Ayşe Demir, Mehmet Kaya",
    vehicle: "Mobil sağlık aracı 01",
    participants: 248,
    completed: 0,
    status: "Planlandı",
    notes: "Sabah vardiyası öncelikli.",
  },
  {
    id: 2,
    title: "Mavi Hat işe giriş taraması",
    companyId: 2,
    company: "Mavi Hat Lojistik",
    date: "08 Eyl 2026",
    time: "10:00",
    location: "Tuzla Depo Merkezi",
    team: "Zeynep Koç",
    vehicle: "Mobil sağlık aracı 02",
    participants: 126,
    completed: 42,
    status: "Devam ediyor",
    notes: "İkinci vardiya öğleden sonra.",
  },
  {
    id: 3,
    title: "Nova Gıda periyodik muayene",
    companyId: 3,
    company: "Nova Gıda Üretim",
    date: "12 Eyl 2026",
    time: "08:30",
    location: "Çerkezköy Fabrika",
    team: "Can Erdem",
    vehicle: "Mobil sağlık aracı 01",
    participants: 384,
    completed: 384,
    status: "Tamamlandı",
    notes: "Raporlar hazırlanıyor.",
  },
];

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
