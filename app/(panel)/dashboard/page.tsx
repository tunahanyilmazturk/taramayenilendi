import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MoreHorizontal,
  TrendingUp,
  UsersRound,
} from "lucide-react";

const stats = [
  {
    label: "Bu ay tamamlanan tarama",
    value: "128",
    detail: "+12.4% geçen aya göre",
    icon: CheckCircle2,
    tone: "text-[#258b71] bg-[#e1f7ee] dark:bg-[#174638] dark:text-[#a7f3d0]",
  },
  {
    label: "Planlanan tarama",
    value: "24",
    detail: "Önümüzdeki 7 gün",
    icon: CalendarDays,
    tone: "text-[#2d806e] bg-[#e3f3ed] dark:bg-[#174638] dark:text-[#a7f3d0]",
  },
  {
    label: "Aktif saha ekibi",
    value: "08",
    detail: "Bugün görevde",
    icon: UsersRound,
    tone: "text-[#a16c3e] bg-[#fff1e2] dark:bg-[#4b3825] dark:text-[#f4c994]",
  },
  {
    label: "Ortalama tamamlanma",
    value: "86%",
    detail: "+4.8% performans artışı",
    icon: TrendingUp,
    tone: "text-[#6f5b9f] bg-[#f0eafd] dark:bg-[#3a3152] dark:text-[#d6c8f4]",
  },
];

const screenings = [
  {
    company: "Artemis Otomotiv A.Ş.",
    location: "Gebze Organize Sanayi",
    time: "09:30",
    team: "Ekip 04",
    status: "Devam ediyor",
    color: "bg-[#dff6eb] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]",
  },
  {
    company: "Mavi Hat Lojistik",
    location: "Tuzla Depo Merkezi",
    time: "11:00",
    team: "Ekip 02",
    status: "Yaklaşıyor",
    color: "bg-[#fff1e2] text-[#a16c3e] dark:bg-[#4b3825] dark:text-[#f4c994]",
  },
  {
    company: "Nova Gıda Üretim",
    location: "Çerkezköy Fabrika",
    time: "14:30",
    team: "Ekip 07",
    status: "Planlandı",
    color: "bg-[#e3f3ed] text-[#2d806e] dark:bg-[#174638] dark:text-[#a7f3d0]",
  },
];

export default function DashboardRoute() {
  return (
    <main className="mx-auto max-w-[1440px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#6f8982] dark:text-[#9ebbb3]">02 Eylül 2026, Çarşamba</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">
            Günaydın, Ahmet
          </h1>
          <p className="mt-2 text-sm text-[#81958f] dark:text-[#91b0a6]">
            Bugünkü saha operasyonlarınıza genel bir bakış.
          </p>
        </div>
        <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,60,58,0.14)] transition hover:bg-[#174e4b]">
          <CalendarDays className="size-4" /> Yeni tarama planla
        </button>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operasyon istatistikleri">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <article
            className="rounded-2xl border border-[#e0ece8] bg-white p-5 dark:border-[#1d4941] dark:bg-[#0e2927]"
            key={label}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#80958f] dark:text-[#91b0a6]">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#173e3b] dark:text-[#e8f7f1]">{value}</p>
              </div>
              <div className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-[18px]" />
              </div>
            </div>
            <p className="mt-4 text-[11px] font-medium text-[#6fa58f] dark:text-[#8cc9aa]">{detail}</p>
          </article>
        ))}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#0e2927]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Bugünkü tarama akışı</h2>
              <p className="mt-1 text-xs text-[#81958f] dark:text-[#91b0a6]">
                Saha ekiplerinizin güncel operasyon durumu
              </p>
            </div>
            <button className="text-xs font-semibold text-[#258b71] hover:text-[#176d59]">Tümünü gör</button>
          </div>
          <div className="mt-5 divide-y divide-[#edf3f0] dark:divide-[#1b4039]">
            {screenings.map((screening) => (
              <div
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                key={screening.company}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff8f4] text-xs font-bold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                    {screening.company
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
                      {screening.company}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#8aa09c] dark:text-[#91b0a6]">
                      <MapPin className="size-3" /> {screening.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-xs font-semibold text-[#486761] dark:text-[#bed8cf]">
                      <Clock3 className="size-3.5" /> {screening.time}
                    </p>
                    <p className="mt-1 text-[10px] text-[#91a49f] dark:text-[#829f96]">{screening.team}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${screening.color}`}>
                    {screening.status}
                  </span>
                  <button
                    aria-label={`${screening.company} seçenekleri`}
                    className="text-[#9aada9] hover:text-[#54756d]"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#0e2927]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Haftalık performans</h2>
              <p className="mt-1 text-xs text-[#81958f] dark:text-[#91b0a6]">Tarama tamamlama oranı</p>
            </div>
            <button
              aria-label="Performans detayları"
              className="rounded-lg p-1 text-[#8aa09c] hover:bg-[#f0f8f4] dark:hover:bg-[#12372f]"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </div>
          <div className="mt-8 flex items-end justify-between gap-2">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[#173e3b] dark:text-[#e8f7f1]">86%</p>
              <p className="mt-2 text-xs font-medium text-[#6fa58f]">Hedefin %6 üzerinde</p>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="h-12 w-2.5 rounded-full bg-[#d7f1e6] dark:bg-[#1a5541]" />
              <span className="h-16 w-2.5 rounded-full bg-[#b9e8d2] dark:bg-[#21634e]" />
              <span className="h-20 w-2.5 rounded-full bg-[#8bd5b5] dark:bg-[#299b7c]" />
              <span className="h-14 w-2.5 rounded-full bg-[#b9e8d2] dark:bg-[#21634e]" />
              <span className="h-24 w-2.5 rounded-full bg-[#299b7c]" />
              <span className="h-28 w-2.5 rounded-full bg-[#176d59]" />
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e7f1ed] dark:bg-[#183d36]">
            <div className="h-full w-[86%] rounded-full bg-[#299b7c]" />
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-medium text-[#9aada9] dark:text-[#78988e]">
            <span>Geçen hafta</span>
            <span>Bu hafta</span>
          </div>
        </section>
      </div>
    </main>
  );
}
