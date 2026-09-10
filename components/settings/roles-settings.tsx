"use client";

import {
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  FileKey2,
  Plus,
  ShieldCheck,
  UserRound,
  UserCog,
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
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/table";
import { useRoles, useTeam } from "@/lib/data";
import { panelPermissions, settingsPermissions, type Role, type TeamMember } from "@/lib/demo-data";
import { useConfirm, useNotice } from "@/lib/hooks";
import { includesQuery, initials } from "@/lib/utils";

type DetailedPermission = { id: string; label: string; description: string };
type PermissionGroup = { label: string; legacy: string; permissions: DetailedPermission[] };

const permissionGroups: PermissionGroup[] = [
  {
    label: "Çalışma alanı modülleri",
    legacy: "panel",
    permissions: [
      { id: "dashboard.view", label: "Genel bakışı görüntüle", description: "Operasyon özetini ve günlük akışı görüntüler." },
      { id: "companies.list", label: "Firmaları görüntüle", description: "Firma listesini ve arama sonuçlarını görüntüler." },
      { id: "companies.detail", label: "Firma detayına gir", description: "Firma detayını, sözleşmeleri ve geçmişi açar." },
      { id: "companies.write", label: "Firma oluştur ve düzenle", description: "Firma bilgilerini ekler veya günceller." },
      { id: "companies.delete", label: "Firma sil", description: "Firmayı ve bağlı kayıtları silme akışını açar." },
      { id: "companies.export", label: "Firma Excel aktarımı", description: "Firma listesini Excel dosyası olarak dışa aktarır." },
      { id: "personnel.list", label: "Personelleri görüntüle", description: "Personel listesini ve arama sonuçlarını görüntüler." },
      { id: "personnel.detail", label: "Personel detayına gir", description: "Personel özlük ve tarama geçmişini açar." },
      { id: "personnel.write", label: "Personel oluştur ve düzenle", description: "Personel kaydı ekler veya günceller." },
      { id: "personnel.delete", label: "Personel sil", description: "Personel silme akışını açar." },
      { id: "screenings.list", label: "Taramaları görüntüle", description: "Tarama planlarını ve geçmişini görüntüler." },
      { id: "screenings.detail", label: "Tarama detayına gir", description: "Tarama katılımcılarını ve sonuç durumunu açar." },
      { id: "screenings.create", label: "Tarama oluştur", description: "Yeni saha taraması planlar." },
      { id: "screenings.write", label: "Tarama düzenle ve iptal et", description: "Tarama tarihini ve durumunu değiştirir." },
      { id: "screenings.delete", label: "Tarama sil", description: "Tarama kaydını silme akışını açar." },
      { id: "screenings.export", label: "Tarama Excel aktarımı", description: "Tarama listesini Excel dosyası olarak dışa aktarır." },
      { id: "offers.list", label: "Teklifleri görüntüle", description: "Teklif listesini ve durumlarını görüntüler." },
      { id: "offers.detail", label: "Teklif detayına gir", description: "Teklif kalemlerini ve yanıt geçmişini açar." },
      { id: "offers.create", label: "Teklif oluştur", description: "Yeni teklif hazırlar." },
      { id: "offers.write", label: "Teklif düzenle", description: "Teklif içeriğini ve durumunu günceller." },
      { id: "offers.delete", label: "Teklif sil", description: "Teklif kaydını silme akışını açar." },
      { id: "offers.export", label: "Teklif Excel aktarımı", description: "Teklif listesini Excel dosyası olarak dışa aktarır." },
      { id: "calendar.view", label: "Takvimi görüntüle", description: "Saha planını takvim üzerinde görüntüler." },
      { id: "calendar.write", label: "Takvim planını düzenle", description: "Tarama planlarını takvimden taşır veya günceller." },
      { id: "statistics.view", label: "İstatistikleri görüntüle", description: "Analiz ve rapor ekranlarını görüntüler." },
      { id: "statistics.export", label: "İstatistik Excel aktarımı", description: "Raporları Excel dosyası olarak dışa aktarır." },
      { id: "results.list", label: "Sonuçları görüntüle", description: "Tarama sonuçlarının operasyonel durumunu görüntüler." },
      { id: "results.detail", label: "Sonuç detayına gir", description: "Sonuç teslim ve raporlama ayrıntılarını açar." },
      { id: "results.export", label: "Sonuç Excel aktarımı", description: "Sonuç durum listesini Excel dosyası olarak dışa aktarır." },
      { id: "equipment.list", label: "Ekipmanları görüntüle", description: "Ekipman envanterini görüntüler." },
      { id: "equipment.write", label: "Ekipman oluştur ve düzenle", description: "Ekipman kaydı ekler veya günceller." },
      { id: "equipment.delete", label: "Ekipman sil", description: "Ekipman kaydını silme akışını açar." },
      { id: "equipment.export", label: "Ekipman Excel aktarımı", description: "Ekipman listesini Excel dosyası olarak dışa aktarır." },
    ],
  },
  {
    label: "Ayarlar modülleri",
    legacy: "settings",
    permissions: [
      { id: "settings.organization", label: "Kurum bilgilerini yönet", description: "Kurum kimliği, iletişim ve logo bilgilerini düzenler." },
      { id: "settings.team", label: "Ekip yönetimini aç", description: "Ekip üyelerini ve iletişim bilgilerini yönetir." },
      { id: "settings.roles", label: "Rol ve kullanıcı yönetimini aç", description: "Rolleri ve kullanıcı erişimlerini yönetir." },
      { id: "settings.tests", label: "Test kataloğunu yönet", description: "Testleri ve test kategorilerini düzenler." },
      { id: "settings.appearance", label: "Görünüm ayarlarını yönet", description: "Tema ve arayüz tercihlerini değiştirir." },
      { id: "settings.notifications", label: "Bildirim ayarlarını yönet", description: "Bildirim tercihlerini düzenler." },
      { id: "settings.security", label: "Güvenlik ayarlarını yönet", description: "Oturum ve güvenlik tercihlerini açar." },
    ],
  },
];
const allDetailedPermissions = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id));
const legacyPermissions = [panelPermissions, settingsPermissions];
const expandPermissions = (permissions: string[]) => {
  const expanded = new Set(permissions);
  permissionGroups.forEach((group, index) => {
    const legacySelection = legacyPermissions[index].some((permission) => permissions.includes(permission));
    if (legacySelection) group.permissions.forEach((permission) => expanded.add(permission.id));
  });
  return [...expanded];
};

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
  const [team, setTeam] = useTeam();
  const [view, setView] = useState<"roles" | "users">("roles");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [accountEditor, setAccountEditor] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();

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
    const duplicate = roles.some(
      (role) => role.name.trim().toLocaleLowerCase("tr-TR") === values.name.toLocaleLowerCase("tr-TR") && role.name !== editingName,
    );
    if (duplicate) {
      showNotice("Bu adla tanımlı bir rol zaten var.");
      return;
    }
    setRoles((current) => {
      if (editingName === null) {
        return [...current, { ...values }];
      }
      return current.map((r) => (r.name === editingName ? { ...r, ...values, system: r.system } : r));
    });
    if (editingName && editingName !== values.name) {
      setTeam((current) =>
        current.map((member) => (member.role === editingName ? { ...member, role: values.name } : member)),
      );
    }
    setEditor({ open: false, role: null });
    showNotice(editingName === null ? "Yeni rol eklendi." : "Rol güncellendi.");
  };
  const toggleAccount = (member: TeamMember) => {
    setTeam((current) => current.map((item) => (item.id === member.id ? { ...item, active: !item.active } : item)));
    showNotice(member.active ? `${member.name} pasifleştirildi.` : `${member.name} aktifleştirildi.`);
  };
  const updateAccountRole = (member: TeamMember, role: string) => {
    setTeam((current) => current.map((item) => (item.id === member.id ? { ...item, role } : item)));
    showNotice(`${member.name} rolü "${role}" olarak güncellendi.`);
  };
  const saveAccountPermissions = (member: TeamMember, permissions: string[] | undefined) => {
    setTeam((current) =>
      current.map((item) => (item.id === member.id ? { ...item, permissions } : item)),
    );
    setAccountEditor({ open: false, member: null });
    showNotice(`${member.name} erişim ayarları güncellendi.`);
  };
  const removeRole = (role: Role) => {
    if (role.system) {
      showNotice("Sistem rolleri silinemez.");
      return;
    }
    const usageCount = team.filter((member) => member.role === role.name).length;
    if (usageCount > 0) {
      showNotice(`${role.name} silinemedi: ${usageCount} kullanıcı bu rolü kullanıyor. Önce kullanıcıları başka role aktarın.`);
      return;
    }
    confirm({
      title: "Özel rolü sil",
      description: `${role.name} rolü ve izin tanımı kalıcı olarak silinecek.`,
      confirmLabel: "Rolü sil",
      onConfirm: () => {
        setRoles((current) => current.filter((item) => item.name !== role.name));
        showNotice(`${role.name} rolü silindi.`);
      },
    });
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
          team={team}
          onEdit={(role) => setEditor({ open: true, role })}
          onNew={() => setEditor({ open: true, role: null })}
          onClose={() => setEditor({ open: false, role: null })}
          onDelete={removeRole}
          onSave={saveRole}
        />
      ) : (
        <UserList
          accounts={filteredAccounts}
          query={query}
          roles={roles}
          onQuery={setQuery}
          onRoleChange={updateAccountRole}
          onEditAccess={(member) => setAccountEditor({ open: true, member })}
          onToggle={toggleAccount}
        />
      )}
      <AccountAccessEditor
        key={accountEditor.member?.id ?? "none"}
        member={accountEditor.member}
        onClose={() => setAccountEditor({ open: false, member: null })}
        onSave={saveAccountPermissions}
        open={accountEditor.open}
        role={accountEditor.member ? roles.find((item) => item.name === accountEditor.member?.role) ?? null : null}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
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
  team,
  editor,
  onEdit,
  onNew,
  onClose,
  onDelete,
  onSave,
}: {
  roles: Role[];
  team: TeamMember[];
  editor: { open: boolean; role: Role | null };
  onEdit: (role: Role) => void;
  onNew: () => void;
  onClose: () => void;
  onDelete: (role: Role) => void;
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
              <p className="mt-2 text-[11px] text-subtle">{role.permissions.length} yetki · {team.filter((member) => member.role === role.name).length} kullanıcı</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button aria-label={`${role.name} rolünü düzenle`} onClick={() => onEdit(role)} size="icon-sm" variant="ghost">
                <Edit3 />
              </Button>
              {!role.system && <Button aria-label={`${role.name} rolünü sil`} onClick={() => onDelete(role)} size="icon-sm" variant="danger">
                <X />
              </Button>}
            </div>
          </div>
        ))}
      </div>
      <RoleEditor
        key={editor.role?.name ?? "new"}
        open={editor.open}
        role={editor.role}
        usedCount={editor.role ? team.filter((member) => member.role === editor.role?.name).length : 0}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}

