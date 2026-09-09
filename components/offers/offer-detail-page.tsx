"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  Eye,
  ExternalLink,
  FileDown,
  Edit3,
  History,
  LayoutDashboard,
  ListChecks,
  FileText,
  Mail,
  Paperclip,
  Bell,
  Receipt,
  Save,
  ScrollText,
  Share2,
  Send,
  Tag,
  MessageSquareText,
  Trash2,
  Truck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, Modal } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, useOffers, useOrganization } from "@/lib/data";
import { offerStatuses, type Offer, type OfferStatus } from "@/lib/demo-data";
import { labelToIso, money, todayIso } from "@/lib/format";
import { useNotice } from "@/lib/hooks";
import { useHydrated } from "@/lib/storage";
import { cn, initials } from "@/lib/utils";
import { downloadOfferPdf, downloadServiceSummaryPdf, previewOfferPdf } from "@/lib/pdf/offer-pdf";

export default function OfferDetailPage({ offerId }: { offerId: string }) {
  const hydrated = useHydrated();
  const [offers, setOffers] = useOffers();
  const [companies] = useCompanies();
  const [organization] = useOrganization();
  const [notice, showNotice] = useNotice();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "response" | "activity" | "financial" | "company"
  >("overview");
  const router = useRouter();

  const offer = offers.find((item) => item.id === Number(offerId));
  const company = companies.find((c) => c.id === offer?.companyId);
  const [editingOfferNotes, setEditingOfferNotes] = useState(false);
  const [offerNotesDraft, setOfferNotesDraft] = useState(offer?.notes ?? "");
  const [editingAttachments, setEditingAttachments] = useState(false);
  const [reminderDate, setReminderDate] = useState(
    () => offer?.reminder?.date || getAutomaticReminderDate(offer?.validUntil),
  );
  const [reminderNote, setReminderNote] = useState(() => offer?.reminder?.note || "Teklif geçerlilik kontrolü");
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailBcc, setMailBcc] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [includeMailSummary, setIncludeMailSummary] = useState(true);
  const [includeMailCoverLetter, setIncludeMailCoverLetter] = useState(true);
  const [includeMailLink, setIncludeMailLink] = useState(true);

  useEffect(() => {
    if (!hydrated || !offer || offer.reminder || !getAutomaticReminderDate(offer.validUntil)) return;
    const reminder = { date: getAutomaticReminderDate(offer.validUntil), note: "Teklif geçerlilik kontrolü" };
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, reminder } : item)));
  }, [hydrated, offer, setOffers]);

  if (!hydrated) return <DetailSkeleton />;
  if (!offer) {
    return (
      <Page>
        <BackLink />
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/teklifler">
                <ArrowLeft /> Teklif listesine dön
              </Link>
            </Button>
          }
          className="mt-6"
          description="Aradığınız teklif silinmiş veya bağlantı hatalı olabilir."
          icon={FileText}
          title="Teklif bulunamadı"
        />
      </Page>
    );
  }

  const isExpired = () => {
    const iso = labelToIso(offer.validUntil);
    return Boolean(iso) && iso < todayIso() && offer.status !== "Süresi doldu";
  };

  const updateStatus = (status: OfferStatus) => {
    const createdAt = new Date().toLocaleString("tr-TR");
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? {
              ...item,
              status,
              activities: [
                ...(item.activities ?? []),
                {
                  id: `${Date.now()}`,
                  type: status === "Gönderildi" ? "sent" : "responded",
                  title: `Durum güncellendi: ${status}`,
                  description: "Teklif durumu değiştirildi.",
                  createdAt,
                },
              ],
            }
          : item,
      ),
    );
    showNotice("Teklif durumu güncellendi.");
  };

  const removeOffer = () => {
    setOffers((current) => current.filter((item) => item.id !== offer.id));
    showNotice("Teklif silindi.");
    window.setTimeout(() => router.push("/teklifler"), 500);
  };

  const subtotal = offer.lines?.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) ?? offer.total;
  const discount = offer.discount ?? 0;
  const discountAmount = Math.min(discount, subtotal);
  const tax = offer.tax ?? 0;
  const netAmount = subtotal - discountAmount;
  const taxAmount = Math.round((netAmount * tax) / 100);
  const total = netAmount + taxAmount;
  const shareToken = offer.shareToken || String(offer.id);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/teklif-yanit/${offer.id}?paylas=${encodeURIComponent(shareToken)}`
      : `/teklif-yanit/${offer.id}?paylas=${encodeURIComponent(shareToken)}`;
  const mailRecipientName = offer.contact || company?.contact || "Yetkili";
  const mailItemRows = offer.lines?.slice(0, 5) ?? [];
  const mailItemOverflow = Math.max((offer.lines?.length ?? 0) - mailItemRows.length, 0);
  const mailItems = offer.lines?.length
    ? offer.lines.map((line) => `${line.name} (${line.quantity} adet)`).join(", ")
    : `${offer.items} hizmet kalemi`;
  const mailItemsHtml = mailItemRows.length
    ? `${mailItemRows.map((line) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-bottom:1px solid #dfe7ec"><span>${escapeHtml(line.name)}</span><strong style="color:#1d5b91">${line.quantity} adet</strong></div>`).join("")}${mailItemOverflow > 0 ? `<div style="color:#66798b;font-size:11px;margin-top:8px">+${mailItemOverflow} kalem daha · Ayrıntılar PDF dosyasında</div>` : ""}`
    : `<div style="color:#66798b;font-size:12px">Hizmet kalemi belirtilmedi.</div>`;
  const mailBody = [
    `Merhaba ${mailRecipientName},`,
    "",
    `${offer.company} için hazırladığımız ${offer.title} teklifini bilgilerinize sunarız.`,
    ...(includeMailCoverLetter && offer.coverLetterText ? ["", "TEKLİF ÖN YAZISI", offer.coverLetterText] : []),
    ...(includeMailSummary
      ? [
          "",
          "TEKLİF ÖZETİ",
          `Hizmetler: ${mailItems}`,
          `Geçerlilik: ${offer.validUntil}`,
          "Fiyatlandırma ve diğer teklif detayları için PDF dosyasını inceleyebilirsiniz.",
        ]
      : []),
    ...(includeMailLink
      ? [
          "",
          "TEKLİF PAYLAŞIMI",
          "Teklifi incelemek, onaylamak veya değişiklik talebi iletmek için aşağıdaki bağlantıyı açabilirsiniz.",
          shareUrl,
        ]
      : []),
    "",
    "Sorularınız veya değişiklik talepleriniz için bizimle iletişime geçebilirsiniz.",
    "",
    `Saygılarımızla,\n${organization.title}\n${organization.phone} · ${organization.email}`,
  ].join("\n");
  const mailHtml = `<div style="font-family:Arial,sans-serif;color:#17324d;line-height:1.7"><div style="background:#123d56;color:#fff;padding:20px;border-radius:12px 12px 0 0"><strong>${escapeHtml(organization.shortName || organization.title)}</strong><div style="color:#c9ddec;font-size:11px;margin-top:5px;letter-spacing:1px">TEKLİF BİLGİLENDİRMESİ</div></div><div style="padding:24px;background:#f7fafc"><p>Merhaba ${escapeHtml(mailRecipientName)},</p><p>${escapeHtml(offer.company)} için hazırladığımız <strong>${escapeHtml(offer.title)}</strong> teklifini bilgilerinize sunarız.</p>${includeMailCoverLetter && offer.coverLetterText ? `<div style="border-left:4px solid #1d6f91;background:#eef5f8;margin-top:20px;padding:16px 18px;border-radius:0 12px 12px 0"><div style="color:#1d5b91;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Teklif ön yazısı</div><div style="margin-top:8px;font-size:13px;white-space:pre-line">${escapeHtml(offer.coverLetterText)}</div></div>` : ""}${includeMailSummary ? `<div style="background:#e8f0f8;padding:16px;border-radius:12px;margin-top:20px"><strong>Teklif kapsamı</strong><div style="margin-top:10px">${mailItemsHtml}</div><p style="color:#66798b;font-size:11px;margin:12px 0 0;border-top:1px solid #dfe7ec;padding-top:10px">Fiyatlandırma ve diğer teklif detayları için ekli PDF dosyasını inceleyebilirsiniz.</p></div>` : ""}${includeMailLink ? `<div style="background:#123d56;margin-top:20px;padding:16px;border-radius:12px"><div style="color:#c9ddec;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Teklif paylaşımı</div><div style="color:#fff;font-size:13px;font-weight:700;margin-top:7px">Teklifi incelemek ve onaylamak için bağlantıyı açın.</div><a href="${escapeHtml(shareUrl)}" style="display:inline-block;color:#fff;text-decoration:none;font-size:12px;font-weight:700;margin-top:12px">Teklifi incele ve yanıtla →</a></div>` : ""}<p style="border-top:1px solid #e9eef2;margin-top:24px;padding-top:20px">Sorularınız veya değişiklik talepleriniz için bizimle iletişime geçebilirsiniz.<br><br><strong>Saygılarımızla,<br>${escapeHtml(organization.title)}</strong><br>${escapeHtml(organization.phone)} · ${escapeHtml(organization.email)}</p></div></div>`;
  const openMailComposer = () => {
    setMailTo(company?.email || "");
    setMailCc("");
    setMailBcc("");
    setMailSubject(`Teklif | ${offer.company} | ${offer.title}`);
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
        showNotice("Biçimli teklif e-postası panoya kopyalandı.");
      } else {
        await navigator.clipboard.writeText(mailBody);
        showNotice("Teklif e-postası düz metin olarak kopyalandı.");
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
    markOfferSent();
    window.location.assign(`mailto:${mailTo.trim()}?${params.toString()}`);
    setMailOpen(false);
  };
  const createRevision = () => {
    const currentRevision = offer.revision ?? 1;
    const createdAt = new Date().toLocaleDateString("tr-TR");
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? {
              ...item,
              revision: currentRevision + 1,
              revisionHistory: [
                ...(item.revisionHistory ?? []),
                {
                  revision: currentRevision,
                  createdAt: item.createdAt,
                  note: "Önceki teklif sürümü",
                  status: item.status,
                },
              ],
              createdAt,
            }
          : item,
      ),
    );
    showNotice(`Revizyon ${currentRevision + 1} oluşturuldu.`);
  };
  const addActivity = (title: string, type: "pdf" | "viewed" = "pdf") => {
    const createdAt = new Date().toLocaleString("tr-TR");
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? {
              ...item,
              activities: [
                ...(item.activities ?? []),
                { id: `${Date.now()}`, type, title, description: "Teklif hareketi kaydedildi.", createdAt },
              ],
            }
          : item,
      ),
    );
  };
  const markOfferSent = () => {
    const createdAt = new Date().toLocaleString("tr-TR");
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? {
              ...item,
              status: item.status === "Taslak" ? "Gönderildi" : item.status,
              emailStatus: "Gönderildi",
              activities: [
                ...(item.activities ?? []),
                {
                  id: `${Date.now()}`,
                  type: "sent",
                  title: "Teklif paylaşıldı",
                  description: "Teklif bağlantısı müşteri ile paylaşıma hazırlandı.",
                  createdAt,
                },
              ],
            }
          : item,
      ),
    );
    showNotice("Teklif gönderildi olarak işaretlendi.");
  };
  const saveReminder = () => {
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id ? { ...item, reminder: { date: reminderDate, note: reminderNote } } : item,
      ),
    );
    showNotice("Teklif hatırlatıcısı kaydedildi.");
  };
  const addAttachment = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const attachment = {
        id: `${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        createdAt: new Date().toLocaleString("tr-TR"),
      };
      setOffers((current) =>
        current.map((item) =>
          item.id === offer.id ? { ...item, attachments: [...(item.attachments ?? []), attachment] } : item,
        ),
      );
      showNotice("Ek dosya teklife eklendi.");
    });
    reader.readAsDataURL(file);
  };
  const saveOfferNotes = () => {
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, notes: offerNotesDraft } : item)));
    setEditingOfferNotes(false);
    showNotice("Teklif notu kaydedildi.");
  };
  const cancelOfferNotes = () => {
    setOfferNotesDraft(offer.notes ?? "");
    setEditingOfferNotes(false);
  };
  const removeAttachment = (attachmentId: string) => {
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? { ...item, attachments: (item.attachments ?? []).filter((attachment) => attachment.id !== attachmentId) }
          : item,
      ),
    );
    showNotice("Ek dosya kaldırıldı.");
  };
  const tabItems = [
    ["overview", "Genel bakış", LayoutDashboard],
    ["services", "Hizmetler", ListChecks],
    ["financial", "Finans", WalletCards],
    ["company", "Firma bilgileri", Building2],
    ["response", "Yanıt ve belgeler", MessageSquareText],
    ["activity", "Aktivite geçmişi", History],
  ] as const;

  return (
    <Page>
      <BackLink />
      {notice && (
        <Alert className="mt-4 w-fit" icon={CheckCircle2}>
          {notice}
        </Alert>
      )}

      {/* Header card */}
      <Card className="border-sidebar-border bg-sidebar relative mt-6 overflow-hidden p-5 shadow-xl sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-right opacity-80"
          style={{ backgroundImage: "url('/images/screening-detail-hero-v1.png')" }}
        />
        <div aria-hidden="true" className="bg-sidebar/25 pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" text={initials(offer.company)} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-sidebar-fg-strong text-2xl font-semibold tracking-[-0.04em]">{offer.title}</h1>
                <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
                {isExpired() && <Badge tone="warning">Süresi geçti</Badge>}
              </div>
              <p className="text-sidebar-muted mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                <span className="text-sidebar-accent text-xs font-bold tracking-[0.08em]">{offer.number}</span>
                <span className="mx-1">·</span>
                <Building2 className="size-4" /> {offer.company}
                {company && (
                  <Link className="text-brand ml-1 hover:underline" href={`/firmalar/${company.id}`}>
                    Firma detayı
                  </Link>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              className="bg-sidebar-accent text-sidebar hover:bg-sidebar-fg-strong hover:text-sidebar"
              onClick={() => {
                addActivity("PDF indirildi");
                void downloadOfferPdf(offer, organization, company);
              }}
              size="sm"
              variant="brand"
            >
              <FileDown /> PDF indir
            </Button>
            <Button
              className="border-sidebar-border bg-sidebar-hover text-sidebar-fg-strong hover:bg-sidebar-active hover:text-sidebar-fg-strong"
              onClick={() => {
                addActivity("PDF önizlendi", "viewed");
                void previewOfferPdf(offer, organization, company);
              }}
              size="sm"
              variant="outline"
            >
              <Eye /> PDF önizleme
            </Button>
            <Button onClick={openMailComposer} size="sm" variant="outline">
              <Mail /> E-posta gönder
            </Button>
            <Button
              asChild
              className="border-sidebar-border bg-sidebar-hover text-sidebar-fg-strong hover:bg-sidebar-active hover:text-sidebar-fg-strong"
              size="sm"
              variant="secondary"
            >
              <Link href={`/teklifler/yeni?edit=${offer.id}`}>
                <Edit3 /> Düzenle
              </Link>
            </Button>
            <Button
              className="border-danger/50 text-danger hover:bg-danger-soft"
              onClick={() => setConfirmDelete(true)}
              size="sm"
              variant="danger-outline"
            >
              <Trash2 /> Sil
            </Button>
          </div>
        </div>
        <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile dark icon={Receipt} label="Teklif toplamı" value={money(total)} />
          <StatTile
            dark
            icon={ClipboardList}
            label="Hizmet kalemi"
            value={`${offer.lines?.length ?? offer.items} kalem`}
          />
          <StatTile dark icon={Tag} label="Teklif türü" value={offer.offerType ?? "Belirtilmedi"} />
          <StatTile dark icon={CalendarDays} label="Geçerlilik" value={offer.validUntil} />
        </div>
      </Card>

      <div className="border-border bg-card/95 sticky top-16 z-10 mt-6 flex gap-1 overflow-x-auto rounded-xl border p-1 shadow-sm backdrop-blur-xl" role="tablist">
        {tabItems.map(([value, label, Icon]) => (
          <button
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors sm:px-4",
              activeTab === value ? "bg-brand-soft text-brand-soft-fg shadow-sm" : "text-muted hover:bg-card-muted hover:text-foreground",
            )}
            aria-selected={activeTab === value}
            key={value}
            onClick={() => setActiveTab(value as typeof activeTab)}
            role="tab"
            type="button"
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          {/* Left column — content sections */}
          <div className="space-y-6">
            {/* Service items */}
            {offer.lines && offer.lines.length > 0 && (
              <Card className="p-5 sm:p-6">
                <CardHeader
                  description="Teklife dahil edilen test ve muayene kalemleri"
                  title="Hizmet kalemleri"
                  icon={ClipboardList}
                />
                <div className="border-border mt-5 overflow-hidden rounded-xl border">
                  <table className="w-full text-left">
                    <thead className="border-divider bg-card-muted border-b">
                      <tr>
                        <th className="text-subtle px-3 py-2 text-[10px] font-bold tracking-wider uppercase">Test</th>
                        <th className="text-subtle px-3 py-2 text-right text-[10px] font-bold tracking-wider uppercase">
                          Adet
                        </th>
                        <th className="text-subtle px-3 py-2 text-right text-[10px] font-bold tracking-wider uppercase">
                          Birim
                        </th>
                        <th className="text-subtle px-3 py-2 text-right text-[10px] font-bold tracking-wider uppercase">
                          Tutar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-divider divide-y">
                      {offer.lines.map((line) => (
                        <tr className="text-xs" key={line.testId}>
                          <td className="text-foreground px-3 py-2 font-semibold">{line.name}</td>
                          <td className="text-muted px-3 py-2 text-right">{line.quantity}</td>
                          <td className="text-muted px-3 py-2 text-right">{money(line.unitPrice)}</td>
                          <td className="text-foreground px-3 py-2 text-right font-semibold">
                            {money(line.unitPrice * line.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-divider bg-card-muted border-t">
                      <tr className="text-xs font-bold">
                        <td className="text-muted px-3 py-2" colSpan={3}>
                          Ara toplam
                        </td>
                        <td className="text-foreground px-3 py-2 text-right">{money(subtotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}

            {/* Cover letter */}
            {offer.coverLetterText && (
              <Card className="p-5 sm:p-6">
                <CardHeader title="Ön yazı" icon={Mail} />
                <div className="bg-card-muted text-muted mt-5 rounded-xl p-4 text-[11px] leading-6 whitespace-pre-line">
                  {offer.coverLetterText}
                </div>
              </Card>
            )}

            {/* Conditions */}
            {offer.conditionsText && (
              <Card className="p-5 sm:p-6">
                <CardHeader title="Şartlar ve koşullar" icon={ScrollText} />
                <div className="bg-card-muted text-muted mt-5 rounded-xl p-4 text-[11px] leading-6 whitespace-pre-line">
                  {offer.conditionsText}
                </div>
              </Card>
            )}

            <Card className="p-5 sm:p-6">
              <CardHeader
                action={
                  editingOfferNotes ? (
                    <div className="flex gap-2">
                      <Button onClick={cancelOfferNotes} size="sm" variant="ghost">
                        <X /> Vazgeç
                      </Button>
                      <Button onClick={saveOfferNotes} size="sm" variant="brand">
                        <Save /> Kaydet
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setOfferNotesDraft(offer.notes ?? "");
                        setEditingOfferNotes(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Edit3 /> Düzenle
                    </Button>
                  )
                }
                title="Teklif notları ve iletişim"
                icon={FileText}
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="border-border bg-card-muted rounded-xl border p-4">
                  <p className="text-subtle text-[10px] font-semibold tracking-wider uppercase">Firma yetkilisi</p>
                  <p className="text-foreground mt-1 text-sm font-semibold">{offer.contact || "Belirtilmedi"}</p>
                  {company?.email && (
                    <a
                      className="text-brand mt-2 inline-flex items-center gap-1.5 text-xs hover:underline"
                      href={`mailto:${company.email}`}
                    >
                      <Mail className="size-3.5" /> {company.email}
                    </a>
                  )}
                </div>
                <div className="border-border bg-card-muted rounded-xl border p-4 sm:col-span-1">
                  <p className="text-subtle text-[10px] font-semibold tracking-wider uppercase">İç not</p>
                  {editingOfferNotes ? (
                    <textarea
                      aria-label="Teklif iç notu"
                      className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 min-h-28 w-full resize-y rounded-lg border px-3 py-2 text-xs leading-5 outline-none focus:ring-2"
                      onChange={(event) => setOfferNotesDraft(event.target.value)}
                      placeholder="Teklif için iç not ekleyin..."
                      value={offerNotesDraft}
                    />
                  ) : (
                    <p className="text-muted mt-1 text-xs leading-5 whitespace-pre-line">
                      {offer.notes || "Bu teklif için iç not eklenmemiş."}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Company info */}
            {company && (
              <Card className="p-5 sm:p-6">
                <CardHeader
                  action={
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/firmalar/${company.id}`}>
                        Firma detayı <ArrowLeft className="rotate-180" />
                      </Link>
                    </Button>
                  }
                  title="Firma bilgileri"
                  icon={Building2}
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoField label="Firma unvanı" value={company.name} />
                  <InfoField label="Sektör" value={company.sector} />
                  <InfoField label="Yetkili" value={company.contact} />
                  <InfoField label="Telefon" value={company.phone} />
                  <InfoField label="E-posta" value={company.email} />
                  <InfoField label="Çalışan sayısı" value={`${company.employees} kişi`} />
                </div>
              </Card>
            )}
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-6">
            {/* Price summary */}
            <Card className="p-5 sm:p-6 lg:sticky lg:top-6 lg:h-fit">
              <CardHeader title="Fiyat özeti" icon={Receipt} />
              <dl className="text-muted mt-5 space-y-3 text-xs">
                <div className="flex justify-between gap-3">
                  <dt>Ara toplam</dt>
                  <dd className="text-foreground font-semibold">{money(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt>İndirim</dt>
                    <dd className="text-foreground font-semibold">-{money(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt>Net tutar</dt>
                  <dd className="text-foreground font-semibold">{money(netAmount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>KDV (%{tax})</dt>
                  <dd className="text-foreground font-semibold">{money(taxAmount)}</dd>
                </div>
                <div className="border-divider text-heading flex justify-between gap-3 border-t pt-3 text-sm font-bold">
                  <dt>Genel toplam</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
            </Card>

            {/* Payment & delivery */}
            <Card className="p-5 sm:p-6">
              <CardHeader title="Ödeme ve teslimat" icon={CreditCard} />
              <dl className="mt-5 space-y-3 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Ödeme vadesi</dt>
                  <dd className="text-foreground font-semibold">{offer.paymentTerms ?? "Belirtilmedi"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Teslim süresi</dt>
                  <dd className="text-foreground flex items-center gap-1.5 font-semibold">
                    <Truck className="text-brand size-3.5" />
                    {offer.deliveryDays ? `${offer.deliveryDays} iş günü` : "Belirtilmedi"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Oluşturulma</dt>
                  <dd className="text-foreground font-semibold">{offer.createdAt}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Geçerlilik</dt>
                  <dd className="text-foreground font-semibold">{offer.validUntil}</dd>
                </div>
              </dl>
            </Card>

            {/* Status management */}
            <Card className="p-5 sm:p-6">
              <CardHeader title="Durum yönetimi" icon={CheckCircle2} />
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted text-xs">Mevcut durum</span>
                  <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {offerStatuses.map((status) => (
                    <button
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors",
                        offer.status === status
                          ? "border-brand-outline bg-brand-soft text-brand-soft-fg"
                          : "border-border text-muted hover:border-border-strong hover:text-foreground",
                      )}
                      key={status}
                      onClick={() => updateStatus(status)}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {offer.status === "Taslak" && (
                  <Button className="w-full" onClick={() => updateStatus("Gönderildi")} size="sm">
                    <Send /> Gönderildi olarak işaretle
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader title="Teklif paylaşımı" icon={Share2} />
              <p className="text-muted mt-3 text-xs leading-5">
                Bu bağlantı firma yetkilisine gönderilebilir. QR kodu da aynı teklif bağlantısını açar.
              </p>
              <p className="text-brand mt-2 text-xs font-semibold">
                Gönderim durumu: {offer.emailStatus ?? "Bekliyor"}
              </p>
              <div className="border-border bg-card-muted mt-4 flex items-center gap-2 rounded-xl border p-2">
                <span className="text-muted min-w-0 flex-1 truncate text-[11px]">{shareUrl}</span>
                <Button
                  aria-label="Teklif bağlantısını kopyala"
                  onClick={() => {
                    markOfferSent();
                    void navigator.clipboard?.writeText(shareUrl);
                    showNotice("Teklif bağlantısı kopyalandı.");
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Copy />
                </Button>
                <Button asChild aria-label="Paylaşım bağlantısını aç" size="icon" variant="ghost">
                  <a href={shareUrl} onClick={markOfferSent} rel="noreferrer" target="_blank">
                    <ExternalLink />
                  </a>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => updateStatus("Onaylandı")} size="sm" variant="secondary">
                  Onaylandı
                </Button>
                <Button onClick={() => updateStatus("Reddedildi")} size="sm" variant="danger-outline">
                  Reddet
                </Button>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader
                action={
                  <Button onClick={createRevision} size="sm" variant="outline">
                    <History /> Yeni revizyon
                  </Button>
                }
                title="Revizyon geçmişi"
                icon={History}
              />
              <div className="mt-4 space-y-3">
                <div className="bg-card-muted flex items-center justify-between rounded-xl p-3 text-xs">
                  <span className="text-foreground font-semibold">Revizyon {offer.revision ?? 1}</span>
                  <span className="text-muted">{offer.createdAt}</span>
                </div>
                {(offer.revisionHistory ?? []).map((revision) => (
                  <div
                    className="border-border flex items-center justify-between rounded-xl border p-3 text-xs"
                    key={`${revision.revision}-${revision.createdAt}`}
                  >
                    <span className="text-foreground font-semibold">Revizyon {revision.revision}</span>
                    <span className="text-muted">{revision.createdAt}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader
                action={
                  <Button onClick={() => setEditingAttachments((current) => !current)} size="sm" variant="outline">
                    <Edit3 /> {editingAttachments ? "Tamam" : "Düzenle"}
                  </Button>
                }
                title="Ek dosyalar"
                icon={Paperclip}
              />
              <label className="border-border-strong bg-card-muted text-muted hover:border-brand hover:text-brand mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-xs font-semibold transition-colors">
                <Paperclip className="mr-2 size-4" /> Dosya ekle
                <input className="sr-only" onChange={(event) => addAttachment(event.target.files?.[0])} type="file" />
              </label>
              {(offer.attachments ?? []).length > 0 && (
                <div className="mt-3 space-y-2">
                  {offer.attachments?.map((attachment) => (
                    <div
                      className="bg-card-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs"
                      key={attachment.id}
                    >
                      <a
                        className="text-foreground hover:text-brand truncate font-semibold hover:underline"
                        download={attachment.name}
                        href={attachment.dataUrl || "#"}
                        rel="noreferrer"
                        target={attachment.dataUrl ? "_blank" : undefined}
                      >
                        {attachment.name}
                      </a>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-muted">{Math.max(1, Math.round(attachment.size / 1024))} KB</span>
                        {editingAttachments && (
                          <Button
                            aria-label={`${attachment.name} dosyasını kaldır`}
                            onClick={() => removeAttachment(attachment.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader title="Hatırlatıcı" icon={Bell} />
              <p className="bg-brand-soft text-brand-soft-fg mt-3 rounded-lg px-3 py-2 text-[11px] leading-5">
                Otomatik aktif: Geçerlilik tarihinden 7 gün önce kontrol hatırlatması oluşturulur. Tarihi ve notu
                değiştirebilirsiniz.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-foreground text-xs font-semibold">
                  Hatırlatma tarihi
                  <input
                    className="border-border bg-background text-foreground mt-2 h-10 w-full rounded-lg border px-3 text-xs"
                    onChange={(event) => setReminderDate(event.target.value)}
                    type="date"
                    value={reminderDate}
                  />
                </label>
                <label className="text-foreground text-xs font-semibold">
                  Not
                  <input
                    className="border-border bg-background text-foreground mt-2 h-10 w-full rounded-lg border px-3 text-xs"
                    onChange={(event) => setReminderNote(event.target.value)}
                    placeholder="Yanıt kontrolü"
                    value={reminderNote}
                  />
                </label>
              </div>
              <Button className="mt-3 w-full" onClick={saveReminder} size="sm" variant="secondary">
                <Bell /> Hatırlatıcı kaydet
              </Button>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader title="Aktivite geçmişi" icon={History} />
              <div className="border-border mt-4 space-y-4 border-l pl-4">
                {(
                  offer.activities ?? [
                    {
                      id: "created",
                      type: "created" as const,
                      title: "Teklif oluşturuldu",
                      description: "Teklif kaydı oluşturuldu.",
                      createdAt: offer.createdAt,
                    },
                  ]
                )
                  .slice()
                  .reverse()
                  .map((activity) => (
                    <div className="relative" key={activity.id}>
                      <span className="bg-brand absolute top-1.5 -left-[21px] size-2.5 rounded-full" />
                      <p className="text-foreground text-xs font-semibold">{activity.title}</p>
                      <p className="text-muted mt-1 text-[11px]">
                        {activity.description} · {activity.createdAt}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Organization */}
            <Card className="p-5 sm:p-6">
              <CardHeader title="Teklifi sunan kurum" icon={UsersRound} />
              <div className="mt-5 space-y-2 text-xs">
                <p className="text-foreground font-semibold">{organization.title}</p>
                <p className="text-muted">
                  {organization.address}, {organization.district} / {organization.city}
                </p>
                <p className="text-muted">
                  {organization.phone} · {organization.email}
                </p>
                {organization.licenseNumber && (
                  <p className="text-muted">OSGB Yetki Belge No: {organization.licenseNumber}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== "overview" && (
        <OfferTabPanel
          activeTab={activeTab}
          company={company}
          editingAttachments={editingAttachments}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
          onToggleAttachments={() => setEditingAttachments((current) => !current)}
          offer={offer}
          organization={organization}
        />
      )}

      <Modal
        className="sm:max-w-5xl"
        description="Alıcı ve e-posta içeriğini kontrol edin, ardından varsayılan e-posta uygulamanızda açın."
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
        size="xl"
        title="Teklif e-postası hazırla"
      >
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-border bg-card-muted/35 p-4 sm:p-5 lg:sticky lg:top-0 lg:self-start">
            <div>
              <p className="text-foreground text-xs font-semibold">Gönderim ayarları</p>
              <p className="text-muted mt-1 text-[11px]">Teklif müşteriye gönderilmeden önce alıcı ve içeriği düzenleyin.</p>
            </div>
            <label className="text-foreground block text-xs font-semibold">
              Kime <span className="text-danger">*</span>
              <input aria-label="E-posta alıcısı" className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2" onChange={(event) => setMailTo(event.target.value)} placeholder="yetkili@firma.com" type="email" value={mailTo} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-foreground block text-xs font-semibold">Bilgi (CC)<input aria-label="Bilgi e-posta adresleri" className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2" onChange={(event) => setMailCc(event.target.value)} placeholder="ekip@firma.com" type="text" value={mailCc} /></label>
              <label className="text-foreground block text-xs font-semibold">Gizli (BCC)<input aria-label="Gizli e-posta adresleri" className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2" onChange={(event) => setMailBcc(event.target.value)} placeholder="yonetim@hantech.com.tr" type="text" value={mailBcc} /></label>
            </div>
            <label className="text-foreground block text-xs font-semibold">Konu<input aria-label="E-posta konusu" className="border-border bg-background text-foreground placeholder:text-subtle focus:border-brand focus:ring-brand/20 mt-2 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2" onChange={(event) => setMailSubject(event.target.value)} type="text" value={mailSubject} /></label>
            <div className="border-border bg-card-muted rounded-2xl border p-3">
              <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">İçerik seçenekleri</p>
              <div className="mt-3 space-y-2">
                {[[includeMailSummary, setIncludeMailSummary, "Teklif özetini ekle"], [includeMailLink, setIncludeMailLink, "Teklif paylaşım ve onay bağlantısını ekle"]].map(([checked, setter, label]) => (
                  <button aria-pressed={checked as boolean} className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors", checked ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-background text-muted")} key={label as string} onClick={() => (setter as (value: boolean) => void)(!(checked as boolean))} type="button">
                    <span>{label as string}</span><CheckCircle2 className={cn("size-4", checked ? "text-brand" : "text-subtle")} />
                  </button>
                ))}
                {offer.coverLetterText && <button aria-pressed={includeMailCoverLetter} className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors", includeMailCoverLetter ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-background text-muted")} onClick={() => setIncludeMailCoverLetter((current) => !current)} type="button"><span>Teklif ön yazısını ekle</span><CheckCircle2 className={cn("size-4", includeMailCoverLetter ? "text-brand" : "text-subtle")} /></button>}
              </div>
            </div>
            <div className="bg-brand-soft text-brand-soft-fg rounded-xl px-3 py-2.5 text-[11px] leading-5">Gönder butonu, e-posta uygulamanızı alıcı ve teklif içeriği hazır şekilde açar.</div>
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card-muted/35 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-foreground text-xs font-semibold">E-posta önizlemesi</p><p className="text-muted mt-1 text-[11px]">Müşteriye ulaşacak teklif içeriği</p></div><span className="bg-brand-soft text-brand-soft-fg rounded-full px-2.5 py-1 text-[10px] font-bold">Kurumsal taslak</span></div>
            <div className="border-border overflow-hidden rounded-2xl border shadow-sm">
              <div className="bg-sidebar text-sidebar-fg-strong px-5 py-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{organization.shortName || organization.title}</p><p className="text-sidebar-accent mt-1 text-[10px] tracking-[0.14em] uppercase">TEKLİF BİLGİLENDİRMESİ</p></div><Mail className="text-sidebar-accent size-5" /></div></div>
              <div className="bg-background p-5 sm:p-6"><div className="border-border bg-card flex items-center gap-3 rounded-xl border px-3 py-3"><span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">{(organization.shortName || organization.title).slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-subtle text-[10px] font-bold tracking-wider uppercase">Gönderim bilgileri</p><p className="text-foreground mt-0.5 truncate text-xs font-semibold">{mailTo || "Alıcı belirtilmedi"}</p></div><div className="text-right"><p className="text-subtle text-[10px]">Konu</p><p className="text-muted mt-0.5 max-w-40 truncate text-[10px]">{mailSubject || "Teklif"}</p></div></div>
                {mailCc && <p className="text-muted mt-2 truncate px-1 text-[10px]">CC: {mailCc}</p>}
                <div className="border-divider mt-6 border-b pb-5"><p className="text-brand text-[10px] font-bold tracking-[0.16em] uppercase">Teklif bilgilendirmesi</p><h3 className="text-heading mt-2 text-xl leading-tight font-semibold tracking-tight">{offer.title}</h3><p className="text-muted mt-3 text-xs leading-6">Merhaba {mailRecipientName},<br />{offer.company} için hazırladığımız teklifimizi bilgilerinize sunarız.</p></div>
                {includeMailCoverLetter && offer.coverLetterText && <div className="border-brand bg-card-muted mt-5 rounded-r-xl border-l-4 p-4"><p className="text-brand text-[10px] font-bold tracking-wider uppercase">Teklif ön yazısı</p><p className="text-muted mt-2 text-xs leading-5 whitespace-pre-line">{offer.coverLetterText}</p></div>}
                {includeMailSummary && <div className="bg-brand-soft mt-5 rounded-xl p-4"><p className="text-brand-soft-fg text-[10px] font-bold tracking-wider uppercase">Teklif kapsamı</p><div className="text-foreground mt-3 space-y-1.5 text-xs">{mailItemRows.length ? mailItemRows.map((line) => <div className="flex items-start justify-between gap-3" key={line.testId}><span className="min-w-0">{line.name}</span><span className="shrink-0 font-semibold">{line.quantity} adet</span></div>) : <p>Hizmet kalemi belirtilmedi.</p>}{mailItemOverflow > 0 && <p className="text-brand-soft-fg pt-1 text-[11px] font-semibold">+{mailItemOverflow} kalem daha · Ayrıntılar PDF dosyasında</p>}</div><p className="text-brand-soft-fg mt-3 border-t border-brand-soft-fg/20 pt-3 text-[11px] leading-5">Fiyatlandırma ve diğer teklif detayları için PDF dosyasını inceleyebilirsiniz.</p></div>}
                {includeMailLink && <div className="bg-sidebar text-sidebar-fg-strong mt-5 rounded-xl p-4"><div className="flex items-center gap-2"><span className="bg-sidebar-accent text-sidebar flex size-8 shrink-0 items-center justify-center rounded-lg"><ExternalLink className="size-4" /></span><p className="text-sidebar-fg-strong text-[10px] font-bold tracking-wider uppercase">Teklif paylaşımı</p></div><p className="text-sidebar-fg-strong mt-3 text-xs font-semibold">Teklifi inceleyin ve yanıtınızı güvenli bağlantı üzerinden iletin.</p><p className="text-sidebar-muted mt-1 text-[10px] leading-5">Onay, ret veya değişiklik talebi için teklif ekranını açabilirsiniz.</p><span className="text-sidebar-accent mt-3 inline-flex items-center gap-1 text-[11px] font-bold">Teklifi incele ve yanıtla <ArrowUpRight className="size-3" /></span></div>}
                <div className="border-divider mt-6 border-t pt-5"><p className="text-muted text-xs leading-6">Sorularınız veya değişiklik talepleriniz için bizimle iletişime geçebilirsiniz.</p><p className="text-foreground mt-4 text-xs leading-5 font-semibold">Saygılarımızla,<br />{organization.title}<br /><span className="text-muted font-normal">{organization.phone} · {organization.email}</span></p></div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          description="Bu işlem geri alınamaz. Teklif kalıcı olarak silinecek."
          eyebrow="Onay"
          footer={
            <>
              <Button onClick={() => setConfirmDelete(false)} variant="ghost">
                Vazgeç
              </Button>
              <Button onClick={removeOffer} variant="danger">
                <Trash2 /> Sil
              </Button>
            </>
          }
          icon={Trash2}
          onClose={() => setConfirmDelete(false)}
          open
          size="sm"
          title="Teklifi sil"
        >
          <p className="text-muted text-sm">
            <span className="text-foreground font-bold">{offer.number}</span> numaralı teklifi silmek istediğinize emin
            misiniz?
          </p>
        </Modal>
      )}
    </Page>
  );
}

function BackLink() {
  return (
    <Link
      className="text-muted hover:text-brand inline-flex items-center gap-2 text-xs font-semibold"
      href="/teklifler"
    >
      <ArrowLeft className="size-4" /> Tekliflere dön
    </Link>
  );
}

function getAutomaticReminderDate(validUntil?: string) {
  if (!validUntil) return "";
  const iso = labelToIso(validUntil);
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() - 7);
  const today = todayIso();
  return date.toISOString().slice(0, 10) < today ? today : date.toISOString().slice(0, 10);
}

function OfferTabPanel({
  activeTab,
  offer,
  company,
  organization,
  editingAttachments,
  onToggleAttachments,
  onAddAttachment,
  onRemoveAttachment,
}: {
  activeTab: "services" | "financial" | "company" | "response" | "activity";
  offer: Offer;
  company?: { name: string; employees: number };
  organization: ReturnType<typeof useOrganization>[0];
  editingAttachments: boolean;
  onToggleAttachments: () => void;
  onAddAttachment: (file: File | undefined) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  if (activeTab === "services") {
    const subtotal = offer.lines?.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) ?? offer.total;
    const discount = Math.min(offer.discount ?? 0, subtotal);
    const net = subtotal - discount;
    const tax = offer.tax ?? 0;
    const taxAmount = Math.round((net * tax) / 100);
    const total = net + taxAmount;
    return (
      <Card className="mt-6 overflow-hidden p-5 sm:p-7">
        <CardHeader
          action={
            <Button
              onClick={() => void downloadServiceSummaryPdf(offer, organization, company)}
              size="sm"
              variant="secondary"
            >
              <FileDown /> Hizmet PDF’i
            </Button>
          }
          title={`Hizmet kapsamı · ${offer.lines?.length ?? 0} kalem`}
          description={`${company?.employees ?? 0} çalışan için teklif kapsamı`}
          icon={ClipboardList}
        />
        <div className="border-border mt-5 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-card-muted text-subtle text-[10px] font-bold tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Test / hizmet</th>
                <th className="px-4 py-3 text-right">Adet</th>
                <th className="px-4 py-3 text-right">Birim fiyat</th>
                <th className="px-4 py-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-divider divide-y">
              {(offer.lines ?? []).map((line, index) => (
                <tr key={line.testId}>
                  <td className="text-brand px-4 py-3 font-semibold">{String(index + 1).padStart(2, "0")}</td>
                  <td className="text-foreground px-4 py-3 font-semibold">{line.name}</td>
                  <td className="text-muted px-4 py-3 text-right">{line.quantity}</td>
                  <td className="text-muted px-4 py-3 text-right">{money(line.unitPrice)}</td>
                  <td className="text-foreground px-4 py-3 text-right font-semibold">
                    {money(line.unitPrice * line.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <InfoField label="Ara toplam" value={money(subtotal)} />
          <InfoField label="İndirim" value={discount ? `-${money(discount)}` : "Uygulanmadı"} />
          <InfoField label={`KDV (%${tax})`} value={tax ? money(taxAmount) : "Uygulanmadı"} />
          <div className="bg-brand-soft rounded-xl p-3">
            <p className="text-brand-soft-fg text-[10px] font-semibold tracking-wider uppercase">Genel toplam</p>
            <p className="text-brand-soft-fg mt-1 text-sm font-bold">{money(total)}</p>
          </div>
        </div>
      </Card>
    );
  }
  if (activeTab === "financial") {
    const subtotal = offer.lines?.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) ?? offer.total;
    const discount = Math.min(offer.discount ?? 0, subtotal);
    const net = subtotal - discount;
    const tax = offer.tax ?? 0;
    const total = net + Math.round((net * tax) / 100);
    return (
      <Card className="mt-6 max-w-2xl p-5 sm:p-7">
        <CardHeader title="Finansal özet" description="Teklif fiyatlandırması ve ödeme koşulları" icon={Receipt} />
        <div className="mt-6 space-y-3 text-sm">
          <InfoField label="Ara toplam" value={money(subtotal)} />
          <InfoField label="İndirim" value={discount ? `-${money(discount)}` : "Uygulanmadı"} />
          <InfoField label={`KDV (%${tax})`} value={tax ? money(Math.round((net * tax) / 100)) : "Uygulanmadı"} />
          <div className="bg-brand-soft rounded-xl p-4">
            <p className="text-brand-soft-fg text-xs font-semibold">Genel toplam</p>
            <p className="text-brand-soft-fg mt-1 text-2xl font-bold">{money(total)}</p>
          </div>
        </div>
      </Card>
    );
  }
  if (activeTab === "company") {
    return (
      <Card className="mt-6 max-w-3xl p-5 sm:p-7">
        <CardHeader title="Firma bilgileri" description="Teklifin bağlı olduğu müşteri kaydı" icon={Building2} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoField label="Firma unvanı" value={company?.name ?? offer.company} />
          <InfoField label="Yetkili" value={offer.contact || "Belirtilmedi"} />
          <InfoField label="Çalışan sayısı" value={`${company?.employees ?? 0} kişi`} />
          <InfoField label="Teklif türü" value={offer.offerType || "Belirtilmedi"} />
        </div>
      </Card>
    );
  }
  if (activeTab === "response") {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-7">
          <CardHeader
            title="Müşteri yanıtı"
            description="Firma yetkilisinin teklif bağlantısından verdiği yanıt"
            icon={CheckCircle2}
          />
          <div className="bg-card-muted mt-6 rounded-2xl p-5">
            <p className="text-subtle text-[10px] font-bold tracking-wider uppercase">Durum</p>
            <p className="text-heading mt-2 text-lg font-semibold">
              {offer.customerResponse?.status ?? "Yanıt bekleniyor"}
            </p>
            {offer.customerResponse?.note && (
              <p className="text-muted mt-3 text-sm leading-6">“{offer.customerResponse.note}”</p>
            )}
            {offer.customerResponse?.respondedAt && (
              <p className="text-subtle mt-3 text-xs">{offer.customerResponse.respondedAt}</p>
            )}
          </div>
        </Card>
        <Card className="p-5 sm:p-7">
          <CardHeader
            action={
              <Button onClick={onToggleAttachments} size="sm" variant="outline">
                <Edit3 /> {editingAttachments ? "Tamam" : "Düzenle"}
              </Button>
            }
            title="Ek dosyalar"
            description="Teklife bağlı belgeler"
            icon={Paperclip}
          />
          <label className="border-border-strong bg-card-muted text-muted hover:border-brand hover:text-brand mt-5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-xs font-semibold transition-colors">
            <Paperclip className="mr-2 size-4" /> Dosya ekle
            <input className="sr-only" onChange={(event) => onAddAttachment(event.target.files?.[0])} type="file" />
          </label>
          <div className="mt-5 space-y-2">
            {(offer.attachments ?? []).length ? (
              offer.attachments?.map((file) => (
                <div
                  className="border-border bg-card-muted flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-semibold"
                  key={file.id}
                >
                  <a
                    className="text-foreground hover:text-brand truncate hover:underline"
                    download={file.name}
                    href={file.dataUrl || "#"}
                    rel="noreferrer"
                    target={file.dataUrl ? "_blank" : undefined}
                  >
                    {file.name}
                  </a>
                  {editingAttachments && (
                    <Button
                      aria-label={`${file.name} dosyasını kaldır`}
                      onClick={() => onRemoveAttachment(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  )}
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
  return (
    <Card className="mt-6 p-5 sm:p-7">
      <CardHeader title="Aktivite geçmişi" description="Teklifin tüm hareketleri" icon={History} />
      <div className="border-border mt-6 space-y-5 border-l pl-5">
        {(
          offer.activities ?? [
            {
              id: "created",
              type: "created" as const,
              title: "Teklif oluşturuldu",
              description: "Teklif kaydı oluşturuldu.",
              createdAt: offer.createdAt,
            },
          ]
        )
          .slice()
          .reverse()
          .map((activity) => (
            <div className="relative" key={activity.id}>
              <span className="border-background bg-brand absolute top-1.5 -left-[26px] size-3 rounded-full border-2" />
              <p className="text-foreground text-sm font-semibold">{activity.title}</p>
              <p className="text-muted mt-1 text-xs">{activity.description}</p>
              <p className="text-subtle mt-1 text-[11px]">{activity.createdAt}</p>
            </div>
          ))}
      </div>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <Page className="animate-pulse">
      <div className="bg-card-muted h-4 w-28 rounded" />
      <Card className="mt-6 p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <div className="bg-card-muted size-16 rounded-2xl" />
          <div className="space-y-3">
            <div className="bg-card-muted h-6 w-56 rounded" />
            <div className="bg-card-muted h-4 w-40 rounded" />
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="bg-card-muted h-20 rounded-xl" key={index} />
          ))}
        </div>
      </Card>
      <div className="bg-card-muted mt-6 h-48 rounded-2xl" />
    </Page>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-muted rounded-xl px-3 py-2.5">
      <p className="text-subtle text-[10px] font-semibold tracking-wider uppercase">{label}</p>
      <p className="text-foreground mt-1 text-xs font-semibold">{value || "Belirtilmedi"}</p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}
