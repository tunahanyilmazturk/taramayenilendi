import type { CoverLetterTemplate, ConditionTemplate } from "@/lib/data";
import type { OfferType, TestItem } from "@/lib/demo-data";

export type SelectedTest = TestItem & { quantity: number; unitPrice?: number };
export type DiscountType = "percent" | "fixed";
export type PaymentTerms = "peşin" | "net15" | "net30" | "net45" | "net60" | "taksit";
export type Step = 1 | 2 | 3 | 4 | 5 | 6;
export type WizardState = {
  companyId: number | null;
  company: string;
  offerType: OfferType | "";
  employeeCount: number;
  contact: string;
  email: string;
  title: string;
  validUntil: string;
  discount: string;
  discountType: DiscountType;
  tax: string;
  paymentTerms: PaymentTerms;
  deliveryDays: string;
  tests: SelectedTest[];
  coverLetterId: number | null;
  coverLetterText: string;
  selectedTerms: number[];
  conditionsText: string;
};
export type UpdateWizard = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
export type PriceBreakdown = { subtotal: number; discount: number; discounted: number; tax: number; total: number };

export const emptyWizard: WizardState = {
  companyId: null,
  company: "",
  offerType: "",
  employeeCount: 1,
  contact: "",
  email: "",
  title: "",
  validUntil: "",
  discount: "0",
  discountType: "percent",
  tax: "20",
  paymentTerms: "net30",
  deliveryDays: "7",
  tests: [],
  coverLetterId: null,
  coverLetterText: "",
  selectedTerms: [],
  conditionsText: "",
};

export const lineTotal = (test: SelectedTest) => (test.unitPrice ?? test.price) * test.quantity;

export function calculatePrice(wizard: WizardState): PriceBreakdown {
  const subtotal = wizard.tests.reduce((sum, test) => sum + lineTotal(test), 0);
  const discountValue = Math.max(0, Number(wizard.discount) || 0);
  const discount =
    wizard.discountType === "fixed" ? Math.min(discountValue, subtotal) : subtotal * (Math.min(discountValue, 100) / 100);
  const tax = Math.max(Number(wizard.tax) || 0, 0);
  const discounted = Math.max(0, subtotal - discount);
  return { subtotal, discount, discounted, tax, total: discounted * (1 + tax / 100) };
}

export const paymentTermsLabels: Record<PaymentTerms, string> = {
  peşin: "Peşin ödeme",
  net15: "15 gün vadeli",
  net30: "30 gün vadeli",
  net45: "45 gün vadeli",
  net60: "60 gün vadeli",
  taksit: "Taksitli ödeme",
};

