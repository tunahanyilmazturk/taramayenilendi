import { ArrowRight, Construction } from "lucide-react";

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10 text-[#102a2a] dark:bg-[#071b1a] dark:text-[#e5e7eb]">
      <section className="w-full max-w-xl rounded-[28px] border border-[#e2f0e9] bg-white p-8 text-center shadow-[0_24px_80px_rgba(26,86,77,0.1)] sm:p-12 dark:border-[#1d4941] dark:bg-[#0e2927] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e1f7ee] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Construction className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-[#299b7c] uppercase">HanTech OSGB</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#e8f7f1]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#718783] dark:text-[#91b0a6]">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f0fbf5] px-4 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#12372f] dark:text-[#a7f3d0]">
          Bu modül hazırlanıyor <ArrowRight className="size-3.5" />
        </div>
      </section>
    </main>
  );
}
