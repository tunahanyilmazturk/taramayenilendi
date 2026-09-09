/*
  Shared domain types and demo records. Every module reads its defaults from here so the
  Firmalar list, Firma detayı, Teklifler and the Teklif sihirbazı always agree with each other.
*/

export type ContractStatus = "Aktif" | "Yenileniyor" | "Pasif";
export type CompanyDocument = { id: string; name: string; size: number; type: string; dataUrl?: string; createdAt: string };
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
  notes?: string;
  contractDocuments?: CompanyDocument[];
};
export const contractStatuses: ContractStatus[] = ["Aktif", "Yenileniyor", "Pasif"];

export type OfferStatus = "Taslak" | "Gönderildi" | "Görüşülüyor" | "Onaylandı" | "Reddedildi" | "Süresi doldu";
export type OfferType = "Periyodik muayene" | "İşe giriş muayenesi";
export type OfferLine = { testId: number; name: string; quantity: number; unitPrice: number };
export type OfferRevision = { revision: number; createdAt: string; note: string; status: OfferStatus };
export type OfferActivity = {
  id: string;
  type: "created" | "revised" | "sent" | "viewed" | "responded" | "pdf";
  title: string;
  description: string;
  createdAt: string;
};
export type OfferAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  createdAt: string;
};
export type OfferReminder = { date: string; note: string; completed?: boolean };
export type OfferResponse = { status: "Onaylandı" | "Reddedildi" | "Görüşülüyor"; note: string; respondedAt: string };
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
  paymentTerms?: string;
  deliveryDays?: number;
  coverLetterId?: number | null;
  coverLetterText?: string;
  terms?: number[];
  conditionsText?: string;
  revision?: number;
  revisionHistory?: OfferRevision[];
  shareToken?: string;
  signatureName?: string;
  activities?: OfferActivity[];
  attachments?: OfferAttachment[];
  reminder?: OfferReminder;
  emailStatus?: "Bekliyor" | "Hazırlandı" | "Gönderildi" | "Görüntülendi";
  customerResponse?: OfferResponse;
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
export type EquipmentStatus = "Kullanımda" | "Bakımda" | "Kalibrasyon bekliyor" | "Pasif";
export type EquipmentKind = "Ekipman" | "Mobil araç";
export type Equipment = {
  id: number;
  kind: EquipmentKind;
  name: string;
  type: string;
  brandModel: string;
  serialNumber: string;
  status: EquipmentStatus;
  location: string;
  responsible: string;
  calibrationDate: string;
  nextCalibration: string;
  lastMaintenance: string;
  notes: string;
  plateNumber?: string;
  inspectionDate?: string;
  insuranceEnd?: string;
};
export const equipmentStatuses: EquipmentStatus[] = ["Kullanımda", "Bakımda", "Kalibrasyon bekliyor", "Pasif"];
export type ScreeningStatus = "Planlandı" | "Hazırlanıyor" | "Devam ediyor" | "Tamamlandı" | "İptal";
export type Screening = {
  id: number;
  title: string;
  companyId: number;
  company: string;
  screeningType?: "Periyodik sağlık taraması" | "İşe giriş muayenesi";
  testIds?: number[];
  testLines?: Array<{ testId: number; name: string; category: string; quantity: number; unitPrice: number }>;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  location: string;
  team: string;
  teamMembers?: string[];
  vehicle: string;
  equipmentIds?: number[];
  participants: number;
  completed: number;
  status: ScreeningStatus;
  notes: string;
  contact?: string;
  email?: string;
  discount?: number | string;
  tax?: number | string;
  paymentTerms?: string;
  deliveryDays?: number | string;
  showPriceOnPdf?: boolean;
  coverLetter?: string;
  conditions?: string;
  attachments?: OfferAttachment[];
};
export const screeningStatuses: ScreeningStatus[] = [
  "Planlandı",
  "Hazırlanıyor",
  "Devam ediyor",
  "Tamamlandı",
  "İptal",
];

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
    phone: "+90 262 648 21 00",
    employees: 248,
    screenings: 18,
    contract: "Aktif",
    contractEnd: "31 Ara 2026",
    lastScreening: "12 Oca 2026",
  },
  {
    id: 2,
    name: "Mavi Hat Lojistik",
    sector: "Lojistik",
    city: "İstanbul",
    district: "Tuzla",
    contact: "Büşra Aydın",
    email: "busra.aydin@mavihat.com.tr",
    phone: "+90 216 395 44 12",
    employees: 126,
    screenings: 12,
    contract: "Aktif",
    contractEnd: "18 Mar 2027",
    lastScreening: "08 Oca 2026",
  },
  {
    id: 3,
    name: "Nova Gıda Üretim",
    sector: "Gıda üretimi",
    city: "Tekirdağ",
    district: "Çerkezköy",
    contact: "Emre Yıldız",
    email: "emre.yildiz@novagida.com",
    phone: "+90 282 716 33 09",
    employees: 384,
    screenings: 24,
    contract: "Yenileniyor",
    contractEnd: "15 Şub 2026",
    lastScreening: "22 Ara 2025",
  },
  {
    id: 4,
    name: "Eksen Yapı Proje",
    sector: "İnşaat",
    city: "İstanbul",
    district: "Maltepe",
    contact: "Zeynep Koç",
    email: "zeynep.koc@eksenyapi.com.tr",
    phone: "+90 216 305 78 41",
    employees: 76,
    screenings: 7,
    contract: "Aktif",
    contractEnd: "07 Haz 2027",
    lastScreening: "15 Ara 2025",
  },
  {
    id: 5,
    name: "Meridyen Tekstil",
    sector: "Tekstil",
    city: "Bursa",
    district: "Nilüfer",
    contact: "Can Erdem",
    email: "can.erdem@meridyen.com.tr",
    phone: "+90 224 411 28 67",
    employees: 214,
    screenings: 16,
    contract: "Pasif",
    contractEnd: "02 Tem 2025",
    lastScreening: "28 May 2025",
  },
  {
    id: 6,
    name: "Bosphorus Teknoloji A.Ş.",
    sector: "Teknoloji",
    city: "İstanbul",
    district: "Maslak",
    contact: "Selin Aksoy",
    email: "selin.aksoy@bosphorus.tech",
    phone: "+90 212 706 18 00",
    employees: 92,
    screenings: 6,
    contract: "Aktif",
    contractEnd: "30 Eyl 2026",
    lastScreening: "05 Oca 2026",
  },
  {
    id: 7,
    name: "Anadolu Kimya Sanayi",
    sector: "Kimya",
    city: "Kocaeli",
    district: "Dilovası",
    contact: "Hakan Demir",
    email: "hakan.demir@anadolukimya.com.tr",
    phone: "+90 262 754 12 33",
    employees: 312,
    screenings: 22,
    contract: "Aktif",
    contractEnd: "22 Kas 2026",
    lastScreening: "18 Oca 2026",
  },
  {
    id: 8,
    name: "Ege Pak Ambalaj",
    sector: "Ambalaj",
    city: "İzmir",
    district: "AOSB",
    contact: "Pınar Korkmaz",
    email: "pinar.korkmaz@egepak.com.tr",
    phone: "+90 232 376 87 20",
    employees: 158,
    screenings: 11,
    contract: "Yenileniyor",
    contractEnd: "28 Şub 2026",
    lastScreening: "03 Oca 2026",
  },
  {
    id: 9,
    name: "Marmara Metal Döküm",
    sector: "Metal",
    city: "Bursa",
    district: "Demirtaş OSB",
    contact: "Burak Aytemur",
    email: "burak.aytemur@marmarametal.com",
    phone: "+90 224 261 19 55",
    employees: 187,
    screenings: 14,
    contract: "Aktif",
    contractEnd: "10 Ağu 2026",
    lastScreening: "11 Oca 2026",
  },
  {
    id: 10,
    name: "Akdeniz Sağlık Hizmetleri",
    sector: "Sağlık",
    city: "Antalya",
    district: "Muratpaşa",
    contact: "Derya Öztürk",
    email: "derya.ozturk@akdenizsaglik.com",
    phone: "+90 242 314 56 78",
    employees: 64,
    screenings: 5,
    contract: "Aktif",
    contractEnd: "14 May 2026",
    lastScreening: "20 Ara 2025",
  },
  {
    id: 11,
    name: "Çukurova Plastik",
    sector: "Plastik",
    city: "Adana",
    district: "Seyhan",
    contact: "Mustafa Çelik",
    email: "mustafa.celik@cukurovaplastik.com",
    phone: "+90 322 459 23 10",
    employees: 143,
    screenings: 10,
    contract: "Pasif",
    contractEnd: "15 Eyl 2025",
    lastScreening: "12 Eyl 2025",
  },
  {
    id: 12,
    name: "Trakya Enerji Üretim",
    sector: "Enerji",
    city: "Edirne",
    district: "Ennez",
    contact: "Gizem Yalçın",
    email: "gizem.yalcin@trakyenerji.com",
    phone: "+90 284 713 09 44",
    employees: 205,
    screenings: 15,
    contract: "Aktif",
    contractEnd: "03 Eki 2026",
    lastScreening: "07 Oca 2026",
  },
  {
    id: 13,
    name: "Karadeniz Mobilya Sanayi",
    sector: "Mobilya",
    city: "Trabzon",
    district: "Arsin OSB",
    contact: "Tolga Yılmaz",
    email: "tolga.yilmaz@karadenizmobilya.com",
    phone: "+90 462 331 78 12",
    employees: 98,
    screenings: 8,
    contract: "Yenileniyor",
    contractEnd: "10 Nis 2026",
    lastScreening: "25 Ara 2025",
  },
  {
    id: 14,
    name: "Güney Kauçuk Üretim",
    sector: "Kauçuk",
    city: "Gaziantep",
    district: "Şehitkamil",
    contact: "Esra Polat",
    email: "esra.polat@guneykaucuk.com",
    phone: "+90 342 235 67 89",
    employees: 176,
    screenings: 13,
    contract: "Aktif",
    contractEnd: "19 Tem 2026",
    lastScreening: "14 Oca 2026",
  },
  {
    id: 15,
    name: "Boğaziçi Tarım Makineleri",
    sector: "Tarım",
    city: "Konya",
    district: "Organize Sanayi",
    contact: "Recep Kara",
    email: "recep.kara@bogazicitarim.com",
    phone: "+90 332 234 11 50",
    employees: 121,
    screenings: 9,
    contract: "Pasif",
    contractEnd: "20 Nis 2025",
    lastScreening: "18 Mar 2025",
  },
];
export const demoSectors = [
  "Otomotiv",
  "Lojistik",
  "Gıda üretimi",
  "İnşaat",
  "Tekstil",
  "Teknoloji",
  "Kimya",
  "Ambalaj",
  "Metal",
  "Sağlık",
  "Plastik",
  "Enerji",
  "Mobilya",
  "Kauçuk",
  "Tarım",
];

