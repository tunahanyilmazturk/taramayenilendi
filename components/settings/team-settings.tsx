"use client";

import { Check, CheckCircle2, Edit3, Mail, Phone, Plus, Trash2, UserRound, UsersRound } from "lucide-react";
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
import { professions, type TeamMember } from "@/lib/demo-data";
import { useNotice } from "@/lib/hooks";
import { includesQuery, initials } from "@/lib/utils";

type MemberForm = Omit<TeamMember, "id" | "active">;
type FormErrors = Partial<Record<keyof MemberForm, string>>;

const fallbackRole = "Saha personeli";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm: MemberForm = {
  name: "",
  profession: professions[0],
  email: "",
  phone: "",
  role: fallbackRole,
  account: true,
};

const validate = (form: MemberForm): FormErrors => {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Ad soyad zorunludur.";
  if (form.email.trim() && !emailPattern.test(form.email.trim())) errors.email = "Geçerli bir e-posta adresi girin.";
  if (form.account && !form.email.trim()) errors.email = "Kullanıcı hesabı için e-posta gerekir.";
  return errors;
};

export default function TeamSettings() {
  const [team, setTeam] = useTeam();
  const [roles] = useRoles();
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  const [notice, showNotice] = useNotice();
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);
  const filtered = useMemo(
    () =>
      team.filter(
        (member) =>
          (showInactive || member.active) &&
          includesQuery(`${member.name} ${member.profession} ${member.email} ${member.role}`, query),
      ),
    [team, query, showInactive],
  );
  const activeCount = team.filter((member) => member.active).length;
  const accountCount = team.filter((member) => member.account).length;

  const saveMember = (form: MemberForm) => {
    const values = { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
    const editingId = editor.member?.id ?? null;
    setTeam((current) => {
      if (editingId === null) {
        const id = current.length ? Math.max(...current.map((member) => member.id)) + 1 : 1;
        return [...current, { ...values, id, active: true }];
      }
      return current.map((member) => (member.id === editingId ? { ...member, ...values } : member));
    });
    setEditor({ open: false, member: null });
    showNotice(editingId === null ? "Ekip üyesi eklendi." : "Ekip üyesi güncellendi.");
  };
  const toggleMember = (member: TeamMember) => {
    setTeam((current) => current.map((item) => (item.id === member.id ? { ...item, active: !item.active } : item)));
    showNotice(member.active ? `${member.name} pasifleştirildi.` : `${member.name} aktifleştirildi.`);
  };
  const removeMember = (member: TeamMember) => {
    if (!window.confirm(`${member.name} ekipten kalıcı olarak silinsin mi?`)) return;
    setTeam((current) => current.filter((item) => item.id !== member.id));
    showNotice("Ekip üyesi silindi.");
  };

  return (
    <SettingsCard
      action={
        <Button onClick={() => setEditor({ open: true, member: null })} size="sm">
          <Plus /> Yeni ekip üyesi
        </Button>
      }
      description="OSGB çalışanlarınızı, mesleklerini ve kullanıcı erişimlerini tek merkezden yönetin."
      icon={UsersRound}
      title="Ekip yönetimi"
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={UsersRound} label="Toplam ekip" value={team.length} />
        <SummaryCard icon={CheckCircle2} label="Aktif çalışan" value={activeCount} />
        <SummaryCard icon={UserRound} label="Kullanıcı hesabı" value={accountCount} />
      </div>
      <div className="mt-7">
        <SectionHeading
          action={
            <>
              <SearchInput
                aria-label="Ekipte ara"
                className="w-full sm:w-56 [&_input]:h-10 [&_input]:text-xs"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ekipte ara..."
                value={query}
              />
              <Button onClick={() => setShowInactive((value) => !value)} size="sm" variant="outline">
                {showInactive ? "Sadece aktifler" : "Pasifleri göster"}
              </Button>
            </>
          }
          description="Meslek, iletişim ve hesap durumlarını görüntüleyin."
          title="Ekip listesi"
        />
      </div>
      {notice && (
        <Alert className="mt-4" icon={Check}>
          {notice}
        </Alert>
      )}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            compact
            description={
              query
                ? "Aramanızla eşleşen ekip üyesi bulunamadı."
                : "Henüz ekip üyesi yok. İlk üyeyi ekleyerek başlayın."
            }
            icon={UsersRound}
            title="Ekip üyesi bulunamadı"
          />
        ) : (
          <ul className="divide-y divide-divider rounded-2xl border border-border px-4">
            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEdit={() => setEditor({ open: true, member })}
                onRemove={() => removeMember(member)}
                onToggle={() => toggleMember(member)}
              />
            ))}
          </ul>
        )}
      </div>
      <MemberDialog
        key={editor.member?.id ?? "new"}
        member={editor.member}
        onClose={() => setEditor({ open: false, member: null })}
        onSave={saveMember}
        open={editor.open}
        roleNames={roleNames}
      />
    </SettingsCard>
  );
}

