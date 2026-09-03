import { LockKeyhole, ShieldCheck } from "lucide-react";
import SettingsCard from "./settings-card";

export default function SecuritySettings() {
  return (
    <SettingsCard
      icon={ShieldCheck}
      title="Güvenlik"
      description="Hesap güvenliğinizi ve oturum tercihlerinizi yönetin."
    >
      <div className="mt-6 rounded-2xl border border-[#e5eee9] bg-[#f8fbf9] p-4 dark:border-[#2b4057] dark:bg-[#111827]">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 size-5 text-[#299b7c]" />
          <div>
            <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">Şifre değişikliği</p>
            <p className="mt-1 text-xs leading-5 text-[#81958f] dark:text-[#91b0a6]">
              Şifrenizi düzenli aralıklarla yenileyerek hesabınızı koruyun.
            </p>
            <button
              className="mt-4 rounded-xl border border-[#cfe6da] bg-white px-3 py-2 text-xs font-semibold text-[#258b71] hover:bg-[#ebf6f0] dark:border-[#2b4057] dark:bg-[#18212f]"
              type="button"
            >
              Şifreyi değiştir
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
