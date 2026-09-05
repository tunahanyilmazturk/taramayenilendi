"use client";

declare global {
  interface Object {
    brandModel?: string;
  }
}

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { useCompanies, useEquipment, useScreenings, useTeam, useTests } from "@/lib/data";
import { companyLocation, screeningStatuses, type Company, type ScreeningStatus, type TestItem } from "@/lib/demo-data";
import { useNotice } from "@/lib/hooks";
import { isoToLabel, money, todayIso } from "@/lib/format";
import { ScreeningTestPicker } from "./screening-test-picker";
import ScreeningStepCompany from "./screening-step-company";
import ScreeningStepPricing from "./screening-step-pricing";
import ScreeningConditions from "./screening-conditions";
import ScreeningCoverLetter from "./screening-cover-letter";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type ScreeningLine = { testId: number; name: string; category: string; quantity: number; unitPrice: number };
type Draft = {
  title: string;
  companyId: number;
  screeningType: "Periyodik sağlık taraması" | "İşe giriş muayenesi";
  testIds: number[];
  testLines: ScreeningLine[];
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  location: string;
  team: string;
  teamMembers: string[];
  vehicle: string;
  equipmentIds: number[];
  participants: number;
  completed: number;
  status: ScreeningStatus;
  notes: string;
  contact: string;
  email: string;
  discount: string;
  tax: string;
  paymentTerms: string;
  deliveryDays: string;
  showPriceOnPdf: boolean;
  coverLetter: string;
  conditions: string;
};
const emptyDraft: Draft = {
  title: "",
  companyId: 0,
  screeningType: "Periyodik sağlık taraması",
  testIds: [],
  testLines: [],
  date: todayIso(),
  endDate: todayIso(),
  time: "08:30",
  endTime: "17:30",
  location: "",
  team: "",
  teamMembers: [],
  vehicle: "",
  equipmentIds: [],
  participants: 0,
  completed: 0,
  status: "Planlandı",
  notes: "",
  contact: "",
  email: "",
  discount: "0",
  tax: "20",
  paymentTerms: "net30",
  deliveryDays: "7",
  showPriceOnPdf: false,
  coverLetter: "",
  conditions: "",
};
const steps = [
  { title: "Firma bilgileri", hint: "Firma ve tarama tanımı" },
  { title: "Tarih ve saha", hint: "Tarama zamanı ve konumu" },
  { title: "Hizmet kalemleri", hint: "Test ve tarama kapsamı" },
  { title: "Fiyatlandırma", hint: "İndirim, vergi ve ödeme" },
  { title: "Saha planı", hint: "Ekip ve ekipman" },
  { title: "Ön yazı", hint: "Tarama açıklaması" },
  { title: "Şartlar ve koşullar", hint: "Uygulama koşulları" },
  { title: "Son kontrol", hint: "Tarama planını gözden geçir" },
];