export const defaultCoverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: 1,
    name: "Kısa",
    description: "Öz ve net, tek paragraf.",
    icon: "short",
    body: "Sayın İlgili,\n\n{{company}} firması için hazırladığımız {{offerType}} teklifini sunarız. Teklif {{validUntil}} tarihine kadar geçerlidir. Detaylar ekte yer almaktadır.\n\n{{signature}}",
    builtIn: true,
  },
  {
    id: 2,
    name: "Standart",
    description: "Profesyonel, 2-3 paragraf.",
    icon: "standard",
    body: "Sayın İlgili,\n\n{{company}} firmasının çalışan sağlığı ve güvenliği kapsamında ihtiyaç duyduğu {{offerType}} hizmetleri için teklifimizi sunmaktan memnuniyet duyarız. Teklifimiz, firmanızın {{employeeCount}} çalışanı için hazırlanmış olup kapsamdaki tüm test ve muayeneleri içermektedir.\n\nHizmetlerimiz, yürürlükteki iş sağlığı ve güvenliği mevzuatına uygun olarak yürütülecek olup, raporlar {{deliveryDays}} iş günü içinde teslim edilecektir. Ödeme {{paymentTerms}} olarak uygulanacaktır.\n\nTeklif {{validUntil}} tarihine kadar geçerlidir. Sorularınız için bizimle iletişime geçebilirsiniz.\n\n{{signature}}",
    builtIn: true,
  },
  {
    id: 3,
    name: "Detaylı",
    description: "Kapsamlı, tüm koşullar dahil.",
    icon: "detailed",
    body: "Sayın İlgili,\n\n{{company}} firmasının İş Sağlığı ve Güvenliği kapsamındaki ihtiyaçları doğrultusunda, {{offerType}} hizmetleri için teklifimizi aşağıda sunuyoruz. Teklifimiz, firmanızda çalışan {{employeeCount}} personel için hazırlanmıştır.\n\nHİZMET KAPSAMI\nTeklif kapsamında, yürürlükteki 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili mevzuat gereği yapılması gereken tüm muayene ve testler dahildir. Hizmetler, alanında uzman ve sertifikalı sağlık personeli tarafından yürütülecektir.\n\nTESLİM VE RAPORLAMA\nHizmet sonucunda elde edilen bulgular, {{deliveryDays}} iş günü içinde detaylı rapor halinde dijital ortamda teslim edilecektir. Raporlar KVKK kapsamında gizli tutulacak ve yalnızca yetkili kişilerle paylaşılacaktır.\n\nÖDEME VE FATURALANDIRMA\nTeklif fiyatlarına KDV dahil değildir. Ödeme {{paymentTerms}} olarak tahsil edilir. Fatura, hizmet tamamlandıktan sonra kurum adına kesilecektir.\n\nGEÇERLİLİK\nBu teklif {{validUntil}} tarihine kadar geçerlidir. Süre dolduktan sonra fiyatlar ve koşullar yeniden değerlendirilir. Sözleşme imzalandıktan sonra hizmetin iptal edilmesi durumunda, o güne kadar yapılan işlemler için ücret talep edilir.\n\nSorularınız ve ek bilgi talepleriniz için bizimle iletişime geçebilirsiniz.\n\n{{signature}}",
    builtIn: true,
  },
  {
    id: 4,
    name: "Resmi",
    description: "Tüm resmi ifadeler ve atıflar.",
    icon: "formal",
    body: "Sayın Yetkili,\n\n6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve bu kanuna dayalı ikincil mevzuat uyarınca, {{company}} firmasının {{offerType}} kapsamında yerine getirmesi gereken yükümlülüklerin yerine getirilmesine ilişkin teklifimizi sunarız.\n\nİlgili mevzuat kapsamında, firmanızda istihdam edilen {{employeeCount}} personel için gerekli sağlık gözetimi ve muayene hizmetleri, uzman sağlık personeli eşliğinde yürütülecektir. Hizmet sonucunda düzenlenecek raporlar, {{deliveryDays}} iş günü içinde teslim edilecek olup, ödeme {{paymentTerms}} olarak gerçekleştirilecektir.\n\nİlgili teklif {{validUntil}} tarihine kadar geçerli olup, bu tarihten sonra güncel fiyat listesi esas alınacaktır.\n\n{{signature}}",
    builtIn: true,
  },
  {
    id: 5,
    name: "Samimi",
    description: "Yakın ve işbirlikçi ton.",
    icon: "friendly",
    body: "Merhaba,\n\n{{company}} ekibi için hazırladığımız {{offerType}} teklifini size iletmenin memnuniyetini duyuyoruz. {{employeeCount}} çalışkan ekibinizin sağlığını güvence altına almak için en kapsamlı hizmeti sunmaya hazırız.\n\nTüm süreç boyunca yanınızda olacağız — raporlar {{deliveryDays}} iş günü içinde hazır olacak ve ödeme konusunda {{paymentTerms}} esnekliği sağlayacağız. Teklifimiz {{validUntil}} tarihine kadar geçerli.\n\nHerhangi bir sorunuz olursa çekinmeden ulaşabilirsiniz, en kısa sürede yanıt veririz.\n\nSevgi ve saygılarımızla,\n{{signature}}",
    builtIn: true,
  },
  {
    id: 6,
    name: "Teklif İsteyene Yanıt",
    description: "Teklif talebine karşılık yanıt.",
    icon: "response",
    body: "Sayın İlgili,\n\n{{company}} firması tarafından iletilen teklif talebine istinaden, {{offerType}} kapsamında sunacağımız hizmetlere ilişkin fiyat ve koşulları aşağıda belirtiyoruz. Talebinizde belirttiğiniz {{employeeCount}} personel için kapsamlı bir hizmet planı hazırladık.\n\nTeklifimiz {{validUntil}} tarihine kadar geçerli olup, hizmetler {{deliveryDays}} iş günü içinde tamamlanacak ve raporlanacaktır. Ödeme {{paymentTerms}} olarak uygulanacaktır.\n\nTalebinize uygun olarak hazırlanan bu teklifi değerlendirmelerinize sunarız.\n\n{{signature}}",
    builtIn: true,
  },
];

export function buildSignature(org: { title: string; shortName: string; email: string; phone: string; address: string; licenseNumber: string }): string {
  const lines = ["Saygılarımızla,", "", org.title];
  if (org.address) lines.push(org.address);
  const contactLine = [org.phone, org.email].filter(Boolean).join(" · ");
  if (contactLine) lines.push(contactLine);
  if (org.licenseNumber) lines.push(`OSGB Yetki Belge No: ${org.licenseNumber}`);
  return lines.join("\n");
}

