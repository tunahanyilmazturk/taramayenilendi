"use client";

import { BriefcaseMedical, CheckCircle2, Edit3, Mail, Phone, Plus, Search, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import SettingsCard from "./settings-card";
import type { TeamMember } from "./types";

const professions = [
  "İşyeri hekimi",
  "Hemşire",
  "Tıbbi sekreter",
  "Radyoloji teknikeri",
  "Odyometrist",
  "Laborant",
  "Diğer",
];
const roles = ["Yönetici", "Operasyon sorumlusu", "Saha personeli"];

export default function TeamSettings({ team, setTeam }: { team: TeamMember[]; setTeam: (team: TeamMember[]) => void }) {
  const emptyForm = { name: "", profession: professions[0], email: "", phone: "", role: roles[2], account: true };
  const [form, setForm] = useState(emptyForm);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const filteredTeam = useMemo(
    () =>
      team.filter(
        (member) =>
          (showInactive || member.active !== false) &&
          `${member.name} ${member.profession} ${member.email}`
            .toLocaleLowerCase("tr-TR")
            .includes(query.toLocaleLowerCase("tr-TR")),
      ),
    [team, query, showInactive],
  );
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const saveMember = () => {
    if (!form.name.trim()) return;
    const member = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      active: true,
    };
    if (editingIndex === null) setTeam([...team, member]);
    else setTeam(team.map((item, index) => (index === editingIndex ? { ...item, ...member } : item)));
    setForm(emptyForm);
    setEditingIndex(null);
  };
  const editMember = (index: number) => {
    const member = team[index];
    setForm({
      name: member.name,
      profession: member.profession,
      email: member.email,
      phone: member.phone ?? "",
      role: member.role ?? roles[2],
      account: member.account,
    });
    setEditingIndex(index);
  };
  const toggleMember = (index: number) =>
    setTeam(
      team.map((member, itemIndex) => (itemIndex === index ? { ...member, active: member.active === false } : member)),
    );
  const activeCount = team.filter((member) => member.active !== false).length;

  return (
    <SettingsCard
      icon={UsersRound}
      title="Ekip yönetimi"
      description="OSGB çalışanlarınızı, mesleklerini ve kullanıcı erişimlerini tek merkezden yönetin."
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Summary label="Toplam ekip" value={team.length} icon={UsersRound} />
        <Summary label="Aktif çalışan" value={activeCount} icon={CheckCircle2} />
        <Summary label="Kullanıcı hesabı" value={team.filter((member) => member.account).length} icon={UserRound} />
      </div>
      <div className="mt-6 rounded-2xl border border-[#dceee4] bg-[#f7fcf9] p-4 dark:border-[#2b4057] dark:bg-[#111827]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-[#299b7c]" />
            <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">
              {editingIndex === null ? "Yeni ekip üyesi" : "Ekip üyesini düzenle"}
            </p>
          </div>
          {editingIndex !== null && (
            <button
              className="text-xs font-semibold text-[#81958f] hover:text-[#258b71]"
              onClick={() => {
                setEditingIndex(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              İptal
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            ariaLabel="Ad soyad"
            placeholder="Ad soyad"
            value={form.name}
            onChange={(value) => update("name", value)}
          />
          <select
            aria-label="Meslek"
            className="h-11 rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#2b4057] dark:bg-[#18212f] dark:text-white"
            onChange={(event) => update("profession", event.target.value)}
            value={form.profession}
          >
            {professions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <Field
            ariaLabel="E-posta"
            placeholder="E-posta adresi"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
          />
          <Field
            ariaLabel="Telefon"
            placeholder="Telefon"
            value={form.phone}
            onChange={(value) => update("phone", value)}
          />
          <select
            aria-label="Kullanıcı rolü"
            className="h-11 rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#2b4057] dark:bg-[#18212f] dark:text-white"
            onChange={(event) => update("role", event.target.value)}
            value={form.role}
          >
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#299b7c] px-4 text-sm font-semibold text-white hover:bg-[#208267]"
            onClick={saveMember}
            type="button"
          >
            <Plus className="size-4" /> {editingIndex === null ? "Ekibe ekle" : "Güncelle"}
          </button>
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-[#718783] dark:text-[#9ebbb3]">
          <input
            checked={form.account}
            className="size-4 accent-[#299b7c]"
            onChange={(event) => update("account", event.target.checked)}
            type="checkbox"
          />{" "}
          Kayıt sırasında bu kişi için kullanıcı hesabı oluştur
        </label>
      </div>
      <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">Ekip listesi</p>
          <p className="mt-1 text-xs text-[#81958f]">Meslek, iletişim ve hesap durumlarını görüntüleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
            <input
              aria-label="Ekipte ara"
              className="h-10 w-48 rounded-xl border border-[#dbe9e4] bg-white pr-3 pl-9 text-xs outline-none focus:border-[#55b99c] dark:border-[#2b4057] dark:bg-[#111827] dark:text-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ekipte ara..."
              value={query}
            />
          </label>
          <button
            className="rounded-xl border border-[#dbe9e4] px-3 py-2 text-xs font-semibold text-[#718783] hover:bg-[#ebf6f0] dark:border-[#2b4057] dark:text-[#a7bdb5]"
            onClick={() => setShowInactive((value) => !value)}
            type="button"
          >
            {showInactive ? "Aktifleri göster" : "Pasifleri göster"}
          </button>
        </div>
      </div>
      <div className="mt-4 divide-y divide-[#edf3f0] rounded-2xl border border-[#e5eee9] px-4 dark:divide-[#26364a] dark:border-[#2b4057]">
        {filteredTeam.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#81958f]">Aramanızla eşleşen ekip üyesi bulunamadı.</p>
        ) : (
          filteredTeam.map((member) => {
            const index = team.indexOf(member);
            return (
              <div
                className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                key={`${member.name}-${index}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
                    <BriefcaseMedical className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">{member.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.active === false ? "bg-[#f1e8e5] text-[#a66f60]" : "bg-[#e5f5ec] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]"}`}
                      >
                        {member.active === false ? "Pasif" : "Aktif"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#81958f]">
                      {member.profession} · {member.role ?? "Saha personeli"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#91a49f]">
                      {member.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" />
                          {member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:shrink-0">
                  <span className="rounded-full bg-[#f1f6f3] px-2.5 py-1.5 text-[10px] font-semibold text-[#66847a] dark:bg-[#202b3b] dark:text-[#a7bdb5]">
                    {member.account ? "Kullanıcı hesabı" : "Sadece ekip"}
                  </span>
                  <button
                    aria-label={`${member.name} düzenle`}
                    className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
                    onClick={() => editMember(index)}
                    type="button"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-[#81958f] hover:bg-[#f7eee9] hover:text-[#a66f60]"
                    onClick={() => toggleMember(index)}
                    type="button"
                  >
                    {member.active === false ? "Aktifleştir" : "Pasifleştir"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SettingsCard>
  );
}

function Field({
  ariaLabel,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-11 rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#2b4057] dark:bg-[#18212f] dark:text-white"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}
function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersRound }) {
  return (
    <div className="rounded-2xl border border-[#e5eee9] bg-[#fbfdfc] p-4 dark:border-[#2b4057] dark:bg-[#111827]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#81958f]">{label}</p>
        <Icon className="size-4 text-[#299b7c]" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{value}</p>
    </div>
  );
}
