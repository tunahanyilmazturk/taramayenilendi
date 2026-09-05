"use client";

import { Check, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { ConditionTemplate, CoverLetterTemplate } from "@/lib/data";

type AnyTemplate = CoverLetterTemplate | ConditionTemplate;
type TemplateType = "coverLetter" | "condition";

type Props<T extends AnyTemplate> = {
  type: TemplateType;
  templates: T[];
  onSave: (templates: T[]) => void;
};

export default function TemplateManagerModal<T extends AnyTemplate>({ type, templates, onSave }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isCoverLetter = type === "coverLetter";
  const editing = editingId !== null ? templates.find((t) => t.id === editingId) : undefined;

  const openAdd = () => {
    setEditingId(null);
    setIsAdding(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setIsAdding(false);
  };

  const close = () => {
    setOpen(false);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = (template: AnyTemplate) => {
    if (editingId !== null) {
      onSave(templates.map((t) => (t.id === editingId ? ({ ...template, id: editingId } as T) : t)));
    } else {
      const newId = Math.max(0, ...templates.map((t) => t.id)) + 1;
      onSave([...templates, { ...template, id: newId } as T]);
    }
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <>
      <button
        className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-fg transition-colors hover:bg-brand-strong"
        onClick={() => setOpen(true)}
        title={isCoverLetter ? "Ön yazı şablonlarını yönet" : "Şart şablonlarını yönet"}
        type="button"
      >
        <Plus className="size-4" />
      </button>

      {open && (
        <Modal
          description={
            isCoverLetter
              ? "Ön yazı şablonlarını ekleyin, düzenleyin veya silin."
              : "Şart ve koşul şablonlarını ekleyin, düzenleyin veya silin."
          }
          eyebrow="Şablon yöneticisi"
          icon={FileText}
          onClose={close}
          open
          size="xl"
          title={isCoverLetter ? "Ön yazı şablonları" : "Şart ve koşul şablonları"}
        >
          {editing || isAdding ? (
            <TemplateEditor
              isCoverLetter={isCoverLetter}
              template={editing}
              onCancel={() => {
                setEditingId(null);
                setIsAdding(false);
              }}
              onSave={handleSave}
            />
          ) : (
            <TemplateList
              isCoverLetter={isCoverLetter}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={(id) => onSave(templates.filter((t) => t.id !== id))}
              templates={templates}
            />
          )}
        </Modal>
      )}
    </>
  );
}

function TemplateList({
  templates,
  isCoverLetter,
  onAdd,
  onEdit,
  onDelete,
}: {
  templates: AnyTemplate[];
  isCoverLetter: boolean;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{templates.length} şablon</p>
        <Button onClick={onAdd} size="sm">
          <Plus /> Yeni şablon
        </Button>
      </div>
      <div className="space-y-2">
        {templates.map((template) => {
          const ct = template as ConditionTemplate;
          const cl = template as CoverLetterTemplate;
          return (
            <div
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
              key={template.id}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-foreground">
                    {isCoverLetter ? cl.name : ct.title}
                  </p>
                  {template.builtIn && (
                    <span className="rounded-full bg-neutral-soft px-2 py-0.5 text-[9px] font-bold tracking-wider text-neutral uppercase">
                      Yerleşik
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted">
                  {isCoverLetter ? cl.description : ct.body}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button aria-label="Düzenle" onClick={() => onEdit(template.id)} size="icon-sm" variant="ghost">
                  <Pencil />
                </Button>
                {!template.builtIn && confirmDeleteId === template.id && (
                  <Button
                    aria-label="Silmeyi onayla"
                    onClick={() => {
                      onDelete(template.id);
                      setConfirmDeleteId(null);
                    }}
                    size="icon-sm"
                    variant="danger"
                  >
                    <Check />
                  </Button>
                )}
                {!template.builtIn && confirmDeleteId === template.id && (
                  <Button
                    aria-label="Vazgeç"
                    onClick={() => setConfirmDeleteId(null)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <X />
                  </Button>
                )}
                {!template.builtIn && confirmDeleteId !== template.id && (
                  <Button
                    aria-label="Sil"
                    onClick={() => setConfirmDeleteId(template.id)}
                    size="icon-sm"
                    variant="danger"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TemplateEditor({
  isCoverLetter,
  template,
  onSave,
  onCancel,
}: {
  isCoverLetter: boolean;
  template: AnyTemplate | undefined;
  onSave: (template: AnyTemplate) => void;
  onCancel: () => void;
}) {
  const isEdit = template !== undefined;
  const cl = template as CoverLetterTemplate | undefined;
  const ct = template as ConditionTemplate | undefined;

  const [name, setName] = useState(isCoverLetter ? (cl?.name ?? "") : (ct?.title ?? ""));
  const [description, setDescription] = useState(cl?.description ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim() ? "" : isCoverLetter ? "Şablon adı zorunludur." : "Şart başlığı zorunludur.";
  const bodyError = body.trim() ? "" : "İçerik boş olamaz.";

  const save = () => {
    setSubmitted(true);
    if (nameError || bodyError) return;
    if (isCoverLetter) {
      onSave({
        id: 0,
        name: name.trim(),
        description: description.trim() || "Özel şablon",
        icon: "custom",
        body: body.trim(),
        builtIn: false,
      } as CoverLetterTemplate);
    } else {
      onSave({
        id: 0,
        title: name.trim(),
        body: body.trim(),
        builtIn: false,
      } as ConditionTemplate);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Pencil className="size-3.5" />
        {isEdit ? "Şablonu düzenle" : "Yeni şablon ekle"}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={submitted ? nameError : ""} label={isCoverLetter ? "Şablon adı" : "Şart başlığı"} required>
          <Input
            invalid={Boolean(submitted && nameError)}
            onChange={(event) => setName(event.target.value)}
            placeholder={isCoverLetter ? "Örn. Kısa ve öz" : "Örn. Ödeme koşulları"}
            value={name}
          />
        </Field>
        {isCoverLetter && (
          <Field label="Açıklama">
            <Input
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Örn. Öz ve net, tek paragraf."
              value={description}
            />
          </Field>
        )}
      </div>

      <Field error={submitted ? bodyError : ""} label="İçerik" required>
        <Textarea
          className="min-h-48 font-mono text-xs leading-6"
          invalid={Boolean(submitted && bodyError)}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            isCoverLetter
              ? "Sayın İlgili,\n\n{{company}} firması için...\n\n{{signature}}"
              : "Teklif tutarı, {{paymentTerms}} olarak tahsil edilir..."
          }
          value={body}
        />
      </Field>

      {isCoverLetter && (
        <div className="rounded-xl bg-card-muted p-3 text-[11px] leading-5 text-muted">
          <p className="font-semibold text-foreground">Kullanılabilir değişkenler:</p>
          <p className="mt-1">
            <code className="text-brand">{"{{company}}"}</code> · <code className="text-brand">{"{{offerType}}"}</code> ·{" "}
            <code className="text-brand">{"{{employeeCount}}"}</code> · <code className="text-brand">{"{{validUntil}}"}</code> ·{" "}
            <code className="text-brand">{"{{deliveryDays}}"}</code> · <code className="text-brand">{"{{paymentTerms}}"}</code> ·{" "}
            <code className="text-brand">{"{{signature}}"}</code>
          </p>
        </div>
      )}
      {!isCoverLetter && (
        <div className="rounded-xl bg-card-muted p-3 text-[11px] leading-5 text-muted">
          <p className="font-semibold text-foreground">Kullanılabilir değişkenler:</p>
          <p className="mt-1">
            <code className="text-brand">{"{{paymentTerms}}"}</code> · <code className="text-brand">{"{{deliveryDays}}"}</code>
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-divider pt-4">
        <Button onClick={onCancel} variant="ghost">
          Vazgeç
        </Button>
        <Button onClick={save}>
          <Check /> {isEdit ? "Değişiklikleri kaydet" : "Şablon ekle"}
        </Button>
      </div>
    </div>
  );
}
