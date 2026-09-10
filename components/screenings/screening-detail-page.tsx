"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Edit3,
  Eye,
  FileDown,
  FileText,
  History,
  Mail,
  MessageCircle,
  Paperclip,
  Save,
  Send,
  UsersRound,
  Wrench,
  X,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { useCompanies, useEquipment, useOrganization, useScreenings, useTeam, useTests } from "@/lib/data";
import { screeningStatuses, type OfferAttachment, type Screening, type ScreeningStatus } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { useCan, useConfirm, useNotice } from "@/lib/hooks";
import { downloadScreeningPdf, previewScreeningPdf } from "@/lib/pdf/screening-pdf";
import { cn, initials } from "@/lib/utils";

const statusTone: Record<ScreeningStatus, "brand" | "warning" | "danger" | "neutral" | "success"> = {
  Planlandı: "neutral",
  Hazırlanıyor: "warning",
  "Devam ediyor": "brand",
  Tamamlandı: "success",
  İptal: "danger",
};
type Tab = "overview" | "services" | "field" | "company" | "notes" | "activity";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

export default function ScreeningDetailPage({ screeningId }: { screeningId: string }) {
  const [screenings, setScreenings] = useScreenings();
  const router = useRouter();
  const [companies] = useCompanies();
  const [team] = useTeam();
  const [equipment] = useEquipment();
  const [tests] = useTests();
  const [organization] = useOrganization();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const can = useCan();
  const [editingNotes, setEditingNotes] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailBcc, setMailBcc] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [includeMailSummary, setIncludeMailSummary] = useState(true);
  const [includeMailTeam, setIncludeMailTeam] = useState(true);
  const [includeMailLink, setIncludeMailLink] = useState(true);
  const [shareTarget, setShareTarget] = useState("Saha ekibi");
  const screening = screenings.find((item) => item.id === Number(screeningId));
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>(() => {
    const assignedNames = screening?.teamMembers ?? screening?.team?.split(",").map((name) => name.trim()) ?? [];
    return team.filter((member) => assignedNames.includes(member.name)).map((member) => member.id);
  });
  const [notesDraft, setNotesDraft] = useState(() => ({
    coverLetter: screening?.coverLetter ?? "",
    conditions: screening?.conditions ?? "",
    notes: screening?.notes ?? "",
  }));

  const beginNotesEdit = () => {
    if (!screening) return;
    setNotesDraft({
      coverLetter: screening.coverLetter ?? "",
      conditions: screening.conditions ?? "",
      notes: screening.notes ?? "",
    });
    setEditingNotes(true);
  };

  const cancelNotesEdit = () => {
    if (screening) {
      setNotesDraft({
        coverLetter: screening.coverLetter ?? "",
        conditions: screening.conditions ?? "",
        notes: screening.notes ?? "",
      });
    }
    setEditingNotes(false);
  };

  const saveNotes = () => {
    if (!screening) return;
    if (!can("screenings.write")) return showNotice("Tarama düzenleme yetkiniz yok.");
    setScreenings((current) =>
      current.map((item) =>
        item.id === screening.id
          ? { ...item, coverLetter: notesDraft.coverLetter, conditions: notesDraft.conditions, notes: notesDraft.notes }
          : item,
      ),
    );
    setEditingNotes(false);
    showNotice("Notlar ve metinler kaydedildi.");
  };

  const addAttachment = (file: File | undefined) => {
    if (!screening || !file) return;
    if (!can("screenings.write")) return showNotice("Tarama belgesi ekleme yetkiniz yok.");
    if (file.size > 5 * 1024 * 1024) {
      showNotice("Dosya boyutu 5 MB'dan küçük olmalıdır.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const attachment: OfferAttachment = {
        id: `${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        createdAt: new Date().toLocaleString("tr-TR"),
      };
      setScreenings((current) =>
        current.map((item) =>
          item.id === screening.id ? { ...item, attachments: [...(item.attachments ?? []), attachment] } : item,
        ),
      );
      showNotice("Ek dosya taramaya eklendi.");
    });
    reader.readAsDataURL(file);
  };

  const removeAttachment = (attachmentId: string) => {
    if (!can("screenings.delete")) return showNotice("Tarama belgesi silme yetkiniz yok.");
    if (!screening) return;
    const attachment = screening.attachments?.find((item) => item.id === attachmentId);
    confirm({
      title: "Ek dosyayı kaldır",
      description: `${attachment?.name ?? "Bu dosya"} tarama kaydından kaldırılacak.`,
      confirmLabel: "Dosyayı kaldır",
      onConfirm: () => {
        setScreenings((current) =>
          current.map((item) =>
            item.id === screening.id
              ? { ...item, attachments: (item.attachments ?? []).filter((entry) => entry.id !== attachmentId) }
              : item,
          ),
        );
        showNotice("Ek dosya kaldırıldı.");
      },
    });
  };
  const updateCompleted = (value: number) => {
    if (!can("screenings.write")) return showNotice("Tarama ilerlemesini güncelleme yetkiniz yok.");
    if (!screening) return;
    const completed = Math.min(Math.max(0, Math.round(value) || 0), screening.participants);
    setScreenings((current) => current.map((item) => {
      if (item.id !== screening.id) return item;
      const status = item.status === "İptal"
        ? item.status
        : completed === item.participants && item.participants > 0
          ? "Tamamlandı"
          : item.status === "Tamamlandı"
            ? "Devam ediyor"
            : item.status;
      return { ...item, completed, status };
    }));
  };
  const updateStatus = (status: ScreeningStatus) => {
    if (!can("screenings.write")) return showNotice("Tarama durumunu değiştirme yetkiniz yok.");
    if (!screening) return;
    setScreenings((current) => current.map((item) =>
      item.id === screening.id
        ? { ...item, status, completed: status === "Tamamlandı" ? item.participants : item.completed }
        : item,
    ));
    showNotice(status === "Tamamlandı" ? "Tarama tamamlandı olarak işaretlendi." : "Tarama durumu güncellendi.");
  };
  const cancelScreening = () =>
    !can("screenings.write") ? showNotice("Tarama iptal etme yetkiniz yok.") :
    confirm({
      title: "Taramayı iptal et",
      description: `${screening?.title ?? "Bu tarama"} planı iptal edilecek.`,
      confirmLabel: "Taramayı iptal et",
      onConfirm: () => {
        if (!screening) return;
        setScreenings((current) =>
          current.map((item) => (item.id === screening.id ? { ...item, status: "İptal" } : item)),
        );
        showNotice("Tarama iptal edildi.");
      },
    });
  const removeScreening = () =>
    !can("screenings.delete") ? showNotice("Tarama silme yetkiniz yok.") :
    confirm({
      title: "Taramayı sil",
      description: `${screening?.title ?? "Bu tarama"} kaydı kalıcı olarak silinecek.`,
      confirmLabel: "Taramayı sil",
      onConfirm: () => {
        if (!screening) return;
        setScreenings((current) => current.filter((item) => item.id !== screening.id));
        showNotice("Tarama silindi.");
        window.setTimeout(() => router.push("/taramalar"), 400);
      },
    });
  if (!screening)
    return (
      <Page>
        <BackLink />
        <EmptyState
          className="mt-6"
          description="Aradığınız tarama silinmiş veya bağlantı hatalı olabilir."
          icon={ClipboardList}
          title="Tarama bulunamadı"
          action={
            <Button asChild variant="secondary">
              <Link href="/taramalar">
                <ArrowLeft /> Taramalara dön
              </Link>
            </Button>
          }
        />
      </Page>
    );
  const company = companies.find((item) => item.id === screening.companyId);
  const lines =
    screening.testLines ??
    (screening.testIds ?? [])
      .map((id) => {
        const test = tests.find((item) => item.id === id);
        return test
          ? {
              testId: test.id,
              name: test.name,
              category: test.category,
              quantity: screening.participants,
              unitPrice: test.price,
            }
          : null;
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const progress = screening.participants ? Math.round((screening.completed / screening.participants) * 100) : 0;
  const selectedTeam = team.filter((member) => selectedMemberIds.includes(member.id));
  const selectedAssets = (screening.equipmentIds ?? [])
    .map((id) => equipment.find((item) => item.id === id)?.name)
    .filter(Boolean);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/taramalar/${screening.id}`
      : `/taramalar/${screening.id}`;
  const shareMessage = [
    `📍 *${shareTarget || "Saha ekibi"}*`,
    "Saha taraması bilgilendirmesi",
    "",
    "🏢 *Tarama*",
    screening.title,
    `Firma: ${screening.company}`,
    `Tarama türü: ${screening.screeningType ?? "Mobil sağlık taraması"}`,
    "",
    "📅 *Planlama*",
    `Tarih: ${screening.date}`,
    `Saat: ${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`,
    `Konum: ${screening.location || "Belirtilmedi"}`,
    `Katılımcı: ${screening.participants} kişi`,
    "",
    "🧪 *Hizmet kapsamı*",
    lines.length ? lines.map((line) => `• ${line.name} — ${line.quantity} adet`).join("\n") : "• Belirtilmedi",
    "",
    "👥 *Saha ekibi*",
    `Sorumlu: ${selectedTeam.length ? selectedTeam.map((member) => member.name).join(", ") : screening.team || "Belirtilmedi"}`,
    `Araç: ${screening.vehicle || "Belirtilmedi"}`,
    `Ekipman: ${selectedAssets.length ? selectedAssets.join(", ") : "Belirtilmedi"}`,
    ...(screening.notes ? ["", "📝 *Not*", screening.notes] : []),
    "",
    `Detay sayfası: ${shareUrl}`,
  ].join("\n");
  const mailRecipientName = screening.contact || company?.contact || "Yetkili";
  const mailTeam = selectedTeam.length
    ? selectedTeam.map((member) => member.name).join(", ")
    : screening.team || "Belirtilmedi";
  const mailEquipment = selectedAssets.length ? selectedAssets.join(", ") : screening.vehicle || "Belirtilmedi";
  const mailBody = [
    `Merhaba ${mailRecipientName},`,
    "",
    `${screening.company} için planlanan saha taramasının hazırlık ve uygulama bilgilerini aşağıda paylaşıyoruz.`,
    ...(includeMailSummary
      ? [
          "",
          "TARAMA ÖZETİ",
          `Tarama: ${screening.title}`,
          `Tarama türü: ${screening.screeningType ?? "Mobil sağlık taraması"}`,
          `Tarih: ${screening.date}`,
          `Saat: ${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`,
          `Konum: ${screening.location || "Belirtilmedi"}`,
          `Katılımcı: ${screening.participants} kişi`,
        ]
      : []),
    ...(includeMailTeam
      ? ["", "SAHA EKİBİ VE KAYNAKLAR", `Sorumlu ekip: ${mailTeam}`, `Araç / ekipman: ${mailEquipment}`]
      : []),
    ...(includeMailLink
      ? [
          "",
          "📎 PDF EKİ",
          "Tarama planını, hizmet kapsamını ve PDF içeriğini incelemek için aşağıdaki bağlantıyı açabilirsiniz.",
          `Tarama detayları ve PDF önizleme: ${shareUrl}`,
        ]
      : []),
    "",
    "Planlamayla ilgili bir değişiklik olursa bu e-posta üzerinden bizimle iletişime geçebilirsiniz.",
    "",
    "Saygılarımızla,",
    organization.title,
    `${organization.phone} · ${organization.email}`,
  ].join("\n");
  const mailHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#17324d;background:#f4f7f9;padding:28px;border-radius:18px">
      <div style="background:#0b2238;color:#ffffff;padding:24px 28px;border-radius:16px 16px 0 0">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#78b9e8">${escapeHtml(organization.shortName || organization.title)}</div>
        <div style="font-size:22px;font-weight:700;margin-top:8px">Tarama bilgilendirmesi</div>
        <div style="font-size:12px;color:#c9ddec;margin-top:8px">Saha operasyonu · Kurumsal iletişim</div>
      </div>
      <div style="background:#ffffff;padding:28px;border:1px solid #dfe7ec;border-top:0;border-radius:0 0 16px 16px">
        <div style="font-size:12px;color:#66798b;margin-bottom:6px">KONU</div>
        <h1 style="font-size:24px;line-height:1.25;margin:0;color:#102a43">${escapeHtml(screening.title)}</h1>
        <p style="font-size:14px;line-height:1.7;margin:20px 0 0">Merhaba ${escapeHtml(mailRecipientName)},<br>${escapeHtml(screening.company)} için planlanan saha taramasının güncel detaylarını bilgilerinize sunarız.</p>
        ${
          includeMailSummary
            ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e9eef2">
                <div style="font-size:13px;font-weight:700;color:#17324d;margin-bottom:12px">Tarama özeti</div>
                <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:8px">
                  <tr><td style="background:#f1f5f8;padding:14px;border-radius:10px;width:50%"><small style="color:#708394">TARAMA TARİHİ</small><br><strong>${escapeHtml(screening.date)}</strong></td><td style="background:#f1f5f8;padding:14px;border-radius:10px"><small style="color:#708394">SAAT</small><br><strong>${escapeHtml(`${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`)}</strong></td></tr>
                  <tr><td style="background:#f1f5f8;padding:14px;border-radius:10px"><small style="color:#708394">KONUM</small><br><strong>${escapeHtml(screening.location || "Belirtilmedi")}</strong></td><td style="background:#f1f5f8;padding:14px;border-radius:10px"><small style="color:#708394">KATILIMCI</small><br><strong>${screening.participants} kişi</strong></td></tr>
                </table>
              </div>`
            : ""
        }
        ${
          includeMailSummary
            ? `<div style="margin-top:18px;padding:16px;border:1px solid #dfe7ec;border-radius:12px"><div style="font-size:13px;font-weight:700;color:#17324d;margin-bottom:10px">Hizmet kapsamı</div>${
                lines.length
                  ? lines
                      .map(
                        (line) =>
                          `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #e9eef2;font-size:12px"><span>${escapeHtml(line.name)}</span><strong style="color:#1d5b91">${line.quantity} adet</strong></div>`,
                      )
                      .join("")
                  : `<div style="font-size:12px;color:#66798b">Hizmet kapsamı belirtilmedi.</div>`
              }</div>`
            : ""
        }
        ${
          includeMailTeam
            ? `<div style="background:#e8f0f8;margin-top:20px;padding:16px;border-radius:12px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1d5b91">Saha ekibi ve kaynaklar</div><div style="font-size:13px;font-weight:700;margin-top:8px">${escapeHtml(mailTeam)}</div><div style="font-size:12px;color:#66798b;margin-top:5px">${escapeHtml(mailEquipment)}</div></div>`
            : ""
        }
        ${
          includeMailLink
            ? `<div style="background:#123d56;margin-top:20px;padding:16px;border-radius:12px"><div style="color:#c9ddec;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">TARAMA PAYLAŞIMI</div><div style="color:#ffffff;font-size:13px;font-weight:700;margin-top:7px">Tarama planını ve PDF içeriğini incelemek için bağlantıyı açın.</div><a href="${escapeHtml(shareUrl)}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;margin-top:12px">Tarama detaylarını görüntüle →</a><div style="color:#c9ddec;font-size:11px;margin-top:6px">Hizmet kapsamı, saha planı ve PDF önizlemesi tek ekranda.</div></div>`
            : ""
        }
        <div style="border-top:1px solid #e9eef2;margin-top:24px;padding-top:20px;font-size:13px;line-height:1.7;color:#66798b">Planlamayla ilgili bir değişiklik olursa bu e-posta üzerinden bizimle iletişime geçebilirsiniz.<br><br><strong style="color:#17324d">Saygılarımızla,<br>${escapeHtml(organization.title)}</strong><br>${escapeHtml(organization.phone)} · ${escapeHtml(organization.email)}</div>
      </div>
    </div>`;
  const openMailComposer = () => {
    setMailTo(screening.email || company?.email || "");
    setMailCc("");
    setMailBcc("");
    setMailSubject(`Tarama planı | ${screening.company} | ${screening.date}`);
    setMailOpen(true);
  };
  const copyMailBody = async () => {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([mailHtml], { type: "text/html" }),
            "text/plain": new Blob([mailBody], { type: "text/plain" }),
          }),
        ]);
        showNotice("Biçimli e-posta içeriği panoya kopyalandı. Mailde yapıştırabilirsiniz.");
      } else {
        await navigator.clipboard.writeText(mailBody);
        showNotice("E-posta içeriği düz metin olarak panoya kopyalandı.");
      }
    } catch {
      showNotice("E-posta içeriği kopyalanamadı.");
    }
  };
  const openMailClient = () => {
    if (!mailTo.trim()) {
      showNotice("Lütfen en az bir alıcı e-posta adresi girin.");
      return;
    }
    const params = new URLSearchParams({ subject: mailSubject, body: mailBody });
    if (mailCc.trim()) params.set("cc", mailCc.trim());
    if (mailBcc.trim()) params.set("bcc", mailBcc.trim());
    window.location.href = `mailto:${mailTo.trim()}?${params.toString()}`;
    setMailOpen(false);
  };
  const copyShareMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      showNotice("WhatsApp mesajı panoya kopyalandı.");
    } catch {
      showNotice("Mesaj kopyalanamadı; WhatsApp açıldığında metni buradan alabilirsiniz.");
    }
  };
  const openWhatsApp = () => {
    void copyShareMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };
  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  };
  const tab = (value: Tab, label: string) => (
    <button
      className={cn(
        "shrink-0 rounded-t-lg px-4 py-3 text-xs font-semibold",
        activeTab === value ? "border-brand text-brand border-b-2" : "text-muted hover:text-foreground",
      )}
      onClick={() => setActiveTab(value)}
      type="button"
    >
      {label}
    </button>
  );
  return (
    <Page>
      <BackLink />
      {notice && (
        <Alert className="mt-4 w-fit" icon={CheckCircle2}>
          {notice}
        </Alert>
      )}
      <Card className="border-sidebar-border bg-sidebar relative mt-6 overflow-hidden rounded-xl p-4 shadow-xl sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-right opacity-80"
          style={{ backgroundImage: "url('/images/screening-detail-hero-v1.png')" }}
        />
        <div aria-hidden="true" className="bg-sidebar/25 pointer-events-none absolute inset-0" />
        <div className="border-sidebar-border/80 relative z-10 flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="bg-sidebar-fg-strong text-sidebar flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold">
              {initials(screening.company)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-sidebar-fg-strong text-2xl font-semibold tracking-[-0.04em]">{screening.title}</h1>
                <Badge tone={statusTone[screening.status]}>{screening.status}</Badge>
              </div>
              <p className="text-sidebar-muted mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Building2 className="size-4" /> {screening.company}
                <Link className="text-sidebar-accent hover:underline" href={`/firmalar/${screening.companyId}`}>
                  Firma detayı
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              onClick={() => void downloadScreeningPdf(screening, organization, company, lines)}
              size="sm"
              variant="brand"
            >
              <FileDown /> PDF indir
            </Button>
            <Button
              className="border-sidebar-border bg-sidebar-hover text-sidebar-fg-strong hover:bg-sidebar-active hover:text-sidebar-fg-strong"
              onClick={() => void previewScreeningPdf(screening, organization, company, lines)}
              size="sm"
              variant="outline"
            >
              <Eye /> PDF önizleme
            </Button>
            <Button
              className="border-sidebar-accent/50 bg-sidebar-active text-sidebar-active-fg hover:bg-sidebar-hover hover:text-sidebar-active-fg"
              onClick={() => setShareOpen(true)}
              size="sm"
              variant="outline"
            >
              <MessageCircle /> WhatsApp paylaş
            </Button>
            <Button
              className="border-info/50 bg-info-soft text-info hover:bg-info-soft/80 hover:text-info"
              onClick={openMailComposer}
              size="sm"
              variant="outline"
            >
              <Mail /> E-posta gönder
            </Button>
            <Button
              asChild
              className="border-sidebar-border bg-sidebar-hover text-sidebar-fg-strong hover:bg-sidebar-active hover:text-sidebar-fg-strong"
              size="sm"
              variant="outline"
            >
              <Link href={`/taramalar/yeni?edit=${screening.id}`}>Düzenle</Link>
            </Button>
            {screening.status !== "İptal" && screening.status !== "Tamamlandı" && (
              <Button onClick={cancelScreening} size="sm" variant="outline">
                <XCircle /> İptal et
              </Button>
            )}
            <Button onClick={removeScreening} size="sm" variant="danger">
              <Trash2 /> Sil
            </Button>
          </div>
        </div>
        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile dark icon={UsersRound} label="Katılımcı" value={`${screening.participants} kişi`} />
          <StatTile dark icon={CheckCircle2} label="Tamamlanan" value={`${screening.completed} kişi · %${progress}`} />
          <StatTile dark icon={ClipboardList} label="Hizmet kalemi" value={`${lines.length} kalem`} />
          <StatTile dark icon={CalendarDays} label="Tarama tarihi" value={screening.date} />
        </div>
      </Card>
      <div className="border-divider mt-6 flex gap-2 overflow-x-auto border-b pb-1">
        {tab("overview", "Tarama özeti")}
        {tab("services", "Hizmetler")}
        {tab("field", "Saha planı")}
        {tab("company", "Firma bilgileri")}
        {tab("notes", "Notlar ve belgeler")}
        {tab("activity", "Aktivite geçmişi")}
      </div>
      {activeTab === "overview" && (
        <Overview
          screening={screening}
          company={company}
          lines={lines}
          total={total}
          progress={progress}
          onUpdateCompleted={updateCompleted}
          onUpdateStatus={updateStatus}
        />
      )}
      {activeTab === "services" && <Services lines={lines} total={total} />}
      {activeTab === "field" && <FieldPlan screening={screening} team={team} equipment={equipment} />}
      {activeTab === "company" && <CompanyInfo screening={screening} company={company} />}
      {activeTab === "notes" && (
        <Notes
          editing={editingNotes}
          onAddAttachment={addAttachment}
          onBeginEdit={beginNotesEdit}
          onCancelEdit={cancelNotesEdit}
          onRemoveAttachment={removeAttachment}
          onSave={saveNotes}
          onUpdateDraft={(field, value) => setNotesDraft((current) => ({ ...current, [field]: value }))}
          screening={screening}
          draft={notesDraft}
        />
      )}
      {activeTab === "activity" && <Activity screening={screening} />}
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
      <Modal
        description="Gönderim ayarlarını düzenleyin, kurumsal e-posta içeriğini kontrol edin ve mail uygulamanızda açın."
        eyebrow="Müşteri iletişimi"
        footer={
          <>
            <Button onClick={() => void copyMailBody()} variant="outline">
              <Copy /> HTML olarak kopyala
            </Button>
            <Button onClick={openMailClient} variant="brand">
              <Send /> E-posta gönder
            </Button>
          </>
        }
        icon={Mail}
        onClose={() => setMailOpen(false)}
        open={mailOpen}
        className="sm:max-w-5xl"
        size="xl"
        title="Tarama e-postası hazırla"
      >
        <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-6">
          <div className="border-border bg-card-muted/35 space-y-4 rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-0 lg:self-start">
            <div>
              <p className="text-foreground text-xs font-semibold">Gönderim ayarları</p>
              <p className="text-muted mt-1 text-[11px]">Alıcı ve e-posta bilgilerini gönderimden önce güncelleyin.</p>
            </div>
            <label className="text-foreground block text-xs font-semibold">
              Kime <span className="text-danger">*</span>
              <input
                aria-label="E-posta alıcısı"
                className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                onChange={(event) => setMailTo(event.target.value)}
                placeholder="yetkili@firma.com"
                type="email"
                value={mailTo}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-foreground block text-xs font-semibold">
                Bilgi (CC)
                <input
                  aria-label="Bilgi e-posta adresleri"
                  className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  onChange={(event) => setMailCc(event.target.value)}
                  placeholder="ekip@firma.com"
                  type="text"
                  value={mailCc}
                />
              </label>
              <label className="text-foreground block text-xs font-semibold">
                Gizli (BCC)
                <input
                  aria-label="Gizli e-posta adresleri"
                  className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  onChange={(event) => setMailBcc(event.target.value)}
                  placeholder="yonetim@hantech.com.tr"
                  type="text"
                  value={mailBcc}
                />
              </label>
            </div>
            <label className="text-foreground block text-xs font-semibold">
              Konu
              <input
                aria-label="E-posta konusu"
                className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                onChange={(event) => setMailSubject(event.target.value)}
                placeholder="Tarama planı"
                type="text"
                value={mailSubject}
              />
            </label>
            <div className="border-border bg-card-muted rounded-2xl border p-3">
              <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">İçerik seçenekleri</p>
              <div className="mt-3 space-y-2">
                {[
                  [includeMailSummary, setIncludeMailSummary, "Tarama özetini ekle"],
                  [includeMailTeam, setIncludeMailTeam, "Ekip ve ekipmanları ekle"],
                  [includeMailLink, setIncludeMailLink, "Detay ve PDF bağlantısını ekle"],
                ].map(([checked, setter, label]) => (
                  <button
                    aria-pressed={checked as boolean}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                      checked
                        ? "border-brand bg-brand-soft text-brand-soft-fg"
                        : "border-border bg-background text-muted",
                    )}
                    key={label as string}
                    onClick={() => (setter as (value: boolean) => void)(!(checked as boolean))}
                    type="button"
                  >
                    <span>{label as string}</span>
                    <CheckCircle2 className={cn("size-4", checked ? "text-brand" : "text-subtle")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-brand-soft text-brand-soft-fg rounded-xl px-3 py-2.5 text-[11px] leading-5">
              Gönder butonu, bilgisayarınızdaki varsayılan e-posta uygulamasını alıcı ve içerik hazır şekilde açar.
            </div>
          </div>

          <div className="border-border bg-card-muted/35 min-w-0 rounded-2xl border p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-foreground text-xs font-semibold">E-posta önizlemesi</p>
                <p className="text-muted mt-1 text-[11px]">Müşteriye ulaşacak içeriğin görünümü</p>
              </div>
              <span className="bg-brand-soft text-brand-soft-fg rounded-full px-2.5 py-1 text-[10px] font-bold">
                Kurumsal taslak
              </span>
            </div>
            <div className="border-border overflow-hidden rounded-2xl border shadow-sm">
              <div className="bg-sidebar text-sidebar-fg-strong px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold tracking-tight">{organization.shortName || organization.title}</p>
                    <p className="text-sidebar-accent mt-1 text-[10px] tracking-[0.14em] uppercase">SAHA OPERASYONU</p>
                  </div>
                  <Mail className="text-sidebar-accent size-5" />
                </div>
              </div>
              <div className="bg-background p-5 sm:p-6">
                <div className="border-border bg-card flex items-center gap-3 rounded-xl border px-3 py-3">
                  <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                    {(organization.shortName || organization.title).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">Gönderim bilgileri</p>
                    <p className="text-foreground mt-0.5 truncate text-xs font-semibold">
                      {mailTo || "Alıcı belirtilmedi"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-subtle text-[10px]">Konu</p>
                    <p className="text-muted mt-0.5 max-w-40 truncate text-[10px]">{mailSubject || "Tarama planı"}</p>
                  </div>
                </div>
                {mailCc && <p className="text-muted mt-2 truncate px-1 text-[10px]">CC: {mailCc}</p>}

                <div className="border-divider mt-6 border-b pb-5">
                  <p className="text-brand text-[10px] font-bold tracking-[0.16em] uppercase">Tarama bilgilendirmesi</p>
                  <h3 className="text-heading mt-2 text-xl leading-tight font-semibold tracking-tight">
                    {screening.title}
                  </h3>
                  <p className="text-muted mt-3 text-xs leading-6">
                    Merhaba {mailRecipientName},
                    <br />
                    {screening.company} için planlanan saha taramasının güncel detaylarını bilgilerinize sunarız.
                  </p>
                </div>

                {includeMailSummary && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="text-brand size-4" />
                      <p className="text-foreground text-xs font-bold">Tarama özeti</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <PreviewItem label="Tarama tarihi" value={screening.date} />
                      <PreviewItem
                        label="Saat"
                        value={`${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`}
                      />
                      <PreviewItem label="Konum" value={screening.location || "Belirtilmedi"} />
                      <PreviewItem label="Katılımcı" value={`${screening.participants} kişi`} />
                    </div>
                  </div>
                )}
                {includeMailTeam && (
                  <div className="bg-brand-soft mt-5 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <UsersRound className="text-brand-soft-fg size-4" />
                      <p className="text-brand-soft-fg text-[10px] font-bold tracking-wider uppercase">
                        Saha ekibi ve kaynaklar
                      </p>
                    </div>
                    <p className="text-foreground mt-2 text-xs font-semibold">{mailTeam}</p>
                    <p className="text-muted mt-1 text-[11px] leading-5">{mailEquipment}</p>
                  </div>
                )}
                {includeMailLink && (
                  <div className="bg-sidebar text-sidebar-fg-strong mt-5 flex items-center gap-3 rounded-xl px-4 py-3">
                    <span className="bg-sidebar-accent text-sidebar flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Eye className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">PDF eki ve tarama detayları</p>
                      <p className="text-sidebar-muted mt-0.5 truncate text-[10px]">
                        Tarama planını ve PDF içeriğini incelemek için bağlantıyı açın.
                      </p>
                    </div>
                  </div>
                )}
                <div className="border-divider mt-6 border-t pt-5">
                  <p className="text-muted text-xs leading-6">
                    Planlamayla ilgili bir değişiklik olursa bu e-posta üzerinden bizimle iletişime geçebilirsiniz.
                  </p>
                  <p className="text-foreground mt-4 text-xs leading-5 font-semibold">
                    Saygılarımızla,
                    <br />
                    {organization.title}
                    <br />
                    <span className="text-muted font-normal">
                      {organization.phone} · {organization.email}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        description="Ekip arkadaşlarını seçin, mesajı kontrol edin. WhatsApp açıldığında kişi veya grup sohbetini seçebilirsiniz."
        eyebrow="Ekip iletişimi"
        footer={
          <>
            <Button onClick={() => void copyShareMessage()} variant="outline">
              <Copy /> Mesajı kopyala
            </Button>
            <Button onClick={openWhatsApp} variant="brand">
              <Send /> WhatsApp gönder
            </Button>
          </>
        }
        icon={MessageCircle}
        onClose={() => setShareOpen(false)}
        open={shareOpen}
        className="sm:max-w-5xl"
        size="xl"
        title="Tarama ekibiyle paylaş"
      >
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-4">
            <div>
              <p className="text-foreground text-xs font-semibold">Paylaşım grubu</p>
              <p className="text-muted mt-1 text-[11px]">Mesajın başlığında görünecek hedef ekip adını belirleyin.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Saha ekibi", "Mobil sağlık ekibi", "Yönetim ekibi"].map((group) => (
                  <button
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                      shareTarget === group
                        ? "border-brand bg-brand-soft text-brand-soft-fg"
                        : "border-border text-muted hover:border-brand hover:text-brand",
                    )}
                    key={group}
                    onClick={() => setShareTarget(group)}
                    type="button"
                  >
                    {group}
                  </button>
                ))}
              </div>
              <input
                aria-label="Paylaşım grubu adı"
                className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-3 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                onChange={(event) => setShareTarget(event.target.value)}
                placeholder="Özel grup adı yazın"
                value={shareTarget}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-foreground text-xs font-semibold">Ekip arkadaşları</p>
                  <p className="text-muted mt-1 text-[11px]">Seçimler mesajın sorumlu ekip bölümüne eklenir.</p>
                </div>
                <span className="bg-brand-soft text-brand-soft-fg rounded-full px-2.5 py-1 text-[10px] font-bold">
                  {selectedMemberIds.length} seçildi
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {team
                  .filter((member) => member.active)
                  .map((member) => {
                    const selected = selectedMemberIds.includes(member.id);
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          selected ? "border-brand bg-brand-soft" : "border-border bg-card-muted hover:border-brand",
                        )}
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                        type="button"
                      >
                        <span className="bg-card text-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold">
                          {initials(member.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-xs font-semibold">{member.name}</span>
                          <span className="text-muted mt-0.5 block truncate text-[10px]">{member.role}</span>
                        </span>
                        <CheckCircle2 className={cn("size-4", selected ? "text-brand" : "text-subtle")} />
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-0 lg:self-start">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-foreground text-xs font-semibold">Mesaj önizlemesi</p>
                <p className="text-muted mt-1 text-[11px]">WhatsApp’a aktarılacak içerik</p>
              </div>
              <span className="bg-brand-soft text-brand-soft-fg rounded-full px-2.5 py-1 text-[10px] font-bold">
                Hazır mesaj
              </span>
            </div>
            <div className="border-sidebar-border bg-sidebar overflow-hidden rounded-2xl border shadow-lg">
              <div className="border-sidebar-border text-sidebar-fg-strong flex items-center gap-3 border-b px-4 py-3">
                <span className="bg-sidebar-accent text-sidebar flex size-9 items-center justify-center rounded-full">
                  <MessageCircle className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{shareTarget || "Saha ekibi"}</p>
                  <p className="text-sidebar-muted mt-0.5 text-[10px]">
                    {selectedMemberIds.length} ekip üyesi · çevrimiçi iletişim
                  </p>
                </div>
              </div>
              <div className="bg-card-muted p-5">
                <div className="bg-card relative rounded-2xl rounded-tl-md p-5 shadow-sm">
                  <pre className="text-foreground max-h-[32rem] overflow-y-auto text-[13px] leading-6 whitespace-pre-wrap">
                    {shareMessage}
                  </pre>
                  <div className="text-subtle mt-3 flex justify-end gap-1 text-[10px]">
                    Şimdi <span className="text-brand">✓✓</span>
                  </div>
                </div>
                <p className="text-muted mt-3 text-center text-[10px]">
                  WhatsApp açıldığında hedef kişi veya grup sohbetini seçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

function BackLink() {
  return (
    <Link
      className="text-muted hover:text-brand inline-flex items-center gap-2 text-xs font-semibold"
      href="/taramalar"
    >
      <ArrowLeft className="size-4" /> Taramalara dön
    </Link>
  );
}
function Overview({
  screening,
  company,
  lines,
  total,
  progress,
  onUpdateCompleted,
  onUpdateStatus,
}: {
  screening: Screening;
  company?: { name: string; sector: string; contact: string; phone: string; email: string; employees: number };
  lines: Array<{ testId: number; name: string; category: string; quantity: number; unitPrice: number }>;
  total: number;
  progress: number;
  onUpdateCompleted: (value: number) => void;
  onUpdateStatus: (status: ScreeningStatus) => void;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <CardHeader title="Tarama özeti" description="Saha operasyonunun güncel durumu" icon={ClipboardList} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Tarama türü" value={screening.screeningType ?? "Belirtilmedi"} />
            <Info
              label="Tarih ve saat"
              value={`${screening.date} · ${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`}
            />
            <Info label="Konum" value={screening.location} />
            <Info label="Katılımcı" value={`${screening.participants} kişi`} />
          </div>
          <div className="border-divider mt-5 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted text-xs font-semibold">Operasyon durumu</p>
              <p className="text-subtle mt-1 text-[11px]">Saha planının güncel aşamasını burada yönetin.</p>
            </div>
            <Select aria-label="Tarama operasyon durumu" className="h-10 w-full sm:w-48" onChange={(event) => onUpdateStatus(event.target.value as ScreeningStatus)} value={screening.status}>
              {screeningStatuses.map((status) => <option key={status}>{status}</option>)}
            </Select>
          </div>
          <div className="bg-card-muted mt-5 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-muted block font-semibold">Tamamlanma</span>
                <span className="text-subtle mt-1 block text-[11px]">Tamamlanan kişi sayısını güncelleyin.</span>
              </div>
              <label className="flex items-center gap-2">
                <Input
                  aria-label="Tamamlanan katılımcı sayısı"
                  className="h-9 w-24 text-right"
                  max={screening.participants}
                  min={0}
                  onChange={(event) => onUpdateCompleted(Number(event.target.value))}
                  type="number"
                  value={screening.completed}
                />
                <span className="text-muted">/ {screening.participants} kişi</span>
              </label>
            </div>
            <div className="bg-background mt-3 h-3 overflow-hidden rounded-full">
              <div className={cn("h-full rounded-full", progress === 100 ? "bg-success" : "bg-brand")} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Hizmet kapsamı"
            description={`${lines.length} kalem · toplam hizmet bedeli`}
            icon={ClipboardList}
          />
          <div className="mt-5 space-y-2">
            {lines.slice(0, 5).map((line) => (
              <div
                className="border-border flex items-center justify-between rounded-xl border px-3 py-3 text-xs"
                key={line.testId}
              >
                <span className="text-foreground font-semibold">{line.name}</span>
                <span className="text-muted">{line.quantity} adet</span>
              </div>
            ))}
            {lines.length > 5 && (
              <p className="text-brand pt-2 text-center text-xs font-semibold">+ {lines.length - 5} hizmet daha</p>
            )}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <CardHeader title="Operasyon bilgileri" icon={Wrench} />
          <div className="mt-5 space-y-3">
            <Info label="Sorumlu ekip" value={screening.team || "Atanmadı"} />
            <Info label="Mobil araç" value={screening.vehicle || "Atanmadı"} />
            <Info label="Genel toplam" value={money(total)} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <CardHeader title="Firma bilgileri" icon={Building2} />
          <div className="mt-5 space-y-3">
            <Info label="Firma" value={company?.name ?? screening.company} />
            <Info label="Yetkili" value={screening.contact || company?.contact || "Belirtilmedi"} />
            <Info label="Çalışan sayısı" value={`${company?.employees ?? screening.participants} kişi`} />
          </div>
        </Card>
      </div>
    </div>
  );
}
function Services({
  lines,
  total,
}: {
  lines: Array<{ testId: number; name: string; category: string; quantity: number; unitPrice: number }>;
  total: number;
}) {
  return (
    <Card className="mt-6 overflow-hidden p-5 sm:p-7">
      <CardHeader
        title={`Hizmet kapsamı · ${lines.length} kalem`}
        description="Bu taramada uygulanacak testler ve miktarlar"
        icon={ClipboardList}
      />
      <div className="border-border mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-card-muted text-subtle text-[10px] font-bold tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Test / hizmet</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Adet</th>
              <th className="px-4 py-3 text-right">Birim</th>
              <th className="px-4 py-3 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-divider divide-y">
            {lines.map((line, index) => (
              <tr key={line.testId}>
                <td className="text-brand px-4 py-3 font-semibold">{String(index + 1).padStart(2, "0")}</td>
                <td className="text-foreground px-4 py-3 font-semibold">{line.name}</td>
                <td className="text-muted px-4 py-3">{line.category}</td>
                <td className="text-muted px-4 py-3 text-right">{line.quantity}</td>
                <td className="text-muted px-4 py-3 text-right">{money(line.unitPrice)}</td>
                <td className="text-foreground px-4 py-3 text-right font-semibold">
                  {money(line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-divider bg-card-muted border-t">
            <tr className="font-bold">
              <td className="text-muted px-4 py-3" colSpan={5}>
                Genel toplam
              </td>
              <td className="text-foreground px-4 py-3 text-right">{money(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
function FieldPlan({
  screening,
  team,
  equipment,
}: {
  screening: Screening;
  team: Array<{ id: number; name: string; profession: string }>;
  equipment: Array<{ id: number; name: string; kind: string }>;
}) {
  const members = screening.teamMembers?.map((name) => team.find((person) => person.name === name)?.name ?? name) ?? [];
  const assets = screening.equipmentIds?.map((id) => equipment.find((item) => item.id === id)).filter(Boolean) ?? [];
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-7">
        <CardHeader title="Saha zamanı ve konumu" icon={CalendarDays} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="Başlangıç" value={`${screening.date} · ${screening.time}`} />
          <Info
            label="Bitiş"
            value={`${screening.endDate ?? screening.date} · ${screening.endTime ?? "Belirtilmedi"}`}
          />
          <Info label="Konum" value={screening.location} />
          <Info label="Araç" value={screening.vehicle} />
        </div>
      </Card>
      <Card className="p-5 sm:p-7">
        <CardHeader title="Ekip ve ekipman" icon={Wrench} />
        <div className="mt-5 space-y-3">
          <List
            title="Sorumlu ekip üyeleri"
            values={members.length ? members : screening.team ? [screening.team] : []}
          />
          <List
            title="Kullanılacak kaynaklar"
            values={assets.map((item) => (item ? `${item.name} · ${item.kind}` : "")).filter(Boolean)}
          />
        </div>
      </Card>
    </div>
  );
}
function CompanyInfo({
  screening,
  company,
}: {
  screening: Screening;
  company?: {
    name: string;
    sector: string;
    city: string;
    district: string;
    contact: string;
    phone: string;
    email: string;
    employees: number;
  };
}) {
  return (
    <Card className="mt-6 max-w-3xl p-5 sm:p-7">
      <CardHeader title="Firma bilgileri" description="Taramanın bağlı olduğu müşteri kaydı" icon={Building2} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="Firma unvanı" value={company?.name ?? screening.company} />
        <Info label="Sektör" value={company?.sector ?? "Belirtilmedi"} />
        <Info label="Yetkili" value={screening.contact || company?.contact || "Belirtilmedi"} />
        <Info label="Telefon" value={company?.phone ?? "Belirtilmedi"} />
        <Info label="E-posta" value={screening.email || company?.email || "Belirtilmedi"} />
        <Info label="Çalışan sayısı" value={`${company?.employees ?? screening.participants} kişi`} />
        <Info label="Adres" value={company ? `${company.district}, ${company.city}` : "Belirtilmedi"} />
      </div>
    </Card>
  );
}
type NotesDraft = { coverLetter: string; conditions: string; notes: string };

function Notes({
  screening,
  draft,
  editing,
  onBeginEdit,
  onCancelEdit,
  onSave,
  onUpdateDraft,
  onAddAttachment,
  onRemoveAttachment,
}: {
  screening: Screening;
  draft: NotesDraft;
  editing: boolean;
  onBeginEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onUpdateDraft: (field: keyof NotesDraft, value: string) => void;
  onAddAttachment: (file: File | undefined) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const editor = (label: string, field: keyof NotesDraft, placeholder: string) =>
    editing ? (
      <textarea
        className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-5 min-h-36 w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none focus:ring-2"
        onChange={(event) => onUpdateDraft(field, event.target.value)}
        placeholder={placeholder}
        value={draft[field]}
        aria-label={label}
      />
    ) : (
      <p className="bg-card-muted text-muted mt-5 min-h-24 rounded-xl p-4 text-sm leading-6 whitespace-pre-line">
        {draft[field] || `${label} eklenmemiş.`}
      </p>
    );

  return (
    <div className="mt-6 space-y-6">
      <Card className="p-5 sm:p-7">
        <CardHeader
          action={
            editing ? (
              <div className="flex gap-2">
                <Button onClick={onCancelEdit} size="sm" variant="ghost">
                  <X /> Vazgeç
                </Button>
                <Button onClick={onSave} size="sm" variant="brand">
                  <Save /> Kaydet
                </Button>
              </div>
            ) : (
              <Button onClick={onBeginEdit} size="sm" variant="outline">
                <Edit3 /> Düzenle
              </Button>
            )
          }
          description={
            editing
              ? "Ön yazı, şartlar ve iç not alanlarını birlikte güncelleyin."
              : "Tarama iletişim ve uygulama metinleri."
          }
          title="Tarama notları"
          icon={FileText}
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">Ön yazı</p>
            {editor("Ön yazı", "coverLetter", "Tarama için müşteriye gösterilecek ön yazıyı girin...")}
          </div>
          <div>
            <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">Şartlar ve koşullar</p>
            {editor("Şartlar ve koşullar", "conditions", "Tarama uygulamasına ait şartları ve koşulları girin...")}
          </div>
          <div className="lg:col-span-2">
            <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">İç not</p>
            {editor("İç not", "notes", "Ekip için vardiya, hazırlık veya takip notu girin...")}
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <CardHeader
          description="Sözleşme, saha planı, teknik doküman ve diğer dosyaları tarama kaydında saklayın."
          title="Ek dosyalar"
          icon={Paperclip}
        />
        <label className="border-border-strong bg-card-muted text-muted hover:border-brand hover:text-brand mt-5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-xs font-semibold transition-colors">
          <Paperclip className="mr-2 size-4" /> Dosya ekle
          <input className="sr-only" onChange={(event) => onAddAttachment(event.target.files?.[0])} type="file" />
        </label>
        <div className="mt-4 space-y-2">
          {(screening.attachments ?? []).length ? (
            screening.attachments?.map((attachment) => (
              <div
                className="border-border bg-card-muted flex items-center justify-between gap-3 rounded-xl border px-3 py-3"
                key={attachment.id}
              >
                <a
                  className="text-foreground hover:text-brand min-w-0 truncate text-xs font-semibold hover:underline"
                  download={attachment.name}
                  href={attachment.dataUrl || "#"}
                  rel="noreferrer"
                  target={attachment.dataUrl ? "_blank" : undefined}
                >
                  {attachment.name}
                </a>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-muted text-[11px]">{Math.max(1, Math.round(attachment.size / 1024))} KB</span>
                  {editing && (
                    <Button
                      aria-label={`${attachment.name} dosyasını kaldır`}
                      onClick={() => onRemoveAttachment(attachment.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="bg-card-muted text-muted rounded-xl p-4 text-sm">Henüz ek dosya bulunmuyor.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
function Activity({ screening }: { screening: Screening }) {
  return (
    <Card className="mt-6 max-w-3xl p-5 sm:p-7">
      <CardHeader title="Aktivite geçmişi" description="Tarama planının yaşam döngüsü" icon={History} />
      <div className="border-border mt-6 space-y-5 border-l pl-5">
        <ActivityItem
          title="Tarama oluşturuldu"
          description={`${screening.company} için saha planı oluşturuldu.`}
          date={screening.date}
        />
        <ActivityItem
          title={`Durum: ${screening.status}`}
          description="Tarama durumunun güncel görünümü."
          date={`${screening.date} · ${screening.time}`}
        />
        <ActivityItem
          title="Saha planı hazırlandı"
          description={`${screening.team || "Ekip atanmadı"} · ${screening.vehicle || "Araç atanmadı"}`}
          date={screening.date}
        />
      </div>
    </Card>
  );
}
function ActivityItem({ title, description, date }: { title: string; description: string; date: string }) {
  return (
    <div className="relative">
      <span className="border-background bg-brand absolute top-1.5 -left-[26px] size-3 rounded-full border-2" />
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <p className="text-muted mt-1 text-xs">{description}</p>
      <p className="text-subtle mt-1 text-[11px]">{date}</p>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-muted rounded-xl px-3 py-3">
      <p className="text-subtle text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      <p className="text-foreground mt-1 text-xs font-semibold">{value || "Belirtilmedi"}</p>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-muted rounded-xl px-3 py-2.5">
      <p className="text-subtle text-[10px] font-semibold uppercase">{label}</p>
      <p className="text-foreground mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  );
}

function List({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <p className="text-subtle mb-2 text-[10px] font-bold tracking-wider uppercase">{title}</p>
      {values.length ? (
        <div className="space-y-2">
          {values.map((value) => (
            <div
              className="border-border bg-card-muted text-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
              key={value}
            >
              <CheckCircle2 className="text-brand size-4" />
              {value}
            </div>
          ))}
        </div>
      ) : (
        <p className="bg-card-muted text-muted rounded-xl p-3 text-xs">Atanmadı</p>
      )}
    </div>
  );
}
