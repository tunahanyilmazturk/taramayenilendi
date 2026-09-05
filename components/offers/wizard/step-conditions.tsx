"use client";

import { Check, FileText, Pencil, ScrollText } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { useConditionTemplates } from "@/lib/data";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import TemplateManagerModal from "./template-manager-modal";
import {
  buildConditionsText,
  defaultConditionTemplates,
  type UpdateWizard,
  type WizardState,
} from "./types";

export default function StepConditions({
  wizard,
  update,
}: {
  wizard: WizardState;
  update: UpdateWizard;
}) {
  const [templates, setTemplates] = useConditionTemplates(defaultConditionTemplates);

  const toggleTerm = (id: number) => {
    const next = wizard.selectedTerms.includes(id)
      ? wizard.selectedTerms.filter((t) => t !== id)
      : [...wizard.selectedTerms, id];
    update("selectedTerms", next);
    update("conditionsText", buildConditionsText(templates, next, wizard));
  };

  const selectAll = () => {
    const all = templates.map((t) => t.id);
    update("selectedTerms", all);
    update("conditionsText", buildConditionsText(templates, all, wizard));
  };

  const clearAll = () => {
    update("selectedTerms", []);
    update("conditionsText", buildConditionsText(templates, [], wizard));
  };

  const resetToTemplates = () => {
    update("conditionsText", buildConditionsText(templates, wizard.selectedTerms, wizard));
  };

  const hasContent = wizard.selectedTerms.length > 0;

  return (
    <div>
      <StepHeading
        eyebrow="5. Adım · Şartlar"
        title="Şartlar ve koşullar"
        description="Teklife dahil edilecek şartları seçin ve düzenleyin. Ödeme ve teslim bilgileri otomatik doldurulur."
        icon={ScrollText}
      />

      <div className="mt-7 space-y-5">
        {/* Template selection — compact chips */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <FileText className="size-3.5" />
              </span>
              <h3 className="text-xs font-bold text-foreground">Şablon seçin</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                onClick={selectAll}
                type="button"
              >
                Tümü
              </button>
              <button
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
                onClick={clearAll}
                type="button"
              >
                Temizle
              </button>
              <TemplateManagerModal
                onSave={setTemplates}
                templates={templates}
                type="condition"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((term) => {
              const active = wizard.selectedTerms.includes(term.id);
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                    active
                      ? "border-brand-outline bg-brand-soft ring-2 ring-brand-ring"
                      : "border-border bg-card hover:border-border-strong hover:bg-card-muted",
                  )}
                  key={term.id}
                  onClick={() => toggleTerm(term.id)}
                  title={term.title}
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
                    {term.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editable compiled text */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <Pencil className="size-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Şartlar metni
                {hasContent && (
                  <span className="ml-1.5 rounded-full bg-card-muted px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {wizard.selectedTerms.length} madde
                  </span>
                )}
              </h3>
            </div>
            {hasContent && (
              <button
                className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                onClick={resetToTemplates}
                type="button"
              >
                Şablona sıfırla
              </button>
            )}
          </div>
          {hasContent ? (
            <Textarea
              className="min-h-64 font-mono text-xs leading-6"
              onChange={(event) => update("conditionsText", event.target.value)}
              value={wizard.conditionsText}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong py-10 text-center">
              <ScrollText className="mx-auto size-8 text-subtle" />
              <p className="mt-3 text-xs font-semibold text-muted">Şart seçilmedi</p>
              <p className="mt-1 text-[10px] text-subtle">
                Yukarıdan şablon seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
