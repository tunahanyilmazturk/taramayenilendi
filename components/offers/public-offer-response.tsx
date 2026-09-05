"use client";

import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";
import { useCompanies, useOffers, useOrganization } from "@/lib/data";
import { useHydrated } from "@/lib/storage";

export default function PublicOfferResponse({ offerId }: { offerId: string }) {
  const hydrated = useHydrated();
  const [offers, setOffers] = useOffers();
  const [companies] = useCompanies();
  const [organization] = useOrganization();
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const offer = offers.find((item) => item.id === Number(offerId));
  const company = companies.find((item) => item.id === offer?.companyId);

  useEffect(() => {
    if (!offer || offer.emailStatus === "Görüntülendi") return;
    const createdAt = new Date().toLocaleString("tr-TR");
    setOffers((current) => current.map((item) => item.id === offer.id ? {
      ...item,
      emailStatus: "Görüntülendi",
      activities: [...(item.activities ?? []), { id: `${Date.now()}`, type: "viewed", title: "Teklif görüntülendi", description: "Müşteri paylaşım bağlantısını açtı.", createdAt }],
    } : item));
  }, [offer, setOffers]);

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!offer) return <main className="grid min-h-screen place-items-center bg-background p-6"><EmptyState title="Teklif bulunamadı" description="Bu teklif bağlantısı geçersiz veya teklif kaldırılmış olabilir." icon={FileText} /></main>;

  const respond = (status: "Onaylandı" | "Reddedildi" | "Görüşülüyor") => {
    const respondedAt = new Date().toLocaleString("tr-TR");
    setOffers((current) => current.map((item) => item.id === offer.id ? {
      ...item,
      status,
      emailStatus: "Görüntülendi",
      customerResponse: { status, note: note.trim(), respondedAt },
      activities: [...(item.activities ?? []), { id: `${Date.now()}`, type: "responded", title: `Müşteri yanıtı: ${status}`, description: note.trim() || "Açıklama bırakılmadı.", createdAt: respondedAt }],
    } : item));
    setSent(true);
  };

  if (sent) return <main className="grid min-h-screen place-items-center bg-background p-6"><Card className="w-full max-w-lg p-8 text-center"><CheckCircle2 className="mx-auto size-12 text-brand" /><h1 className="mt-4 text-2xl font-semibold text-heading">Yanıtınız alındı</h1><p className="mt-2 text-sm text-muted">{organization.title} teklif yanıtınızı kaydetti. İlginiz için teşekkür ederiz.</p></Card></main>;

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6"><div className="mx-auto max-w-3xl">
    <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">{organization.shortName || organization.title}</p><h1 className="mt-2 text-2xl font-semibold text-heading sm:text-3xl">Teklifinizi inceleyin</h1></div><ShieldCheck className="size-8 text-brand" /></div>
    <Card className="p-5 sm:p-8"><p className="text-xs text-muted">{offer.number} · {offer.offerType || "OSGB hizmetleri"}</p><h2 className="mt-2 text-xl font-semibold text-heading">{offer.title}</h2><p className="mt-2 text-sm text-muted">Sayın {offer.contact || company?.contact || "Yetkili"}, teklif detaylarını inceleyerek aşağıdaki seçeneklerden birini işaretleyebilirsiniz.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-card-muted p-4"><p className="text-[10px] font-bold tracking-wider text-subtle uppercase">Firma</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.company}</p></div><div className="rounded-xl bg-card-muted p-4"><p className="text-[10px] font-bold tracking-wider text-subtle uppercase">Geçerlilik</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.validUntil}</p></div><div className="rounded-xl bg-brand-soft p-4"><p className="text-[10px] font-bold tracking-wider text-brand-soft-fg uppercase">Toplam</p><p className="mt-1 text-sm font-semibold text-brand-soft-fg">₺{offer.total.toLocaleString("tr-TR")}</p></div></div>
      <label className="mt-7 block text-sm font-semibold text-foreground">Açıklama <span className="font-normal text-muted">(isteğe bağlı)</span><Textarea className="mt-2 min-h-28" onChange={(event) => setNote(event.target.value)} placeholder="Yanıtınızla ilgili notunuzu yazabilirsiniz..." value={note} /></label>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><Button onClick={() => respond("Onaylandı")}><CheckCircle2 /> Teklifi onayla</Button><Button onClick={() => respond("Görüşülüyor")} variant="secondary"><FileText /> Değerlendiriyorum</Button><Button onClick={() => respond("Reddedildi")} variant="danger-outline"><XCircle /> Teklifi reddet</Button></div>
      <p className="mt-6 text-center text-xs text-muted">Bu bağlantı teklif yanıtı için hazırlanmıştır. Yanıtınız kayıt altına alınır.</p>
    </Card>
  </div></main>;
}