export const demoTests: TestItem[] = [
  // Radyoloji
  { id: 1, code: "RAD-001", name: "Akciğer grafisi", category: "Radyoloji", price: 350, active: true },
  { id: 6, code: "RAD-002", name: "Lomber grafisi", category: "Radyoloji", price: 380, active: true },
  { id: 7, code: "RAD-003", name: "El bileği grafisi", category: "Radyoloji", price: 280, active: true },
  // İşitme
  { id: 2, code: "ODY-001", name: "Odyometri", category: "İşitme", price: 180, active: true },
  // Solunum
  { id: 3, code: "SOL-001", name: "Solunum fonksiyon testi", category: "Solunum", price: 220, active: true },
  // Laboratuvar — Kan testleri
  { id: 4, code: "LAB-001", name: "Hemogram (Tam kan sayımı)", category: "Laboratuvar", price: 160, active: true },
  { id: 8, code: "LAB-002", name: "Açlık kan şekeri", category: "Laboratuvar", price: 90, active: true },
  { id: 9, code: "LAB-003", name: "Tokluk kan şekeri", category: "Laboratuvar", price: 90, active: true },
  { id: 10, code: "LAB-004", name: "HbA1c (Üç aylık kan şekeri)", category: "Laboratuvar", price: 220, active: true },
  { id: 11, code: "LAB-005", name: "Lipid profili (Kolesterol)", category: "Laboratuvar", price: 280, active: true },
  { id: 12, code: "LAB-006", name: "Karaciğer fonksiyon testleri", category: "Laboratuvar", price: 240, active: true },
  { id: 13, code: "LAB-007", name: "Böbrek fonksiyon testleri", category: "Laboratuvar", price: 200, active: true },
  {
    id: 14,
    code: "LAB-008",
    name: "Tiroid fonksiyon testleri (TSH, T3, T4)",
    category: "Laboratuvar",
    price: 320,
    active: true,
  },
  { id: 15, code: "LAB-009", name: "Vitamin B12", category: "Laboratuvar", price: 180, active: true },
  { id: 16, code: "LAB-010", name: "Vitamin D", category: "Laboratuvar", price: 200, active: true },
  { id: 17, code: "LAB-011", name: "Demir ve ferritin", category: "Laboratuvar", price: 150, active: true },
  { id: 18, code: "LAB-012", name: "Sedimantasyon (ESR)", category: "Laboratuvar", price: 80, active: true },
  { id: 19, code: "LAB-013", name: "CRP (C-reaktif protein)", category: "Laboratuvar", price: 120, active: true },
  {
    id: 20,
    code: "LAB-014",
    name: "Hepatit B yüzey antijeni (HBsAg)",
    category: "Laboratuvar",
    price: 140,
    active: true,
  },
  { id: 21, code: "LAB-015", name: "Hepatit C antikoru (Anti-HCV)", category: "Laboratuvar", price: 140, active: true },
  { id: 22, code: "LAB-016", name: "İdrar tahlili (Tam idrar)", category: "Laboratuvar", price: 70, active: true },
  { id: 23, code: "LAB-017", name: "Gaitada gizli kan (FOB)", category: "Laboratuvar", price: 90, active: true },
  { id: 24, code: "LAB-018", name: "Pap smear (Servikal sitoloji)", category: "Laboratuvar", price: 260, active: true },
  {
    id: 25,
    code: "LAB-019",
    name: "PSA (Prostat spesifik antijen)",
    category: "Laboratuvar",
    price: 170,
    active: true,
  },
  { id: 26, code: "LAB-020", name: "Kan grubu (ABO ve Rh)", category: "Laboratuvar", price: 60, active: true },
  { id: 27, code: "LAB-021", name: "Trombosit fonksiyon testi", category: "Laboratuvar", price: 190, active: true },
  {
    id: 28,
    code: "LAB-022",
    name: "Koagülasyon profili (PT, aPTT, INR)",
    category: "Laboratuvar",
    price: 210,
    active: true,
  },
  {
    id: 29,
    code: "LAB-023",
    name: "Serum elektrolitleri (Na, K, Cl)",
    category: "Laboratuvar",
    price: 130,
    active: true,
  },
  { id: 30, code: "LAB-024", name: "Ürik asit", category: "Laboratuvar", price: 100, active: true },
  { id: 31, code: "LAB-025", name: "Beta-hCG (Gebelik testi)", category: "Laboratuvar", price: 110, active: true },
  { id: 32, code: "LAB-026", name: "Glukoz tolerans testi (OGTT)", category: "Laboratuvar", price: 180, active: true },
  { id: 33, code: "LAB-027", name: "İnsülin (Açlık)", category: "Laboratuvar", price: 150, active: true },
  { id: 34, code: "LAB-028", name: "HOMA-IR (İnsülin direnci)", category: "Laboratuvar", price: 200, active: true },
  { id: 35, code: "LAB-029", name: "LDL kolesterol", category: "Laboratuvar", price: 120, active: true },
  { id: 36, code: "LAB-030", name: "HDL kolesterol", category: "Laboratuvar", price: 120, active: true },
  { id: 37, code: "LAB-031", name: "Trigliserit", category: "Laboratuvar", price: 100, active: true },
  { id: 38, code: "LAB-032", name: "Total kolesterol", category: "Laboratuvar", price: 90, active: true },
  { id: 39, code: "LAB-033", name: "ALT (Alanin aminotransferaz)", category: "Laboratuvar", price: 80, active: true },
  { id: 40, code: "LAB-034", name: "AST (Aspartat aminotransferaz)", category: "Laboratuvar", price: 80, active: true },
  { id: 41, code: "LAB-035", name: "GGT (Gama glutamil transferaz)", category: "Laboratuvar", price: 90, active: true },
  { id: 42, code: "LAB-036", name: "ALP (Alkalin fosfataz)", category: "Laboratuvar", price: 90, active: true },
  { id: 43, code: "LAB-037", name: "Total bilirubin", category: "Laboratuvar", price: 80, active: true },
  { id: 44, code: "LAB-038", name: "Direkt bilirubin", category: "Laboratuvar", price: 90, active: true },
  { id: 45, code: "LAB-039", name: "Albumin", category: "Laboratuvar", price: 80, active: true },
  { id: 46, code: "LAB-040", name: "Total protein", category: "Laboratuvar", price: 80, active: true },
  { id: 47, code: "LAB-041", name: "Üre (BUN)", category: "Laboratuvar", price: 80, active: true },
  { id: 48, code: "LAB-042", name: "Kreatinin", category: "Laboratuvar", price: 80, active: true },
  {
    id: 49,
    code: "LAB-043",
    name: "eGFR (Tahmini glomerül filtrasyon)",
    category: "Laboratuvar",
    price: 120,
    active: true,
  },
  { id: 50, code: "LAB-044", name: "Serum kalsiyum", category: "Laboratuvar", price: 90, active: true },
  { id: 51, code: "LAB-045", name: "Serum fosfor", category: "Laboratuvar", price: 90, active: true },
  { id: 52, code: "LAB-046", name: "Serum magnezyum", category: "Laboratuvar", price: 90, active: true },
  { id: 53, code: "LAB-047", name: "TSH (Tiroid stimülan hormon)", category: "Laboratuvar", price: 140, active: true },
  { id: 54, code: "LAB-048", name: "Serbest T3", category: "Laboratuvar", price: 130, active: true },
  { id: 55, code: "LAB-049", name: "Serbest T4", category: "Laboratuvar", price: 130, active: true },
  { id: 56, code: "LAB-050", name: "Anti-TPO (Tiroid antikor)", category: "Laboratuvar", price: 180, active: true },
  { id: 57, code: "LAB-051", name: "Folat (Folik asit)", category: "Laboratuvar", price: 150, active: true },
  { id: 58, code: "LAB-052", name: "Homosistein", category: "Laboratuvar", price: 220, active: true },
  { id: 59, code: "LAB-053", name: "Transferrin", category: "Laboratuvar", price: 130, active: true },
  {
    id: 60,
    code: "LAB-054",
    name: "Total iron binding capacity (TDBK)",
    category: "Laboratuvar",
    price: 140,
    active: true,
  },
  { id: 61, code: "LAB-055", name: "Laktat dehidrogenaz (LDH)", category: "Laboratuvar", price: 110, active: true },
  { id: 62, code: "LAB-056", name: "Kreatin kinaz (CK)", category: "Laboratuvar", price: 120, active: true },
  { id: 63, code: "LAB-057", name: "Troponin I", category: "Laboratuvar", price: 280, active: true },
  { id: 64, code: "LAB-058", name: "NT-proBNP", category: "Laboratuvar", price: 350, active: true },
  { id: 65, code: "LAB-059", name: "D-Dimer", category: "Laboratuvar", price: 180, active: true },
  { id: 66, code: "LAB-060", name: "Fibrinojen", category: "Laboratuvar", price: 130, active: true },
  { id: 67, code: "LAB-061", name: "Amilaz", category: "Laboratuvar", price: 100, active: true },
  { id: 68, code: "LAB-062", name: "Lipaz", category: "Laboratuvar", price: 110, active: true },
  { id: 69, code: "LAB-063", name: "CA-125 (Tümör markırı)", category: "Laboratuvar", price: 240, active: true },
  { id: 70, code: "LAB-064", name: "CA-15-3 (Tümör markırı)", category: "Laboratuvar", price: 240, active: true },
  { id: 71, code: "LAB-065", name: "CA-19-9 (Tümör markırı)", category: "Laboratuvar", price: 240, active: true },
  {
    id: 72,
    code: "LAB-066",
    name: "CEA (Karsinoembriyonik antijen)",
    category: "Laboratuvar",
    price: 220,
    active: true,
  },
  { id: 73, code: "LAB-067", name: "AFP (Alfa-fetoprotein)", category: "Laboratuvar", price: 200, active: true },
  { id: 74, code: "LAB-068", name: "Beta-2 mikroglobulin", category: "Laboratuvar", price: 190, active: true },
  { id: 75, code: "LAB-069", name: "Kortizol (Sabah)", category: "Laboratuvar", price: 180, active: true },
  { id: 76, code: "LAB-070", name: "ACTH", category: "Laboratuvar", price: 280, active: true },
  { id: 77, code: "LAB-071", name: "Prolaktin", category: "Laboratuvar", price: 150, active: true },
  { id: 78, code: "LAB-072", name: "FSH (Folikül stimülan hormon)", category: "Laboratuvar", price: 140, active: true },
  { id: 79, code: "LAB-073", name: "LH (Lüteinizan hormon)", category: "Laboratuvar", price: 140, active: true },
  { id: 80, code: "LAB-074", name: "Estradiol (E2)", category: "Laboratuvar", price: 160, active: true },
  { id: 81, code: "LAB-075", name: "Testosteron (Total)", category: "Laboratuvar", price: 180, active: true },
  { id: 82, code: "LAB-076", name: "Serbest testosteron", category: "Laboratuvar", price: 220, active: true },
  { id: 83, code: "LAB-077", name: "Progesteron", category: "Laboratuvar", price: 160, active: true },
  { id: 84, code: "LAB-078", name: "DHEA-S", category: "Laboratuvar", price: 200, active: true },
  { id: 85, code: "LAB-079", name: "İdrar kültürü ve antibiyogram", category: "Laboratuvar", price: 130, active: true },
  { id: 86, code: "LAB-080", name: "Kan kültürü (Aerob+Anaerob)", category: "Laboratuvar", price: 180, active: true },
  { id: 87, code: "LAB-081", name: "Gaita kültürü ve parazit", category: "Laboratuvar", price: 120, active: true },
  { id: 88, code: "LAB-082", name: "Helicobacter pylori (Antigen)", category: "Laboratuvar", price: 150, active: true },
  { id: 89, code: "LAB-083", name: "Brucella antikorları", category: "Laboratuvar", price: 160, active: true },
  { id: 90, code: "LAB-084", name: "Tetanoz antikor (IgG)", category: "Laboratuvar", price: 170, active: true },
  { id: 91, code: "LAB-085", name: "Kızamık IgG antikor", category: "Laboratuvar", price: 170, active: true },
  { id: 92, code: "LAB-086", name: "Rubella (Kızamıkçık) IgG", category: "Laboratuvar", price: 170, active: true },
  { id: 93, code: "LAB-087", name: "Sitomegalovirus (CMV) IgG", category: "Laboratuvar", price: 180, active: true },
  { id: 94, code: "LAB-088", name: "Toxoplasma IgG/IgM", category: "Laboratuvar", price: 190, active: true },
  { id: 95, code: "LAB-089", name: "HIV antikor testi", category: "Laboratuvar", price: 160, active: true },
  { id: 96, code: "LAB-090", name: "Sifiliz (VDRL-RPR)", category: "Laboratuvar", price: 90, active: true },
  {
    id: 97,
    code: "LAB-091",
    name: "Ampirik ASO (Anti-streptolizin O)",
    category: "Laboratuvar",
    price: 130,
    active: true,
  },
  { id: 98, code: "LAB-092", name: "Romatoid faktör (RF)", category: "Laboratuvar", price: 130, active: true },
  { id: 99, code: "LAB-093", name: "Anti-CCP", category: "Laboratuvar", price: 200, active: true },
  { id: 100, code: "LAB-094", name: "ANA (Antinükleer antikor)", category: "Laboratuvar", price: 180, active: true },
  { id: 101, code: "LAB-095", name: "Anti-dsDNA", category: "Laboratuvar", price: 220, active: true },
  { id: 102, code: "LAB-096", name: "Complement 3 (C3)", category: "Laboratuvar", price: 170, active: true },
  { id: 103, code: "LAB-097", name: "Complement 4 (C4)", category: "Laboratuvar", price: 170, active: true },
  { id: 104, code: "LAB-098", name: "İmmünglobulin G (IgG)", category: "Laboratuvar", price: 160, active: true },
  { id: 105, code: "LAB-099", name: "İmmünglobulin M (IgM)", category: "Laboratuvar", price: 160, active: true },
  { id: 106, code: "LAB-100", name: "İmmünglobulin A (IgA)", category: "Laboratuvar", price: 160, active: true },
  { id: 107, code: "LAB-101", name: "İmmünglobulin E (IgE, Total)", category: "Laboratuvar", price: 180, active: true },
  { id: 108, code: "LAB-102", name: "Allergen panel (İnhalan)", category: "Laboratuvar", price: 450, active: true },
  { id: 109, code: "LAB-103", name: "Allergen panel (Besin)", category: "Laboratuvar", price: 480, active: true },
  {
    id: 110,
    code: "LAB-104",
    name: "Eozinofil kationik protein (ECP)",
    category: "Laboratuvar",
    price: 200,
    active: true,
  },
  { id: 111, code: "LAB-105", name: "Periferik yayma (Manuel)", category: "Laboratuvar", price: 100, active: true },
  { id: 112, code: "LAB-106", name: "Retikülosit sayımı", category: "Laboratuvar", price: 110, active: true },
  { id: 113, code: "LAB-107", name: "G6PD enzim düzeyi", category: "Laboratuvar", price: 180, active: true },
  { id: 114, code: "LAB-108", name: "Hemoglobin elektroforezi", category: "Laboratuvar", price: 250, active: true },
  { id: 115, code: "LAB-109", name: "Direct Coombs testi", category: "Laboratuvar", price: 130, active: true },
  { id: 116, code: "LAB-110", name: "İndirekt Coombs testi", category: "Laboratuvar", price: 140, active: true },
  // Muayene
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
  const [city = "", district = ""] =
    input.district === undefined ? (input.city ?? "").split(" · ") : [input.city ?? "", input.district];
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
    notes: input.notes ?? "",
    contractDocuments: Array.isArray(input.contractDocuments) ? input.contractDocuments : [],
  };
}

export const companyLocation = (company: Pick<Company, "city" | "district">) =>
  [company.city, company.district].filter(Boolean).join(" · ");

export const demoEquipment: Equipment[] = [
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

export const demoScreenings: Screening[] = [
  {
    id: 1,
    title: "Artemis Otomotiv yıllık sağlık taraması",
    companyId: 1,
    company: "Artemis Otomotiv A.Ş.",
    testIds: [1, 2, 3, 4],
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
    testIds: [1, 2, 4],
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
    testIds: [1, 3, 4, 8],
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
