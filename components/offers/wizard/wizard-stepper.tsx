import { Check, CheckCircle2, ClipboardList, ShieldCheck, UsersRound } from "lucide-react";
import type { Step } from "./types";

const steps = [
  { id: 1, title: "Firma bilgileri", description: "Müşteri ve teklif tanımı", icon: UsersRound },
  { id: 2, title: "Hizmet kalemleri", description: "Test ve tarama kapsamı", icon: ClipboardList },
  { id: 3, title: "Fiyatlandırma", description: "Tutar ve koşullar", icon: ShieldCheck },
  { id: 4, title: "Son kontrol", description: "Teklifi gözden geçir", icon: CheckCircle2 },
];
export default function WizardStepper({ current, onStep }: { current: Step; onStep: (step: Step) => void }) {
  return (
    <aside
      aria-label="Teklif oluşturma adımları"
      className="grid grid-cols-1 gap-2 lg:sticky lg:top-24 lg:block lg:space-y-2"
    >
      {steps.map(({ id, title, description, icon: Icon }) => (
        <button
          aria-current={current === id ? "step" : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${current === id ? "border-[#65bd9b] bg-[#e8f3ed] dark:border-[#3d8068] dark:bg-[#1b3a32]" : "border-[#e5eee9] bg-white hover:border-[#cfe6da] dark:border-[#203b35] dark:bg-[#111e1d] dark:hover:border-[#37685a]"}`}
          key={id}
          onClick={() => id < current && onStep(id as Step)}
          type="button"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${current >= id ? "bg-[#299b7c] text-white" : "bg-[#edf3f0] text-[#91a49f] dark:bg-[#243b35]"}`}
          >
            {current > id ? <Check className="size-4" /> : <Icon className="size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</span>
            <span className="mt-1 block truncate text-[10px] text-[#81958f]">{description}</span>
          </span>
        </button>
      ))}
    </aside>
  );
}
