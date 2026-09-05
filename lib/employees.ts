export type EmployeeStatus = "Aktif" | "Pasif";
export type ResultStatus = "Bekliyor" | "Sonuç var" | "Eksik";

export type Employee = {
  id: number;
  companyId: number;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  status: EmployeeStatus;
  lastResult: ResultStatus;
};

export type EmployeeForm = Omit<Employee, "id">;

export const emptyEmployee: EmployeeForm = {
  companyId: 0,
  name: "",
  department: "",
  position: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  status: "Aktif",
  lastResult: "Bekliyor",
};

export const demoEmployees: Employee[] = [
  { id: 1, companyId: 1, name: "Murat Şahin", department: "Üretim", position: "Üretim sorumlusu", email: "murat.sahin@artemis.com.tr", phone: "+90 532 000 11 22", status: "Aktif", lastResult: "Sonuç var" },
  { id: 2, companyId: 1, name: "Ayşe Yıldız", department: "Kalite", position: "Kalite uzmanı", email: "ayse.yildiz@artemis.com.tr", phone: "+90 532 000 22 33", status: "Aktif", lastResult: "Bekliyor" },
  { id: 3, companyId: 1, name: "Emre Kaya", department: "Bakım", position: "Bakım teknisyeni", email: "emre.kaya@artemis.com.tr", phone: "+90 532 000 33 44", status: "Aktif", lastResult: "Eksik" },
  { id: 4, companyId: 2, name: "Büşra Aydın", department: "Operasyon", position: "Operasyon uzmanı", email: "busra.aydin@mavihat.com.tr", phone: "+90 533 000 44 55", status: "Aktif", lastResult: "Sonuç var" },
  { id: 5, companyId: 3, name: "Emre Yıldız", department: "Üretim", position: "Vardiya amiri", email: "emre.yildiz@novagida.com.tr", phone: "+90 534 000 55 66", status: "Aktif", lastResult: "Sonuç var" },
  { id: 6, companyId: 4, name: "Zeynep Koç", department: "Proje", position: "Proje yöneticisi", email: "zeynep.koc@eksenyapi.com.tr", phone: "+90 535 000 66 77", status: "Pasif", lastResult: "Bekliyor" },
];
