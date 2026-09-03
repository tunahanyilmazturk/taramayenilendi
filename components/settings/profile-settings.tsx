import { UserRound } from "lucide-react";
import SettingsCard from "./settings-card";
import FormInput from "./form-input";

export default function ProfileSettings() {
  return (
    <SettingsCard
      icon={UserRound}
      title="Profil bilgileri"
      description="Panelde görünen kullanıcı bilgilerinizi güncelleyin."
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FormInput label="Ad" value="Ahmet" />
        <FormInput label="Soyad" value="Yılmaz" />
        <div className="sm:col-span-2">
          <FormInput label="Kurumsal e-posta" value="ahmet.yilmaz@hantech.com.tr" type="email" />
        </div>
        <FormInput label="Görev" value="Yönetici" disabled />
        <FormInput label="Telefon" value="+90 532 000 00 00" type="tel" />
      </div>
    </SettingsCard>
  );
}
