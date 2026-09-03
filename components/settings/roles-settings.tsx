"use client";

import {
  Check,
  CheckCircle2,
  Edit3,
  FileKey2,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import SettingsCard from "./settings-card";

type Role = { name: string; description: string; permissions: string[]; system?: boolean };
type Account = { name: string; email: string; profession: string; role: string; active: boolean };

const panelPermissions = [
  "Genel Bakış",
  "Firmalar",
  "Personeller",
  "Taramalar",
  "Teklifler",
  "İstatistikler",
  "Takvim",
];
const settingsPermissions = [
  "Kurum Bilgileri",
  "Ekip",
  "Rol ve Kullanıcı Yönetimi",
  "Test Kataloğu",
  "Görünüm",
  "Bildirimler",
  "Güvenlik",
];
const permissionGroups = [
  { label: "Çalışma alanı modülleri", permissions: panelPermissions },
  { label: "Ayarlar modülleri", permissions: settingsPermissions },
];
const permissionOptions = [...panelPermissions, ...settingsPermissions];
const initialRoles: Role[] = [
  { name: "Yönetici", description: "Tüm modüllere ve ayarlara erişim", permissions: permissionOptions, system: true },
  {
    name: "Operasyon sorumlusu",
    description: "Saha operasyonlarının günlük yönetimi",
    permissions: ["Genel Bakış", "Firmalar", "Personeller", "Taramalar", "Teklifler", "İstatistikler", "Takvim"],
  },
  {
    name: "Saha personeli",
    description: "Kendisine atanan taramaları görüntüleme",
    permissions: ["Genel Bakış", "Taramalar"],
  },
];
const initialAccounts: Account[] = [
  {
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@hantech.com.tr",
    profession: "Yönetici",
    role: "Yönetici",
    active: true,
  },
  {
    name: "Dr. Elif Kaya",
    email: "elif.kaya@hantech.com.tr",
    profession: "İşyeri hekimi",
    role: "Saha personeli",
    active: true,
  },
  {
    name: "Seda Demir",
    email: "seda.demir@hantech.com.tr",
    profession: "Hemşire",
    role: "Saha personeli",
    active: true,
  },
];

export default function RolesSettings() {
  const [view, setView] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState(initialRoles);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [query, setQuery] = useState("");
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        `${account.name} ${account.email} ${account.role}`
          .toLocaleLowerCase("tr-TR")
          .includes(query.toLocaleLowerCase("tr-TR")),
      ),
    [accounts, query],
  );
  const saveRole = (role: Role) => {
    setRoles((current) =>
      current.some((item) => item.name === role.name)
        ? current.map((item) => (item.name === role.name ? role : item))
        : [...current, role],
    );
    setEditingRole(null);
  };
  const toggleAccount = (email: string) =>
    setAccounts((current) =>
      current.map((account) => (account.email === email ? { ...account, active: !account.active } : account)),
    );
  const updateAccountRole = (email: string, role: string) =>
    setAccounts((current) => current.map((account) => (account.email === email ? { ...account, role } : account)));

  return (
    <SettingsCard
      icon={FileKey2}
      title="Rol ve kullanıcı yönetimi"
      description="Erişim rollerini ve kullanıcı hesaplarının yetkilerini tek merkezden yönetin."
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Summary label="Toplam kullanıcı" value={accounts.length} icon={UsersRound} />
        <Summary label="Aktif hesap" value={accounts.filter((account) => account.active).length} icon={CheckCircle2} />
        <Summary label="Tanımlı rol" value={roles.length} icon={ShieldCheck} />
      </div>
      <div className="mt-7 flex gap-2 border-b border-[#edf3f0] dark:border-[#26364a]">
        <button
          className={`border-b-2 px-2 pb-3 text-sm font-semibold ${view === "roles" ? "border-[#299b7c] text-[#1f8068]" : "border-transparent text-[#81958f]"}`}
          onClick={() => setView("roles")}
          type="button"
        >
          Roller
        </button>
        <button
          className={`border-b-2 px-2 pb-3 text-sm font-semibold ${view === "users" ? "border-[#299b7c] text-[#1f8068]" : "border-transparent text-[#81958f]"}`}
          onClick={() => setView("users")}
          type="button"
        >
          Kullanıcı hesapları
        </button>
      </div>
      {view === "roles" ? (
        <RoleList roles={roles} editingRole={editingRole} setEditingRole={setEditingRole} saveRole={saveRole} />
      ) : (
        <UserList
          accounts={filteredAccounts}
          roles={roles}
          query={query}
          setQuery={setQuery}
          onRoleChange={updateAccountRole}
          onToggle={toggleAccount}
        />
      )}
    </SettingsCard>
  );
}