export function fillCoverLetter(
  body: string,
  wizard: { company: string; offerType: string; employeeCount: number; validUntil: string; deliveryDays: string; paymentTerms: PaymentTerms },
  org: { title: string; shortName: string; email: string; phone: string; address: string; licenseNumber: string },
): string {
  const validUntilLabel = wizard.validUntil
    ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${wizard.validUntil}T12:00:00`),
      )
    : "[geçerlilik tarihi]";
  return body
    .replace(/\{\{company\}\}/g, wizard.company || "[firma adı]")
    .replace(/\{\{offerType\}\}/g, wizard.offerType || "[teklif türü]")
    .replace(/\{\{employeeCount\}\}/g, String(wizard.employeeCount || "[personel sayısı]"))
    .replace(/\{\{validUntil\}\}/g, validUntilLabel)
    .replace(/\{\{deliveryDays\}\}/g, wizard.deliveryDays || "[teslim süresi]")
    .replace(/\{\{paymentTerms\}\}/g, paymentTermsLabels[wizard.paymentTerms])
    .replace(/\{\{signature\}\}/g, buildSignature(org));
}

export const defaultConditionTemplates: ConditionTemplate[] = [
  {
    id: 1,
    title: "Ödeme koşulları",
    body: "Teklif tutarı, fatura tarihinden itibaren {{paymentTerms}} olarak tahsil edilir. Peşin ödemelerde %5 indirim uygulanır. Vadeli ödemelerde gecikme bedeli aylık %2.5 olarak hesaplanır.",
    builtIn: true,
  },
  {
    id: 2,
    title: "Teslim süresi",
    body: "Hizmetler, sözleşme imzalandıktan sonra {{deliveryDays}} iş günü içinde tamamlanır. Raporlar hizmet sonunda dijital ortamda teslim edilir.",
    builtIn: true,
  },
  {
    id: 3,
    title: "Geçerlilik süresi",
    body: "Bu teklif, belirtilen geçerlilik tarihine kadar geçerlidir. Bu tarihten sonra fiyatlar ve koşullar yeniden değerlendirilir.",
    builtIn: true,
  },
  {
    id: 4,
    title: "Fiyat değişikliği",
    body: "Teklif fiyatları, teklifin geçerlilik süresi içinde sabittir. Süre dolduktan sonra güncel fiyat listesi esas alınır.",
    builtIn: true,
  },
  {
    id: 5,
    title: "İptal koşulları",
    body: "Sözleşme imzalandıktan sonra hizmetin iptal edilmesi durumunda, o güne kadar yapılan işlemler için ücret talep edilir. İptal yazılı olarak bildirilmelidir.",
    builtIn: true,
  },
  {
    id: 6,
    title: "Gizlilik",
    body: "Çalışanlara ait sağlık verileri gizli tutulur ve yalnızca ilgili mevzuat kapsamında yetkili kişilerle paylaşılır. Veriler KVKK kapsamında işlenir.",
    builtIn: true,
  },
  {
    id: 7,
    title: "Sorumluluk",
    body: "Hizmet sunumu sırasında oluşabilecek aksaklıklardan doğrudan hizmet sağlayıcı sorumludur. Ancak mücbir sebep halleri sorumluluk kapsamı dışındadır.",
    builtIn: true,
  },
  {
    id: 8,
    title: "Fatura ve vergiler",
    body: "Teklif fiyatlarına KDV dahil değildir. Fatura, hizmet tamamlandıktan sonra kurum adına kesilir. Fiyatlara tüm vergiler ve resmi harçlar ayrıca eklenir.",
    builtIn: true,
  },
  {
    id: 9,
    title: "Ek hizmetler",
    body: "Bu teklif kapsamında olmayan ek test ve hizmetler talep edilirse, güncel fiyat listesi üzerinden ayrıca faturalandırılır.",
    builtIn: true,
  },
  {
    id: 10,
    title: "Personel değişikliği",
    body: "Hizmet kapsamındaki personel sayısında değişiklik olması durumunda, birim adetler güncellenir ve fiyat revize edilir. Değişiklik yazılı olarak bildirilmelidir.",
    builtIn: true,
  },
];

export function fillCondition(body: string, wizard: { deliveryDays: string; paymentTerms: PaymentTerms }): string {
  return body
    .replace(/\{\{paymentTerms\}\}/g, paymentTermsLabels[wizard.paymentTerms])
    .replace(/\{\{deliveryDays\}\}/g, wizard.deliveryDays || "[teslim süresi]");
}

export function buildConditionsText(
  templates: ConditionTemplate[],
  selectedIds: number[],
  wizard: { deliveryDays: string; paymentTerms: PaymentTerms },
): string {
  const parts: string[] = [];
  templates
    .filter((t) => selectedIds.includes(t.id))
    .forEach((t, index) => {
      parts.push(`${index + 1}. ${t.title}\n${fillCondition(t.body, wizard)}`);
    });
  return parts.join("\n\n");
}
