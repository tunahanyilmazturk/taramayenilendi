"use client";

import { Check, FileText, Mail, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { useCoverLetterTemplates, useOrganization } from "@/lib/data";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import TemplateManagerModal from "./template-manager-modal";
import { defaultCoverLetterTemplates, fillCoverLetter, type UpdateWizard, type WizardState } from "./types";

export default function StepTerms({
  wizard,
  update,
}: {
  wizard: WizardState;
  update: UpdateWizard;
}) {
  const [organization] = useOrganization();
  const [templates, setTemplates] = useCoverLetterTemplates(defaultCoverLetterTemplates);

  const selectTemplate = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    update("coverLetterId", id);
    update("coverLetterText", fillCoverLetter(template.body, wizard, organization));
  };

  const selectedTemplate = templates.find((t) => t.id === wizard.coverLetterId);

  return (
    <div>
      <StepHeading
        eyebrow="4. Adım · Ön Yazı"
        title="Teklif ön yazısı"
        description="Şablondan bir ön yazı seçin ve düzenleyin. Firma, teklif türü ve tarih bilgileri otomatik doldurulur."
        icon={Mail}
      />

      <div className="mt-7 space-y-5">
        {/* Template selection */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <FileText className="size-3.5" />
              </span>
              <h3 className="text-xs font-bold text-foreground">Şablon seçin</h3>
            </div>
            <TemplateManagerModal
              onSave={setTemplates}
              templates={templates}
              type="coverLetter"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => {
              const active = wizard.coverLetterId === template.id;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                    active
                      ? "border-brand-outline bg-brand-soft ring-2 ring-brand-ring"
                      : "border-border bg-card hover:border-border-strong hover:bg-card-muted",
                  )}
                  key={template.id}
                  onClick={() => selectTemplate(template.id)}
                  title={template.description}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      active ? "border-brand bg-brand text-brand-fg" : "border-border-strong",
                    )}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold leading-tight",
                      active ? "text-brand-soft-fg" : "text-foreground",
                    )}
                  >
                    {template.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editable preview */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <Pencil className="size-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Ön yazı {selectedTemplate && <span className="text-muted">· {selectedTemplate.name}</span>}
              </h3>
            </div>
            {wizard.coverLetterId !== null && (
              <button
                className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                onClick={() => {
                  const template = templates.find((t) => t.id === wizard.coverLetterId);
                  if (template) update("coverLetterText", fillCoverLetter(template.body, wizard, organization));
                }}
                type="button"
              >
                Şablona sıfırla
              </button>
            )}
          </div>
          {wizard.coverLetterId === null ? (
            <div className="rounded-xl border border-dashed border-border-strong py-10 text-center">
              <Mail className="mx-auto size-8 text-subtle" />
              <p className="mt-3 text-xs font-semibold text-muted">Ön yazı seçilmedi</p>
              <p className="mt-1 text-[10px] text-subtle">
                Yukarıdan bir şablon seçin.
              </p>
            </div>
          ) : (
            <Textarea
              className="min-h-64 font-mono text-xs leading-6"
              onChange={(event) => update("coverLetterText", event.target.value)}
              value={wizard.coverLetterText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
