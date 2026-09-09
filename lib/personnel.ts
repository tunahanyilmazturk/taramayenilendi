import { demoCompanies } from "@/lib/demo-data";

export type PersonnelStatus = "Aktif" | "İzinli" | "Pasif";

export type Personnel = {
  id: number;
  companyId: number;
  employeeNo: string;
  nationalId: string;
  name: string;
  birthDate: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  startDate: string;
  status: PersonnelStatus;
  notes: string;
  createdAt: string;
};

export const personnelStatuses: PersonnelStatus[] = ["Aktif", "İzinli", "Pasif"];

export const demoPersonnel: Personnel[] = [
  { id: 1, companyId: demoCompanies[0].id, employeeNo: "ART-0001", nationalId: "", name: "Murat Şahin", birthDate: "1987-04-12", title: "Üretim sorumlusu", department: "Üretim", email: "murat.sahin@artemis.com.tr", phone: "+90 532 100 10 01", startDate: "2021-05-10", status: "Aktif", notes: "Yıllık tarama katılımcısı.", createdAt: "2026-01-04" },
  { id: 2, companyId: demoCompanies[0].id, employeeNo: "ART-0002", nationalId: "", name: "Buse Aksoy", birthDate: "1991-08-22", title: "Kalite uzmanı", department: "Kalite", email: "buse.aksoy@artemis.com.tr", phone: "+90 532 100 10 02", startDate: "2022-09-01", status: "Aktif", notes: "", createdAt: "2026-01-04" },
  { id: 3, companyId: demoCompanies[1].id, employeeNo: "GEB-0042", nationalId: "", name: "Can Erdem", birthDate: "1983-11-05", title: "Bakım teknisyeni", department: "Bakım", email: "can.erdem@gebzeplastik.com.tr", phone: "+90 533 200 20 42", startDate: "2020-03-16", status: "Aktif", notes: "Gece vardiyası.", createdAt: "2026-01-08" },
  { id: 4, companyId: demoCompanies[1].id, employeeNo: "GEB-0043", nationalId: "", name: "Derya Koç", birthDate: "1990-02-17", title: "İnsan kaynakları uzmanı", department: "İnsan Kaynakları", email: "derya.koc@gebzeplastik.com.tr", phone: "", startDate: "2023-01-09", status: "İzinli", notes: "", createdAt: "2026-01-08" },
  { id: 5, companyId: demoCompanies[2].id, employeeNo: "NOV-0108", nationalId: "", name: "Emre Yıldız", birthDate: "1995-06-30", title: "Saha teknisyeni", department: "Saha Operasyonları", email: "emre.yildiz@novalojistik.com.tr", phone: "+90 534 300 30 08", startDate: "2024-11-04", status: "Aktif", notes: "", createdAt: "2026-02-02" },
];

export function normalizePersonnel(input: Partial<Personnel> & { id: number; companyId: number; name: string }): Personnel {
  return {
    id: input.id,
    companyId: input.companyId,
    employeeNo: input.employeeNo ?? "",
    nationalId: input.nationalId ?? "",
    name: input.name ?? "",
    birthDate: input.birthDate ?? "",
    title: input.title ?? "",
    department: input.department ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    startDate: input.startDate ?? "",
    status: input.status ?? "Aktif",
    notes: input.notes ?? "",
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function nextPersonnelId(items: Personnel[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
