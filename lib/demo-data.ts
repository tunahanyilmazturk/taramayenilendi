/*
  Shared domain types and demo records. Every module reads its defaults from here so the
  Firmalar list, Firma detayı, Teklifler and the Teklif sihirbazı always agree with each other.
*/

export type ContractStatus = "Aktif" | "Yenileniyor" | "Pasif";
export type Company = {
  id: number;
  name: string;
  sector: string;
  city: string;
  district: string;
  contact: string;
  email: string;
  phone: string;
  employees: number;
  screenings: number;
  contract: ContractStatus;
  contractEnd: string;
  lastScreening: string;
};
export const contractStatuses: ContractStatus[] = ["Aktif", "Yenileniyor", "Pasif"];

export type OfferStatus = "Taslak" | "Gönderildi" | "Görüşülüyor" | "Onaylandı" | "Reddedildi" | "Süresi doldu";
export type OfferType = "Periyodik muayene" | "İşe giriş muayenesi";
export type OfferLine = { testId: number; name: string; quantity: number; unitPrice: number };
export type Offer = {
  id: number;
  number: string;
  companyId: number | null;
  company: string;
  contact: string;
  title: string;
  offerType?: OfferType;
  status: OfferStatus;
  total: number;
  validUntil: string;
  createdAt: string;
  items: number;
  lines?: OfferLine[];
  notes?: string;
  discount?: number;
  tax?: number;
};
export const offerStatuses: OfferStatus[] = [
  "Taslak",
  "Gönderildi",
  "Görüşülüyor",
  "Onaylandı",
  "Reddedildi",
  "Süresi doldu",
];
export const offerTypes: OfferType[] = ["Periyodik muayene", "İşe giriş muayenesi"];

export type TestItem = { id: number; code: string; name: string; category: string; price: number; active: boolean };

export type TeamMember = {
  id: number;
  name: string;
  profession: string;
  email: string;
  phone: string;
  role: string;
  account: boolean;
  active: boolean;
};
export type Role = { name: string; description: string; permissions: string[]; system?: boolean };

export const demoCompanies: Company[] = [
  {
    id: 1,
    name: "Artemis Otomotiv A.Ş.",
    sector: "Otomotiv",
    city: "Kocaeli",
    district: "Gebze",
    contact: "Murat Şahin",
    email: "murat.sahin@artemis.com.tr",
    phone: "+90 262 000 00 00",
    employees: 248,
    screenings: 18,
    contract: "Aktif",
    contractEnd: "31 Ara 2026",
    lastScreening: "02 Eyl 2026",
  },
  {
    id: 2,
    name: "Mavi Hat Lojistik",
    sector: "Lojistik",
    city: "İstanbul",
    district: "Tuzla",
    contact: "Büşra Aydın",
    email: "busra.aydin@mavihat.com",
    phone: "+90 216 000 00 00",
    employees: 126,
    screenings: 12,
    contract: "Aktif",
    contractEnd: "18 Mar 2027",
    lastScreening: "28 Ağu 2026",
  },
  {
    id: 3,
    name: "Nova Gıda Üretim",
    sector: "Gıda üretimi",
    city: "Tekirdağ",
    district: "Çerkezköy",
    contact: "Emre Yıldız",
    email: "emre.yildiz@novagida.com",
    phone: "+90 282 000 00 00",
    employees: 384,
    screenings: 24,
    contract: "Yenileniyor",
    contractEnd: "15 Eyl 2026",
    lastScreening: "20 Ağu 2026",
  },
  {
    id: 4,
    name: "Eksen Yapı Proje",
    sector: "İnşaat",
    city: "İstanbul",
    district: "Kadıköy",
    contact: "Zeynep Koç",
    email: "zeynep.koc@eksenyapi.com",
    phone: "+90 216 000 00 00",
    employees: 76,
    screenings: 7,
    contract: "Aktif",
    contractEnd: "07 Haz 2027",
    lastScreening: "12 Ağu 2026",
  },
  {
    id: 5,
    name: "Meridyen Tekstil",
    sector: "Tekstil",
    city: "Bursa",
    district: "Nilüfer",
    contact: "Can Erdem",
    email: "can.erdem@meridyen.com.tr",
    phone: "+90 224 000 00 00",
    employees: 214,
    screenings: 16,
    contract: "Pasif",
    contractEnd: "02 Tem 2026",
    lastScreening: "15 Tem 2026",
  },
];
export const demoSectors = ["Otomotiv", "Lojistik", "Gıda üretimi", "İnşaat", "Tekstil"];

export const demoTests: TestItem[] = [
  { id: 1, code: "RAD-001", name: "Akciğer grafisi", category: "Radyoloji", price: 350, active: true },
  { id: 2, code: "ODY-001", name: "Odyometri", category: "İşitme", price: 180, active: true },
  { id: 3, code: "SOL-001", name: "Solunum fonksiyon testi", category: "Solunum", price: 220, active: true },
  { id: 4, code: "LAB-001", name: "Hemogram", category: "Laboratuvar", price: 160, active: true },
  { id: 5, code: "MUY-001", name: "Göz muayenesi", category: "Muayene", price: 200, active: false },
];
export const demoTestCategories = ["Radyoloji", "İşitme", "Solunum", "Laboratuvar", "Muayene"];