function RoleList({
  roles,
  editingRole,
  setEditingRole,
  saveRole,
}: {
  roles: Role[];
  editingRole: Role | null;
  setEditingRole: (role: Role | null) => void;
  saveRole: (role: Role) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">Erişim rolleri</p>
          <p className="mt-1 text-xs text-[#81958f]">Hangi rolün hangi modüllere erişeceğini belirleyin.</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#299b7c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#208267]"
          onClick={() => setEditingRole({ name: "", description: "", permissions: [] })}
          type="button"
        >
          <Plus className="size-3.5" /> Yeni rol
        </button>
      </div>
      {editingRole && <RoleEditor role={editingRole} onCancel={() => setEditingRole(null)} onSave={saveRole} />}
      <div className="mt-4 divide-y divide-[#edf3f0] rounded-2xl border border-[#e5eee9] px-4 dark:divide-[#26364a] dark:border-[#2b4057]">
        {roles.map((role) => (
          <div className="flex items-center justify-between gap-3 py-4" key={role.name}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">{role.name}</p>
                {role.system && (
                  <span className="rounded-full bg-[#e5f5ec] px-2 py-0.5 text-[10px] font-semibold text-[#278b70]">
                    Sistem rolü
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#81958f]">{role.description}</p>
              <p className="mt-2 text-[11px] text-[#91a49f]">{role.permissions.length} yetki tanımlı</p>
            </div>
            <button
              aria-label={`${role.name} rolünü düzenle`}
              className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
              onClick={() => setEditingRole(role)}
              type="button"
            >
              <Edit3 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleEditor({ role, onCancel, onSave }: { role: Role; onCancel: () => void; onSave: (role: Role) => void }) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [permissions, setPermissions] = useState(role.permissions);
  const toggle = (permission: string) =>
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    );
  const toggleGroup = (group: string[]) =>
    setPermissions((current) =>
      group.every((permission) => current.includes(permission))
        ? current.filter((permission) => !group.includes(permission))
        : [...current, ...group.filter((permission) => !current.includes(permission))],
    );
  return (
    <div className="my-5 rounded-2xl border border-[#cfe6da] bg-[#f7fcf9] p-4 dark:border-[#2b4057] dark:bg-[#111827]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">
          {role.name ? "Rolü düzenle" : "Yeni rol oluştur"}
        </p>
        <button aria-label="Rol formunu kapat" className="text-[#81958f]" onClick={onCancel} type="button">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          aria-label="Rol adı"
          className="h-11 rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none dark:border-[#2b4057] dark:bg-[#18212f] dark:text-white"
          onChange={(event) => setName(event.target.value)}
          placeholder="Rol adı"
          value={name}
        />
        <input
          aria-label="Rol açıklaması"
          className="h-11 rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none dark:border-[#2b4057] dark:bg-[#18212f] dark:text-white"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Kısa açıklama"
          value={description}
        />
      </div>
      <div className="mt-4 space-y-4">
        {permissionGroups.map((group) => (
          <fieldset key={group.label}>
            <div className="flex items-center justify-between gap-3">
              <legend className="text-xs font-semibold text-[#31534f] dark:text-[#c4dfd5]">{group.label}</legend>
              <button
                className="text-[10px] font-semibold text-[#278b70] hover:text-[#1f8068]"
                onClick={() => toggleGroup(group.permissions)}
                type="button"
              >
                {group.permissions.every((permission) => permissions.includes(permission))
                  ? "Tümünü kaldır"
                  : "Tümünü seç"}
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {group.permissions.map((permission) => (
                <label className="flex items-center gap-2 text-xs text-[#718783] dark:text-[#a7bdb5]" key={permission}>
                  <input
                    checked={permissions.includes(permission)}
                    className="size-4 accent-[#299b7c]"
                    onChange={() => toggle(permission)}
                    type="checkbox"
                  />{" "}
                  {permission}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <button
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#174e4b]"
        onClick={() =>
          name.trim() &&
          onSave({ name: name.trim(), description: description.trim(), permissions, system: role.system })
        }
        type="button"
      >
        <Check className="size-3.5" /> Rolü kaydet
      </button>
    </div>
  );
}

function UserList({
  accounts,
  roles,
  query,
  setQuery,
  onRoleChange,
  onToggle,
}: {
  accounts: Account[];
  roles: Role[];
  query: string;
  setQuery: (value: string) => void;
  onRoleChange: (email: string, role: string) => void;
  onToggle: (email: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">Kullanıcı hesapları</p>
          <p className="mt-1 text-xs text-[#81958f]">Ekip üyelerinin giriş ve yetki durumlarını yönetin.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
          <input
            aria-label="Kullanıcı ara"
            className="h-10 w-52 rounded-xl border border-[#dbe9e4] bg-white pr-3 pl-9 text-xs outline-none dark:border-[#2b4057] dark:bg-[#111827] dark:text-white"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kullanıcı ara..."
            value={query}
          />
        </div>
      </div>
      <div className="mt-4 divide-y divide-[#edf3f0] rounded-2xl border border-[#e5eee9] px-4 dark:divide-[#26364a] dark:border-[#2b4057]">
        {accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#81958f]">Kullanıcı bulunamadı.</p>
        ) : (
          accounts.map((account) => (
            <div
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              key={account.email}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
                  <UserRound className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]">{account.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${account.active ? "bg-[#e5f5ec] text-[#278b70]" : "bg-[#f1e8e5] text-[#a66f60]"}`}
                    >
                      {account.active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#81958f]">
                    {account.profession} · {account.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <select
                  aria-label={`${account.name} rolü`}
                  className="h-9 rounded-lg border border-[#dbe9e4] bg-white px-2 text-xs text-[#52776d] dark:border-[#2b4057] dark:bg-[#111827] dark:text-[#c4dfd5]"
                  onChange={(event) => onRoleChange(account.email, event.target.value)}
                  value={account.role}
                >
                  {roles.map((role) => (
                    <option key={role.name}>{role.name}</option>
                  ))}
                </select>
                <button
                  className="rounded-lg px-2 py-2 text-[10px] font-semibold text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
                  onClick={() => onToggle(account.email)}
                  type="button"
                >
                  {account.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
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