export default function NewScreeningPage() {
  const [screenings, setScreenings] = useScreenings();
  const router = useRouter();
  const [companies] = useCompanies();
  const [team] = useTeam();
  const [assets] = useEquipment();
  const [tests] = useTests();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [notice, showNotice] = useNotice();
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const company = companies.find((item) => item.id === draft.companyId);
  const valid = (target: Step) =>
    target === 1
      ? Boolean(draft.companyId && draft.title.trim())
      : target === 2
        ? Boolean(draft.date && draft.endDate && draft.location.trim())
        : target === 3
          ? draft.testIds.length > 0
          : target === 5
            ? draft.teamMembers.length > 0 && draft.equipmentIds.length > 0
            : true;
  const next = () => {
    if (!valid(step)) {
      showNotice("Lütfen bu adımdaki zorunlu alanları doldurun.");
      return;
    }
    setStep((current) => Math.min(8, current + 1) as Step);
  };
  const go = (target: Step) => {
    if (target <= step || Array.from({ length: target - 1 }, (_, index) => (index + 1) as Step).every(valid))
      setStep(target);
    else showNotice("Önceki adımlardaki zorunlu alanları tamamlayın.");
  };
  const save = () => {
    if (![1, 2, 3, 5].every((item) => valid(item as Step)) || !company) {
      showNotice("Planı kaydetmek için zorunlu alanları tamamlayın.");
      return;
    }
    const record = {
      ...draft,
      team: draft.teamMembers.join(", "),
      vehicle:
        assets.find(
          (asset) =>
            asset.id === draft.equipmentIds.find((id) => assets.find((item) => item.id === id)?.kind === "Mobil araç"),
        )?.name ?? "",
      companyId: company.id,
      company: company.name,
      id: Date.now(),
    };
    setScreenings([...screenings, record]);
    showNotice("Tarama planı oluşturuldu.");
    window.setTimeout(() => router.push(`/taramalar/${record.id}`), 500);
  };
  return (
    <Page size="narrow">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <div className="border-border bg-card mb-7 rounded-2xl border p-4">
            <div>
              <Button asChild className="-ml-2" size="xs" variant="ghost">
                <Link href="/taramalar">
                  <ArrowLeft /> Taramalara dön
                </Link>
              </Button>
              <p className="text-muted mt-4 text-xs font-medium">Saha operasyonları merkezi</p>
              <h1 className="text-heading mt-1 text-2xl font-semibold tracking-[-0.04em]">Yeni tarama oluştur</h1>
              <p className="text-muted mt-2 text-xs leading-5">Firma, kapsam ve saha planını adım adım tamamlayın.</p>
            </div>
          </div>
          {steps.map((item, index) => {
            const number = (index + 1) as Step;
            return (
              <button
                aria-current={step === number ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${step === number ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand-outline"}`}
                key={item.title}
                onClick={() => go(number)}
                type="button"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${number < step ? "bg-brand text-brand-fg" : step === number ? "bg-brand text-brand-fg" : "bg-card-muted text-muted"}`}
                >
                  {number < step ? <Check className="size-4" /> : number}
                </span>
                <span>
                  <strong className="text-foreground block text-xs">{item.title}</strong>
                  <small className="text-subtle mt-1 block text-[10px]">{item.hint}</small>
                </span>
              </button>
            );
          })}
        </aside>
        <Card className="flex min-h-[640px] min-w-0 flex-col p-5 sm:min-h-[680px] sm:p-7 lg:min-h-[calc(100dvh-12rem)]">
          {notice && (
            <Alert className="mb-5" tone="warning">
              {notice}
            </Alert>
          )}
          {step === 1 && (
            <>
              <ScreeningStepCompany
                companies={companies}
                draft={draft}
                update={(key, value) => update(key as keyof Draft, value as never)}
              />
            </>
          )}
          {step === 2 && <StepTwo draft={draft} update={update} />}
          {step === 3 && <StepThree draft={draft} tests={tests.filter((test) => test.active)} update={update} />}
          {step === 4 && (
            <ScreeningStepPricing
              lines={draft.testLines}
              draft={draft}
              update={(key, value) => update(key as keyof Draft, value as never)}
            />
          )}
          {step === 5 && <StepFour assets={assets} team={team} draft={draft} update={update} />}
          {step === 6 && (
            <ScreeningCoverLetter
              value={draft.coverLetter}
              update={(value) => update("coverLetter", value)}
              company={company?.name ?? "—"}
              draft={draft}
            />
          )}
          {step === 7 && (
            <ScreeningConditions value={draft.conditions} update={(value) => update("conditions", value)} />
          )}
          {step === 8 && <StepFive company={company?.name ?? "—"} draft={draft} tests={tests} assets={assets} />}
          <div className="border-divider mt-auto flex items-center justify-between border-t pt-5">
            <span className="text-muted text-xs">Adım {step} / 8</span>
            <div className="flex gap-2">
              <Button
                disabled={step === 1}
                onClick={() => setStep((current) => Math.max(1, current - 1) as Step)}
                variant="outline"
              >
                <ArrowLeft /> Geri
              </Button>
              {step < 8 ? (
                <Button onClick={next}>
                  Devam et <ArrowRight />
                </Button>
              ) : (
                <Button onClick={save}>
                  <Check /> Taramayı oluştur
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}

function StepOne({
  companies,
  draft,
  update,
}: {
  companies: Array<{ id: number; name: string; sector: string; city: string; district: string; employees: number }>;
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const selected = companies.find((item) => item.id === draft.companyId);
  const selectCompany = (id: number) => {
    update("companyId", id);
    const company = companies.find((item) => item.id === id);
    if (company) {
      if (!draft.title) update("title", `${company.name} - ${draft.screeningType}`);
      update("participants", company.employees);
      if (!draft.location) update("location", companyLocation(company));
    }
  };
  return (
    <section>
      <Heading
        icon={UsersRound}
        eyebrow="1. ADIM · FİRMA"
        title="Firma ve tarama bilgileri"
        description="Taramanın hangi firmaya ve hangi kapsamda yapılacağını belirleyin."
      />
      <div className="mt-4 grid min-h-[420px] gap-4 sm:grid-cols-2">
        <Field label="Firma" required>
          <Select onChange={(event) => selectCompany(Number(event.target.value))} value={draft.companyId}>
            <option value={0}>Firma seçin</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          {selected && (
            <p className="text-subtle mt-2 text-[11px]">
              {selected.sector} · {selected.employees} çalışan · {selected.city}, {selected.district}
            </p>
          )}
        </Field>
        <Field label="Tarama türü" required>
          <Select
            onChange={(event) => {
              const value = event.target.value as Draft["screeningType"];
              update("screeningType", value);
              if (selected && !draft.title) update("title", `${selected.name} - ${value}`);
            }}
            value={draft.screeningType}
          >
            <option>Periyodik sağlık taraması</option>
            <option>İşe giriş muayenesi</option>
          </Select>
        </Field>
        <Field className="sm:col-span-2" label="Tarama başlığı" required>
          <Input
            onChange={(event) => update("title", event.target.value)}
            placeholder="Firma ve tarama türünden otomatik oluşur"
            value={draft.title}
          />
        </Field>
        <Field className="sm:col-span-2" label="Kapsam notu">
          <Input
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Örn. vardiya bazlı sağlık taraması"
            value={draft.notes}
          />
        </Field>
      </div>
    </section>
  );
}
function StepTwo({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  return (
    <section>
      <div className="mt-4 grid min-h-[420px] gap-4 sm:grid-cols-2">
        <Field label="Başlangıç tarihi" required>
          <Input onChange={(event) => update("date", event.target.value)} type="date" value={draft.date} />
        </Field>
        <Field label="Bitiş tarihi" required>
          <Input onChange={(event) => update("endDate", event.target.value)} type="date" value={draft.endDate} />
        </Field>
        <Field label="Başlangıç saati">
          <Input onChange={(event) => update("time", event.target.value)} type="time" value={draft.time} />
        </Field>
        <Field label="Bitiş saati">
          <Input onChange={(event) => update("endTime", event.target.value)} type="time" value={draft.endTime} />
        </Field>
        <Field className="sm:col-span-2" label="Saha konumu" required>
          <div className="relative">
            <MapPin className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              className="pl-10"
              onChange={(event) => update("location", event.target.value)}
              placeholder="Firma adresi veya saha noktası"
              value={draft.location}
            />
          </div>
        </Field>
      </div>
      <p className="text-muted mt-3 text-[11px]">
        Saat seçimi zorunlu değildir. Varsayılan çalışma aralığı 08:30 – 17:30 olarak doldurulmuştur.
      </p>
    </section>
  );
}
function StepThree({
  draft,
  tests,
  update,
}: {
  draft: Draft;
  tests: TestItem[];
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const lines = draft.testLines ?? [];
  const toggleTest = (test: TestItem) => {
    const selected = draft.testIds.includes(test.id);
    update("testIds", selected ? draft.testIds.filter((item) => item !== test.id) : [...draft.testIds, test.id]);
    update(
      "testLines",
      selected
        ? lines.filter((line) => line.testId !== test.id)
        : [
            ...lines,
            {
              testId: test.id,
              name: test.name,
              category: test.category,
              quantity: Math.max(1, draft.participants),
              unitPrice: test.price,
            },
          ],
    );
  };
  return (
    <section>
      <div className="mt-7">
        <ScreeningTestPicker
          defaultQuantity={draft.participants}
          lines={lines}
          tests={tests}
          update={(nextLines) => {
            update("testLines", nextLines);
            update(
              "testIds",
              nextLines.map((line) => line.testId),
            );
          }}
        />
      </div>
    </section>
  );
}
function StepFour({
  assets,
  team,
  draft,
  update,
}: {
  assets: Array<{ id: number; name: string; kind: string; status: string }>;
  team: Array<{ id: number; name: string; active: boolean }>;
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const activeTeam = team.filter((member) => member.active);
  const usableAssets = assets.filter((asset) => asset.status === "Kullanımda");
  const toggleMember = (name: string) =>
    update(
      "teamMembers",
      draft.teamMembers.includes(name)
        ? draft.teamMembers.filter((item) => item !== name)
        : [...draft.teamMembers, name],
    );
  const toggleAsset = (id: number) =>
    update(
      "equipmentIds",
      draft.equipmentIds.includes(id) ? draft.equipmentIds.filter((item) => item !== id) : [...draft.equipmentIds, id],
    );
  return (
    <section>
      <div className="mt-4 grid min-h-[420px] gap-5 sm:grid-cols-2">
        <div className="border-border bg-card h-full rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-bold">Sorumlu ekip üyeleri</p>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-1 text-[10px] font-semibold">
              {draft.teamMembers.length} seçildi
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {activeTeam.map((member) => (
              <button
                aria-pressed={draft.teamMembers.includes(member.name)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${draft.teamMembers.includes(member.name) ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand-outline"}`}
                key={member.id}
                onClick={() => toggleMember(member.name)}
                type="button"
              >
                <span>
                  <span className="text-foreground block text-xs font-semibold">{member.name}</span>
                  <span className="text-muted mt-1 block text-[10px]">Aktif ekip üyesi</span>
                </span>
                <span
                  className={`size-5 rounded-full border text-center text-xs ${draft.teamMembers.includes(member.name) ? "border-brand bg-brand text-brand-fg" : "border-border text-transparent"}`}
                >
                  ✓
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="border-border bg-card h-full rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-bold">Kullanılacak kaynaklar</p>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-1 text-[10px] font-semibold">
              {draft.equipmentIds.length} seçildi
            </span>
          </div>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {usableAssets.map((asset) => (
              <button
                aria-pressed={draft.equipmentIds.includes(asset.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${draft.equipmentIds.includes(asset.id) ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand-outline"}`}
                key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                type="button"
              >
                <span>
                  <span className="text-foreground block text-xs font-semibold">{asset.name}</span>
                  <span className="text-muted mt-1 block text-[10px]">
                    {asset.kind} · {asset.brandModel}
                  </span>
                </span>
                <span
                  className={`size-5 rounded-full border text-center text-xs ${draft.equipmentIds.includes(asset.id) ? "border-brand bg-brand text-brand-fg" : "border-border text-transparent"}`}
                >
                  ✓
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function StepFive({
  company,
  draft,
  tests,
  assets,
}: {
  company: string;
  draft: Draft;
  tests: Array<{ id: number; name: string }>;
  assets: Array<{ id: number; name: string }>;
}) {
  const selectedTests = draft.testLines;
  const selectedAssets = assets
    .filter((asset) => draft.equipmentIds.includes(asset.id))
    .map((asset) => asset.name)
    .join(", ");
  const missing = [
    !draft.companyId && "Firma seçimi",
    !draft.title.trim() && "Tarama başlığı",
    !draft.date && "Başlangıç tarihi",
    !draft.endDate && "Bitiş tarihi",
    !draft.location.trim() && "Saha konumu",
    !draft.testLines.length && "Hizmet kalemi",
    !draft.teamMembers.length && "Sorumlu ekip",
    !draft.equipmentIds.length && "Ekipman",
  ].filter(Boolean) as string[];
  const subtotal = selectedTests.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = (subtotal * Math.min(100, Math.max(0, Number(draft.discount) || 0))) / 100;
  const net = subtotal - discount;
  const tax = (net * Math.max(0, Number(draft.tax) || 0)) / 100;
  const total = net + tax;
  return (
    <section>
      <div className="mt-4 space-y-4">
        <ReviewSection icon={Building2} title="Firma ve tarama bilgileri">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReviewField label="Firma" value={company || "Belirtilmedi"} />
            <ReviewField label="Tarama türü" value={draft.screeningType} />
            <ReviewField
              label="Firma yetkilisi"
              value={[draft.contact, draft.email].filter(Boolean).join(" · ") || "Belirtilmedi"}
            />
            <ReviewField label="Katılımcı sayısı" value={`${draft.participants || 0} kişi`} />
            <ReviewField label="Tarama başlığı" value={draft.title || "Belirtilmedi"} full />
          </div>
        </ReviewSection>
        <ReviewSection icon={CalendarDays} title="Tarih ve saha planı">
          <div className="grid gap-3 sm:grid-cols-3">
            <ReviewField
              label="Tarih aralığı"
              value={`${draft.date ? isoToLabel(draft.date) : "—"} – ${draft.endDate ? isoToLabel(draft.endDate) : "—"}`}
            />
            <ReviewField label="Saat aralığı" value={`${draft.time || "08:30"} – ${draft.endTime || "17:30"}`} />
            <ReviewField label="Saha konumu" value={draft.location || "Belirtilmedi"} />
          </div>
        </ReviewSection>
        <ReviewSection icon={ClipboardList} title="Hizmet kapsamı" badge={`${selectedTests.length} test`}>
          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="border-divider bg-card-muted border-b">
                <tr>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase">Test</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Adet</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Birim</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {selectedTests.map((line) => (
                  <tr key={line.testId}>
                    <td className="text-foreground px-3 py-2 font-semibold">
                      {line.name}
                      <span className="text-muted block text-[10px] font-normal">{line.category}</span>
                    </td>
                    <td className="text-muted px-3 py-2 text-right">{line.quantity}</td>
                    <td className="text-muted px-3 py-2 text-right">{money(line.unitPrice)}</td>
                    <td className="text-foreground px-3 py-2 text-right font-semibold">
                      {money(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReviewSection>
        <div className="grid gap-4 lg:grid-cols-2">
          <ReviewSection icon={UsersRound} title="Saha ekibi">
            <ReviewField label="Sorumlu ekip üyeleri" value={draft.teamMembers.join(", ") || "Atanmadı"} />
            <ReviewField label="Kullanılacak ekipmanlar" value={selectedAssets || "Seçilmedi"} />
          </ReviewSection>
          <ReviewSection icon={CheckCircle2} title="Fiyat özeti">
            <div className="space-y-2 text-xs">
              <PriceLine label="Ara toplam" value={money(subtotal)} />
              <PriceLine label="İndirim" value={discount > 0 ? `-${money(discount)}` : "—"} />
              <PriceLine label={`KDV (%${draft.tax})`} value={tax > 0 ? money(tax) : "—"} />
              <div className="border-divider text-heading flex justify-between border-t pt-3 text-sm font-bold">
                <span>Genel toplam</span>
                <span>{money(total)}</span>
              </div>
              <p className="text-muted pt-1 text-[11px]">
                PDF fiyat görünümü: {draft.showPriceOnPdf ? "Açık" : "Kapalı"}
              </p>
            </div>
          </ReviewSection>
        </div>
        {missing.length > 0 && (
          <div className="border-danger-border bg-danger-soft rounded-2xl border p-4">
            <p className="text-danger text-xs font-bold">Kaydetmeden önce tamamlanması gerekenler</p>
            <p className="text-danger mt-2 text-xs">{missing.join(" · ")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewSection({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Building2;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
            <Icon className="size-4" />
          </span>
          <h3 className="text-foreground text-sm font-bold">{title}</h3>
        </div>
        {badge && (
          <span className="bg-card-muted text-muted rounded-full px-2 py-1 text-[10px] font-semibold">{badge}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function ReviewField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`bg-card-muted rounded-xl px-3 py-2.5 ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-subtle text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      <p className="text-foreground mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}
function Heading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof ClipboardList;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-2xl">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-brand text-[10px] font-bold tracking-[0.14em] uppercase">{eyebrow}</p>
        <h2 className="text-heading mt-1 text-xl font-semibold">{title}</h2>
        <p className="text-muted mt-1 text-xs">{description}</p>
      </div>
    </div>
  );
}
