"use client";

import { ArrowLeft, Check, ClipboardCheck, FileCheck2, FileUp, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { useCompanies } from "@/lib/data";
import { demoEmployees, emptyEmployee, type Employee, type ResultStatus } from "@/lib/employees";
import { useNotice } from "@/lib/hooks";
import {
  analyzeResultText,
  createResultId,
  detectScreeningType,
  extractEmployeeProfile,
  normalizeResultText,
  type ResultRecord,
} from "@/lib/results";
import { storageKeys, useStoredState } from "@/lib/storage";
import { cn, initials } from "@/lib/utils";
import {
  extractResultText,
  fileToDataUrl,
  findNameCandidatesFromFiles,
  findUnknownResultNames,
} from "./personnel-page";

type MatchResult = {
  matched: Employee[];
  missing: string[];
  unknown: string[];
  records: ResultRecord[];
  unknownRecords: ResultRecord[];
  analysisSummary: { normal: number; attention: number; unreadable: number };
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function ResultImportPage() {
  const [companies] = useCompanies();
  const [employees, setEmployees] = useStoredState<Employee[]>(storageKeys.employees, demoEmployees);
  const [, setResultRecords] = useStoredState<ResultRecord[]>(storageKeys.resultRecords, []);
  const [selectedCompany, setSelectedCompany] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [matching, setMatching] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [notice, showNotice] = useNotice();
  const safeEmployees = Array.isArray(employees) ? employees : demoEmployees;
  const companyEmployees = safeEmployees.filter((employee) => employee.companyId === selectedCompany);
  const selectedCompanyName = companies.find((company) => company.id === selectedCompany)?.name ?? "Firma seçilmedi";

  const chooseFiles = (nextFiles: FileList | null) => {
    if (!nextFiles?.length) return;
    setFiles((current) => {
      const all = [...current, ...Array.from(nextFiles)];
      return all.filter((file, index) => all.findIndex((item) => fileKey(item) === fileKey(file)) === index);
    });
    setMatchResult(null);
    setError("");
  };

  const removeFile = (file: File) => {
    setFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)));
    setMatchResult(null);
  };

  const commit = (result: MatchResult, newNames: string[]) => {
    const currentEmployees = Array.isArray(employees) ? employees : demoEmployees;
    const createdEmployeeIds = new Map<string, number>();
    const next = currentEmployees.map((employee) =>
      result.matched.some((item) => item.id === employee.id)
        ? { ...employee, lastResult: "Sonuç var" as ResultStatus }
        : employee,
    );
    newNames.forEach((name) => {
      const normalizedName = normalizeResultText(name);
      const existing = next.find(
        (employee) => employee.companyId === selectedCompany && normalizeResultText(employee.name) === normalizedName,
      );
      if (existing) {
        createdEmployeeIds.set(normalizedName, existing.id);
        return;
      }
      const profile = result.unknownRecords.find(
        (record) => normalizeResultText(record.employeeName) === normalizedName,
      )?.profile;
      const id = next.length ? Math.max(...next.map((employee) => employee.id)) + 1 : 1;
      next.push({
        ...emptyEmployee,
        id,
        companyId: selectedCompany,
        name,
        phone: profile?.phone ?? "",
        email: profile?.email ?? "",
        position: profile?.position ?? "",
        department: profile?.department ?? "",
        birthDate: profile?.birthDate ?? "",
        gender: profile?.gender ?? "",
        lastResult: "Sonuç var",
      });
      createdEmployeeIds.set(normalizedName, id);
    });
    setEmployees(next);
    const records = [...result.records, ...(newNames.length ? result.unknownRecords : [])].map((record) => {
      const employeeId = createdEmployeeIds.get(normalizeResultText(record.employeeName));
      return employeeId ? { ...record, employeeId } : record;
    });
    if (records.length) {
      setResultRecords((current) => [
        ...current.filter((item) => !records.some((record) => record.id === item.id)),
        ...records,
      ]);
    }
    showNotice(`${result.matched.length + newNames.length} personel, ${files.length} dosyada eşleştirildi.`);
    setMatchResult({ ...result, unknown: [] });
  };

  const matchFiles = async () => {
    if (!selectedCompany || !files.length) return;
    setMatching(true);
    setError("");
    setMatchResult(null);
    setProgress(`0 / ${files.length} dosya okunuyor`);
    try {
      const chunks: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`${index + 1} / ${files.length} dosya okunuyor`);
        chunks.push(await extractResultText(file, setProgress));
      }
      const extractedText = chunks.join("\n");
      const fileNameText = files.map((file) => file.name.replace(/\.[^.]+$/, "")).join("\n");
      const searchableText = `${extractedText}\n${fileNameText}`;
      if (!extractedText.trim() && !fileNameText.trim()) throw new Error("Dosya içinde okunabilir metin bulunamadı.");
      const matched = companyEmployees.filter((employee) =>
        normalizeResultText(searchableText).includes(normalizeResultText(employee.name)),
      );
      const missing = companyEmployees
        .filter((employee) => !matched.some((item) => item.id === employee.id))
        .map((employee) => employee.name);
      const unknown = Array.from(
        new Set([
          ...findUnknownResultNames(searchableText, companyEmployees, selectedCompanyName),
          ...findNameCandidatesFromFiles(files, companyEmployees, selectedCompanyName),
        ]),
      ).slice(0, 30);
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      const records: ResultRecord[] = [];
      const unknownRecords: ResultRecord[] = [];
      const analysisSummary = { normal: 0, attention: 0, unreadable: 0 };
      files.forEach((file, index) => {
        const fileText = chunks[index] ?? "";
        const fileSearch = normalizeResultText(`${fileText}\n${file.name.replace(/\.[^.]+$/, "")}`);
        const fileMatched = matched.filter((employee) => fileSearch.includes(normalizeResultText(employee.name)));
        const fileUnknown = unknown.filter((name) => fileSearch.includes(normalizeResultText(name)));
        const analysis = analyzeResultText(fileText);
        analysisSummary[analysis.status] += 1;
        const makeRecord = (
          employeeName: string,
          employeeId: number | null,
          profile?: ReturnType<typeof extractEmployeeProfile>,
        ): ResultRecord => ({
          id: createResultId(),
          employeeId,
          employeeName,
          companyId: selectedCompany,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          extractedText: fileText.slice(0, 100_000),
          dataUrl: dataUrls[index],
          analysis,
          screeningType: detectScreeningType(`${fileText}\n${file.name}`),
          profile,
        });
        fileMatched.forEach((employee) => records.push(makeRecord(employee.name, employee.id)));
        fileUnknown.forEach((name) =>
          unknownRecords.push(makeRecord(name, null, extractEmployeeProfile(fileText, name))),
        );
        if (!fileMatched.length && !fileUnknown.length) records.push(makeRecord("Eşleşmeyen rapor", null));
      });
      const result = { matched, missing, unknown, records, unknownRecords, analysisSummary };
      setMatchResult(result);
      if (!unknown.length) commit(result, []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dosyalar okunamadı.");
    } finally {
      setMatching(false);
      setProgress("");
    }
  };

  return (
    <Page>
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/personeller">
              <ArrowLeft /> Personellere dön
            </Link>
          </Button>
        }
        description="Birden fazla laboratuvar ve muayene dosyasını tek akışta okuyun, çalışanlarla eşleştirin ve sonuçları güvenle aktarın."
        eyebrow="Çalışan ve sonuç merkezi"
        title="Toplu sonuç aktarımı"
      />
      {notice && (
        <Alert className="mt-4" icon={Check}>
          {notice}
        </Alert>
      )}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader
              icon={ClipboardCheck}
              title="Aktarım ayarları"
              description="Önce sonuçların ait olduğu firmayı seçin."
            />
            <div className="mt-5 space-y-4">
              <Field label="Sonuçların ait olduğu firma" required>
                <Select
                  onChange={(event) => {
                    setSelectedCompany(Number(event.target.value));
                    setMatchResult(null);
                  }}
                  value={selectedCompany}
                >
                  <option value={0}>Firma seçin</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="bg-card-muted border-border rounded-xl border p-3 text-xs">
                <p className="text-muted">Seçilen firma çalışanı</p>
                <p className="text-heading mt-1 font-semibold">
                  {selectedCompany ? `${companyEmployees.length} kayıt` : "Firma seçilmesini bekliyor"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader
              icon={FileUp}
              title="Dosya kuyruğu"
              description="PDF, CSV veya TXT dosyalarını birlikte seçebilirsiniz."
              action={<Badge tone="info">{files.length} dosya</Badge>}
            />
            <label className="border-border-strong bg-card-muted hover:border-brand-outline mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-10 text-center transition-colors">
              <IconBadge icon={FileUp} size="xl" />
              <span className="text-heading mt-3 text-sm font-semibold">Dosya ekle</span>
              <span className="text-muted mt-1 text-xs">
                Birden fazla dosya seçebilir, aşağıdaki listeden çıkarabilirsiniz.
              </span>
              <input
                accept=".pdf,.csv,.txt"
                className="sr-only"
                multiple
                onChange={(event) => chooseFiles(event.target.files)}
                type="file"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {files.map((file) => (
                  <div
                    className="border-border bg-card flex items-center gap-2 rounded-xl border px-3 py-2.5"
                    key={fileKey(file)}
                  >
                    <FileCheck2 className="text-brand size-4 shrink-0" />
                    <span className="text-foreground min-w-0 truncate text-xs">{file.name}</span>
                    <span className="text-subtle ml-auto text-[10px]">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </span>
                    <button
                      aria-label={`${file.name} dosyasını kaldır`}
                      className="text-muted hover:bg-danger-soft hover:text-danger rounded-md p-1"
                      onClick={() => removeFile(file)}
                      type="button"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Button
            className="w-full"
            disabled={!selectedCompany || !files.length || matching}
            onClick={() => void matchFiles()}
            size="lg"
          >
            <ClipboardCheck /> {matching ? progress || "Dosyalar okunuyor…" : "Dosyaları tara ve eşleştir"}
          </Button>
          {error && <Alert tone="danger">{error}</Alert>}
        </div>
        <Card className="min-h-[620px] p-5">
          <CardHeader
            icon={UserRound}
            title="Eşleştirme merkezi"
            description={
              selectedCompany
                ? `${selectedCompanyName} çalışanlarıyla karşılaştırma önizlemesi.`
                : "Firma ve dosyaları seçtiğinizde sonuç burada görünecek."
            }
          />
          {!matchResult ? (
            <div className="border-border bg-card-muted mt-5 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed p-8 text-center">
              <div>
                <IconBadge icon={FileCheck2} size="xl" />
                <p className="text-heading mt-4 text-sm font-semibold">Aktarım önizlemesi hazır değil</p>
                <p className="text-muted mt-1 max-w-sm text-xs leading-5">
                  Dosyaları yükleyip eşleştirmeyi başlattığınızda bulunan kişiler, yeni kayıt adayları ve analiz durumu
                  burada listelenir.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Eşleşen", matchResult.matched.length, "text-brand"],
                  ["Yeni kayıt", matchResult.unknown.length, "text-warning"],
                  [
                    "İncelenecek",
                    matchResult.analysisSummary.attention + matchResult.analysisSummary.unreadable,
                    "text-danger",
                  ],
                ].map(([label, value, color]) => (
                  <div className="bg-card-muted border-border rounded-xl border p-3" key={String(label)}>
                    <p className="text-muted text-[10px]">{label}</p>
                    <p className={cn("mt-1 text-xl font-semibold", color)}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="border-border rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-heading text-sm font-semibold">Kayıt eşleşmeleri</p>
                  <Badge tone="brand">{matchResult.matched.length} eşleşti</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {matchResult.matched.slice(0, 8).map((employee) => (
                    <div
                      className="bg-card-muted flex items-center justify-between rounded-xl px-3 py-2"
                      key={employee.id}
                    >
                      <span className="flex items-center gap-2 text-xs font-medium">
                        <span className="bg-brand-soft text-brand flex size-7 items-center justify-center rounded-lg text-[10px] font-bold">
                          {initials(employee.name)}
                        </span>
                        {employee.name}
                      </span>
                      <span className="text-brand text-[10px] font-semibold">Eşleşti</span>
                    </div>
                  ))}
                  {!matchResult.matched.length && <p className="text-muted text-xs">Kayıtlı personel eşleşmedi.</p>}
                </div>
              </div>
              {matchResult.unknown.length > 0 && (
                <div className="border-warning bg-warning-soft rounded-2xl border p-4">
                  <p className="text-heading text-sm font-semibold">Yeni personel kaydı öneriliyor</p>
                  <p className="text-muted mt-1 text-xs">
                    Bu kişiler seçilen firmada bulunamadı. PDF’den okunan profil bilgileriyle yeni kayıt açabilirsiniz.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchResult.unknown.map((name) => (
                      <Badge key={name} tone="warning">
                        {name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => commit(matchResult, matchResult.unknown)}>
                      <UserRound /> Yeni kayıtları aç ve aktar
                    </Button>
                    <Button
                      onClick={() => {
                        const onlyExisting = { ...matchResult, unknown: [] };
                        commit(onlyExisting, []);
                      }}
                      variant="secondary"
                    >
                      Sadece kayıtlıları aktar
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-muted text-xs">
                {matchResult.missing.length
                  ? `${matchResult.missing.length} kayıtlı personel dosyalarda bulunamadı.`
                  : "Tüm kayıtlı çalışanlar kontrol edildi."}
              </p>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