export const demoOffers: Offer[] = [
  {
    id: 1,
    number: "TEK-2026-004",
    companyId: 1,
    company: "Artemis Otomotiv A.Ş.",
    contact: "Murat Şahin",
    title: "2026 periyodik sağlık taraması",
    offerType: "Periyodik muayene",
    status: "Görüşülüyor",
    total: 86800,
    validUntil: "30 Eyl 2026",
    createdAt: "26 Ağu 2026",
    items: 4,
  },
  {
    id: 2,
    number: "TEK-2026-003",
    companyId: 3,
    company: "Nova Gıda Üretim",
    contact: "Emre Yıldız",
    title: "Yıllık OSGB hizmet paketi",
    offerType: "Periyodik muayene",
    status: "Gönderildi",
    total: 126500,
    validUntil: "15 Eyl 2026",
    createdAt: "22 Ağu 2026",
    items: 6,
  },
  {
    id: 3,
    number: "TEK-2026-002",
    companyId: 2,
    company: "Mavi Hat Lojistik",
    contact: "Büşra Aydın",
    title: "Mobil tarama hizmeti",
    offerType: "Periyodik muayene",
    status: "Onaylandı",
    total: 44100,
    validUntil: "05 Eyl 2026",
    createdAt: "14 Ağu 2026",
    items: 3,
  },
  {
    id: 4,
    number: "TEK-2026-001",
    companyId: 4,
    company: "Eksen Yapı Proje",
    contact: "Zeynep Koç",
    title: "İşe giriş sağlık taraması",
    offerType: "İşe giriş muayenesi",
    status: "Taslak",
    total: 22800,
    validUntil: "20 Eyl 2026",
    createdAt: "09 Ağu 2026",
    items: 2,
  },
];

/** Next sequential offer number for the current year, immune to deletions. */
export function nextOfferNumber(offers: Offer[]) {
  const year = new Date().getFullYear();
  const prefix = `TEK-${year}-`;
  const highest = offers.reduce((max, offer) => {
    const sequence = offer.number.startsWith(prefix) ? Number(offer.number.slice(prefix.length)) : 0;
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export const professions = [
  "İşyeri hekimi",
  "Hemşire",
  "Tıbbi sekreter",
  "Radyoloji teknikeri",
  "Odyometrist",
  "Laborant",
  "Diğer",
];

export const panelPermissions = [
  "Genel Bakış",
  "Firmalar",
  "Personeller",
  "Taramalar",
  "Teklifler",
  "İstatistikler",
  "Takvim",
];
export const settingsPermissions = [
  "Kurum Bilgileri",
  "Ekip",
  "Rol ve Kullanıcı Yönetimi",
  "Test Kataloğu",
  "Görünüm",
  "Bildirimler",
  "Güvenlik",
];
export const demoRoles: Role[] = [
  {
    name: "Yönetici",
    description: "Tüm modüllere ve ayarlara erişim",
    permissions: [...panelPermissions, ...settingsPermissions],
    system: true,
  },
  {
    name: "Operasyon sorumlusu",
    description: "Saha operasyonlarının günlük yönetimi",
    permissions: [...panelPermissions],
  },
  {
    name: "Saha personeli",
    description: "Kendisine atanan taramaları görüntüleme",
    permissions: ["Genel Bakış", "Taramalar"],
  },
];

export const demoTeam: TeamMember[] = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    profession: "Diğer",
    email: "ahmet.yilmaz@hantech.com.tr",
    phone: "+90 532 000 00 00",
    role: "Yönetici",
    account: true,
    active: true,
  },
  {
    id: 2,
    name: "Dr. Elif Kaya",
    profession: "İşyeri hekimi",
    email: "elif.kaya@hantech.com.tr",
    phone: "",
    role: "Saha personeli",
    account: true,
    active: true,
  },
  {
    id: 3,
    name: "Seda Demir",
    profession: "Hemşire",
    email: "seda.demir@hantech.com.tr",
    phone: "",
    role: "Saha personeli",
    account: true,
    active: true,
  },
];

export const demoUser = {
  name: "Ahmet Yılmaz",
  email: "demo@hantech.com",
  password: "HanTechDemo2026!",
  role: "Yönetici",
};

/** Normalises records stored by earlier versions of the app (e.g. "Kocaeli · Gebze" city strings). */
export function normalizeCompany(input: Partial<Company> & { id: number; name: string }): Company {
  const [city = "", district = ""] = input.district === undefined ? (input.city ?? "").split(" · ") : [input.city ?? "", input.district];
  return {
    id: input.id,
    name: input.name,
    sector: input.sector ?? "",
    city,
    district,
    contact: input.contact ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    employees: Number(input.employees) || 0,
    screenings: Number(input.screenings) || 0,
    contract: input.contract ?? "Aktif",
    contractEnd: input.contractEnd ?? "",
    lastScreening: input.lastScreening ?? "Henüz yok",
  };
}

export const companyLocation = (company: Pick<Company, "city" | "district">) =>
  [company.city, company.district].filter(Boolean).join(" · ");