function MemberRow({
  member,
  onEdit,
  onRemove,
  onToggle,
}: {
  member: TeamMember;
  onEdit: () => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <li className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar text={initials(member.name)} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
            <Badge tone={member.active ? "brand" : "danger"}>{member.active ? "Aktif" : "Pasif"}</Badge>
            <Badge tone="neutral">{member.account ? "Kullanıcı hesabı" : "Sadece ekip"}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {member.profession} · {member.role}
          </p>
          {(member.email || member.phone) && (
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-subtle">
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
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 lg:shrink-0">
        <Button aria-label={`${member.name} düzenle`} onClick={onEdit} size="icon-sm" variant="ghost">
          <Edit3 />
        </Button>
        <Button onClick={onToggle} size="xs" variant="ghost">
          {member.active ? "Pasifleştir" : "Aktifleştir"}
        </Button>
        <Button aria-label={`${member.name} sil`} onClick={onRemove} size="icon-sm" variant="danger">
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function MemberDialog({
  open,
  member,
  roleNames,
  onClose,
  onSave,
}: {
  open: boolean;
  member: TeamMember | null;
  roleNames: string[];
  onClose: () => void;
  onSave: (form: MemberForm) => void;
}) {
  const [form, setForm] = useState<MemberForm>(
    member
      ? {
          name: member.name,
          profession: member.profession,
          email: member.email,
          phone: member.phone,
          role: member.role,
          account: member.account,
        }
      : emptyForm,
  );
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(form);
  const shown = submitted ? errors : {};
  const roleOptions = roleNames.includes(form.role) ? roleNames : [form.role, ...roleNames];
  const professionOptions = professions.includes(form.profession) ? professions : [form.profession, ...professions];
  const setField = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal
      description="Meslek, iletişim bilgileri ve kullanıcı hesabı tercihini belirleyin."
      eyebrow="Ekip yönetimi"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={submit}>
            <Check /> {member ? "Değişiklikleri kaydet" : "Ekibe ekle"}
          </Button>
        </>
      }
      icon={member ? Edit3 : Plus}
      onClose={onClose}
      open={open}
      title={member ? "Ekip üyesini düzenle" : "Yeni ekip üyesi"}
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field className="sm:col-span-2" error={shown.name} label="Ad soyad" required>
          <Input
            autoFocus
            invalid={Boolean(shown.name)}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Örn. Dr. Elif Kaya"
            value={form.name}
          />
        </Field>
        <Field label="Meslek">
          <Select onChange={(event) => setField("profession", event.target.value)} value={form.profession}>
            {professionOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Kullanıcı rolü">
          <Select onChange={(event) => setField("role", event.target.value)} value={form.role}>
            {roleOptions.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </Select>
        </Field>
        <Field error={shown.email} label="E-posta">
          <Input
            invalid={Boolean(shown.email)}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="ad.soyad@kurum.com"
            type="email"
            value={form.email}
          />
        </Field>
        <Field label="Telefon">
          <Input
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="+90 5xx xxx xx xx"
            type="tel"
            value={form.phone}
          />
        </Field>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-card-muted p-3 text-xs text-muted sm:col-span-2">
          <Checkbox
            checked={form.account}
            className="mt-0.5"
            onChange={(event) => setField("account", event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Kullanıcı hesabı oluştur</span>
            Bu kişi panele giriş yapabilir ve rol yönetiminde listelenir.
          </span>
        </label>
        <button className="hidden" type="submit" />
      </form>
    </Modal>
  );
}
