import type { LucideIcon } from "lucide-react";

export default function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e0ece8] bg-white p-5 sm:p-7 dark:border-[#1d4941] dark:bg-[#0e2927]">
      <div className="flex items-center gap-3 border-b border-[#edf3f0] pb-5 dark:border-[#1d4941]">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{title}</h2>
          <p className="mt-1 text-xs text-[#81958f] dark:text-[#91b0a6]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
