"use client";

import {
  Check,
  CheckCircle2,
  Edit3,
  FileKey2,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import SettingsCard, { SectionHeading } from "@/components/settings/settings-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Alert, Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/table";
import { useRoles, useTeam } from "@/lib/data";
import { panelPermissions, settingsPermissions, type Role, type TeamMember } from "@/lib/demo-data";
import { useNotice } from "@/lib/hooks";
import { includesQuery, initials } from "@/lib/utils";

const permissionGroups = [
  { label: "Çalışma alanı modülleri", permissions: panelPermissions },
  { label: "Ayarlar modülleri", permissions: settingsPermissions },
];

type RoleForm = Omit<Role, "system">;
type FormErrors = Partial<Record<keyof RoleForm, string>>;

const validate = (form: RoleForm): FormErrors => {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Rol adı zorunludur.";
  if (form.permissions.length === 0) errors.permissions = "En az bir yetki seçin.";
  return errors;
};

export default function RolesSettings() {
  const [roles, setRoles] = useRoles();
  const [team] = useTeam();
  const [view, setView] = useState<"roles" | "users">("roles");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [notice, showNotice] = useNotice();

  const accounts = useMemo(
    () => team.filter((member) => member.account),
    [team],
  );
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((member) =>
        includesQuery(`${member.name} ${member.email} ${member.role}`, query),
      ),
    [accounts, query],
  );
  const activeCount = accounts.filter((a) => a.active).length;

  const saveRole = (form: RoleForm) => {
    const values = { ...form, name: form.name.trim(), description: form.description.trim() };
    const editingName = editor.role?.name ?? null;
    setRoles((current) => {
      if (editingName === null) {
        if (current.some((r) => r.name === values.name)) return current;
        return [...current, { ...values }];
      }
      return current.map((r) => (r.name === editingName ? { ...r, ...values } : r));
    });
    setEditor({ open: false, role: null });
    showNotice(editingName === null ? "Yeni rol eklendi." : "Rol güncellendi.");
  };
  const toggleAccount = (member: TeamMember) => {
    showNotice(member.active ? `${member.name} pasifleştirildi.` : `${member.name} aktifleştirildi.`);
  };
  const updateAccountRole = (member: TeamMember, role: string) => {
    showNotice(`${member.name} rolü "${role}" olarak güncellendi.`);
  };

  return (
    <SettingsCard
      description="Erişim rollerini ve kullanıcı hesaplarının yetkilerini tek merkezden yönetin."
      icon={FileKey2}
      title="Rol ve kullanıcı yönetimi"
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={UsersRound} label="Kullanıcı hesabı" value={accounts.length} />
        <SummaryCard icon={CheckCircle2} label="Aktif hesap" value={activeCount} />
        <SummaryCard icon={ShieldCheck} label="Tanımlı rol" value={roles.length} />
      </div>

      <div className="mt-7 flex gap-5 border-b border-border">
        <TabButton active={view === "roles"} label="Roller" onClick={() => setView("roles")} />
        <TabButton active={view === "users"} label="Kullanıcı hesapları" onClick={() => setView("users")} />
      </div>

      {notice && <Alert className="mt-4" icon={Check}>{notice}</Alert>}

      {view === "roles" ? (
        <RoleList
          editor={editor}
          roles={roles}
          onEdit={(role) => setEditor({ open: true, role })}
          onNew={() => setEditor({ open: true, role: null })}
          onClose={() => setEditor({ open: false, role: null })}
          onSave={saveRole}
        />
      ) : (
        <UserList
          accounts={filteredAccounts}
          query={query}
          roles={roles}
          onQuery={setQuery}
          onRoleChange={updateAccountRole}
          onToggle={toggleAccount}
        />
      )}
    </SettingsCard>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
        active ? "border-brand text-brand-soft-fg" : "border-transparent text-muted hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function RoleList({
  roles,
  editor,
  onEdit,
  onNew,
  onClose,
  onSave,
}: {
  roles: Role[];
  editor: { open: boolean; role: Role | null };
  onEdit: (role: Role) => void;
  onNew: () => void;
  onClose: () => void;
  onSave: (form: RoleForm) => void;
}) {
  return (
    <div className="mt-6">
      <SectionHeading
        action={
          <Button onClick={onNew} size="sm">
            <Plus /> Yeni rol
          </Button>
        }
        description="Hangi rolün hangi modüllere erişeceğini belirleyin."
        title="Erişim rolleri"
      />
      <div className="mt-4 divide-y divide-divider rounded-2xl border border-border px-4">
        {roles.map((role) => (
          <div className="flex items-center justify-between gap-3 py-4" key={role.name}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{role.name}</p>
                {role.system && <Badge tone="neutral">Sistem rolü</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted">{role.description}</p>
              <p className="mt-2 text-[11px] text-subtle">{role.permissions.length} yetki tanımlı</p>
            </div>
            <Button
              aria-label={`${role.name} rolünü düzenle`}
              onClick={() => onEdit(role)}
              size="icon-sm"
              variant="ghost"
            >
              <Edit3 />
            </Button>
          </div>
        ))}
      </div>
      <RoleEditor key={editor.role?.name ?? "new"} open={editor.open} role={editor.role} onClose={onClose} onSave={onSave} />
    </div>
  );
}

function RoleEditor({
  open,
  role,
  onClose,
  onSave,
}: {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSave: (form: RoleForm) => void;
}) {
  const editing = Boolean(role);
  const [form, setForm] = useState<RoleForm>(
    role
      ? { name: role.name, description: role.description, permissions: role.permissions }
      : { name: "", description: "", permissions: [] },
  );
  const [submitted, setSubmitted] = useState(false);
  if (!open) return null;
  const errors = validate(form);
  const shown = submitted ? errors : {};
  const toggle = (permission: string) =>
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((p) => p !== permission)
        : [...current.permissions, permission],
    }));
  const toggleGroup = (group: string[]) =>
    setForm((current) => ({
      ...current,
      permissions: group.every((p) => current.permissions.includes(p))
        ? current.permissions.filter((p) => !group.includes(p))
        : [...current.permissions, ...group.filter((p) => !current.permissions.includes(p))],
    }));
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal
      description="Rol adını, açıklamasını ve erişeceği modülleri belirleyin."
      eyebrow="Rol yönetimi"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={submit}>
            <Check /> {editing ? "Rolü kaydet" : "Rolü oluştur"}
          </Button>
        </>
      }
      icon={FileKey2}
      onClose={onClose}
      open
      size="lg"
      title={editing ? "Rolü düzenle" : "Yeni rol oluştur"}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={shown.name} label="Rol adı" required>
            <Input
              invalid={Boolean(shown.name)}
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
              placeholder="Örn. Operasyon sorumlusu"
              value={form.name}
            />
          </Field>
          <Field label="Açıklama">
            <Input
              onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
              placeholder="Kısa açıklama"
              value={form.description}
            />
          </Field>
        </div>
        {shown.permissions && <Alert tone="danger">{shown.permissions}</Alert>}
        <div className="space-y-4">
          {permissionGroups.map((group) => (
            <fieldset key={group.label}>
              <div className="flex items-center justify-between gap-3">
                <legend className="text-xs font-semibold text-foreground">{group.label}</legend>
                <button
                  className="text-[10px] font-semibold text-brand hover:text-brand-soft-fg"
                  onClick={() => toggleGroup(group.permissions)}
                  type="button"
                >
                  {group.permissions.every((p) => form.permissions.includes(p)) ? "Tümünü kaldır" : "Tümünü seç"}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    className="flex items-center gap-2 text-xs text-muted"
                    key={permission}
                  >
                    <Checkbox
                      checked={form.permissions.includes(permission)}
                      onChange={() => toggle(permission)}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <button className="hidden" type="submit" />
      </form>
    </Modal>
  );
}

function UserList({
  accounts,
  roles,
  query,
  onQuery,
  onRoleChange,
  onToggle,
}: {
  accounts: TeamMember[];
  roles: Role[];
  query: string;
  onQuery: (value: string) => void;
  onRoleChange: (member: TeamMember, role: string) => void;
  onToggle: (member: TeamMember) => void;
}) {
  return (
    <div className="mt-6">
      <SectionHeading
        action={
          <SearchInput
            aria-label="Kullanıcı ara"
            className="w-full sm:w-56 [&_input]:h-10 [&_input]:text-xs"
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Kullanıcı ara..."
            value={query}
          />
        }
        description="Ekip üyelerinin giriş ve yetki durumlarını yönetin."
        title="Kullanıcı hesapları"
      />
      {accounts.length === 0 ? (
        <EmptyState
          className="mt-4"
          compact
          description={query ? "Aramanızla eşleşen kullanıcı bulunamadı." : "Kullanıcı hesabı olan ekip üyesi yok."}
          icon={UsersRound}
          title="Kullanıcı bulunamadı"
        />
      ) : (
        <ul className="mt-4 divide-y divide-divider rounded-2xl border border-border px-4">
          {accounts.map((member) => (
            <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={member.id}>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm" text={initials(member.name)} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <Badge tone={member.active ? "brand" : "danger"}>
                      {member.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {member.profession} · {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Select
                  aria-label={`${member.name} rolü`}
                  className="h-9 w-auto text-xs"
                  onChange={(event) => onRoleChange(member, event.target.value)}
                  value={member.role}
                >
                  {roles.map((role) => (
                    <option key={role.name}>{role.name}</option>
                  ))}
                </Select>
                <Button onClick={() => onToggle(member)} size="xs" variant="ghost">
                  {member.active ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