function RoleEditor({
  open,
  role,
  usedCount,
  onClose,
  onSave,
}: {
  open: boolean;
  role: Role | null;
  usedCount: number;
  onClose: () => void;
  onSave: (form: RoleForm) => void;
}) {
  const editing = Boolean(role);
  const [form, setForm] = useState<RoleForm>(
    role
      ? { name: role.name, description: role.description, permissions: expandPermissions(role.permissions) }
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
  const toggleGroup = (group: DetailedPermission[]) =>
    setForm((current) => ({
      ...current,
      permissions: group.every((permission) => current.permissions.includes(permission.id))
        ? current.permissions.filter((permission) => !group.some((item) => item.id === permission))
        : [...current.permissions, ...group.map((permission) => permission.id).filter((permission) => !current.permissions.includes(permission))],
    }));
  const selectAll = () => setForm((current) => ({ ...current, permissions: [...allDetailedPermissions] }));
  const clearAll = () => setForm((current) => ({ ...current, permissions: [] }));
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal
      description="Rol adını, açıklamasını ve erişeceği modülleri belirleyin. Kullanıcılar bu rolün izinlerini devralır."
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card-muted p-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Modül erişimleri</p>
            <p className="mt-1 text-xs text-muted">
              {form.permissions.length} / {allDetailedPermissions.length} erişim seçildi
              {editing && usedCount > 0 ? ` · ${usedCount} kullanıcı bu rolü kullanıyor` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={selectAll} size="xs" type="button" variant="outline">Tümünü seç</Button>
            <Button onClick={clearAll} size="xs" type="button" variant="ghost">Temizle</Button>
          </div>
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
                  {group.permissions.every((permission) => form.permissions.includes(permission.id)) ? "Tümünü kaldır" : "Tümünü seç"}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted"
                    key={permission.id}
                    title={permission.description}
                  >
                    <Checkbox
                      checked={form.permissions.includes(permission.id)}
                      onChange={() => toggle(permission.id)}
                    />
                    <span>
                      <span className="block text-xs font-medium text-foreground">{permission.label}</span>
                      <span className="mt-0.5 block text-[10px] text-subtle">{permission.description}</span>
                    </span>
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
  onEditAccess,
  onToggle,
}: {
  accounts: TeamMember[];
  roles: Role[];
  query: string;
  onQuery: (value: string) => void;
  onRoleChange: (member: TeamMember, role: string) => void;
  onEditAccess: (member: TeamMember) => void;
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
                    <Badge tone="neutral">
                      {member.permissions ? "Özel erişim" : "Rol izinleri"}
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
                <Button
                  onClick={() => onEditAccess(member)}
                  size="xs"
                  variant="outline"
                >
                  <UserCog /> Erişimler
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountAccessEditor({
  member,
  role,
  open,
  onClose,
  onSave,
}: {
  member: TeamMember | null;
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSave: (member: TeamMember, permissions: string[] | undefined) => void;
}) {
  const [customize, setCustomize] = useState(Boolean(member?.permissions));
  const [permissions, setPermissions] = useState<string[]>(
    expandPermissions(member?.permissions ?? role?.permissions ?? []),
  );

  if (!open || !member) return null;
  const basePermissions = expandPermissions(role?.permissions ?? []);
  const toggle = (permission: string) =>
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  const toggleGroup = (group: DetailedPermission[]) =>
    setPermissions((current) =>
      group.every((permission) => current.includes(permission.id))
        ? current.filter((permission) => !group.some((item) => item.id === permission))
        : [...current, ...group.map((permission) => permission.id).filter((permission) => !current.includes(permission))],
    );

  return (
    <Modal
      description={`${member.name} için hangi çalışma alanlarının ve ayarların görünür olacağını seçin.`}
      eyebrow="Kullanıcı erişimi"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">Vazgeç</Button>
          <Button onClick={() => onSave(member, customize ? permissions : undefined)}>
            <Check /> Erişimleri kaydet
          </Button>
        </>
      }
      icon={Eye}
      onClose={onClose}
      open
      size="lg"
      title={`${member.name} erişimlerini düzenle`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card-muted p-3">
          <Checkbox
            checked={!customize}
            onChange={() => setCustomize(false)}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Rol izinlerini kullan</p>
            <p className="mt-1 text-xs text-muted">
              {role?.name ?? "Atanmış rol"} rolündeki {basePermissions.length} izin bu kullanıcıya uygulanır.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card-muted p-3">
          <Checkbox
            checked={customize}
            onChange={(event) => {
              setCustomize(event.target.checked);
              if (event.target.checked && permissions.length === 0) setPermissions(basePermissions);
            }}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Bu kullanıcı için özel erişim tanımla</p>
            <p className="mt-1 text-xs text-muted">İşaretlenmeyen alanlar bu hesapta görünmez.</p>
          </div>
        </div>
        <div className={customize ? "space-y-4" : "pointer-events-none space-y-4 opacity-45"}>
          {permissionGroups.map((group) => (
            <fieldset key={group.label}>
              <div className="flex items-center justify-between gap-3">
                <legend className="text-xs font-semibold text-foreground">{group.label}</legend>
                <button
                  className="text-[10px] font-semibold text-brand hover:text-brand-soft-fg"
                  onClick={() => toggleGroup(group.permissions)}
                  type="button"
                >
                  {group.permissions.every((permission) => permissions.includes(permission.id)) ? "Tümünü kaldır" : "Tümünü seç"}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted" key={permission.id} title={permission.description}>
                    <Checkbox checked={permissions.includes(permission.id)} onChange={() => toggle(permission.id)} />
                    <span>
                      <span className="block text-xs font-medium text-foreground">{permission.label}</span>
                      <span className="mt-0.5 block text-[10px] text-subtle">{permission.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    </Modal>
  );
}
