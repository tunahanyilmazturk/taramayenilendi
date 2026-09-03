"use client";

import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { TestItem } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import type { SelectedTest, UpdateWizard, WizardState } from "./types";

export default function StepServices({
  wizard,
  tests,
  update,
  addTest,
  removeTest,
  submitted,
}: {
  wizard: WizardState;
  tests: TestItem[];
  update: UpdateWizard;
  addTest: (test: TestItem) => void;
  removeTest: (id: number) => void;
  submitted: boolean;
}) {
  const available = tests.filter((test) => !wizard.tests.some((selected) => selected.id === test.id));
  const missing = submitted && wizard.tests.length === 0;
  const patchLine = (id: number, patch: Partial<SelectedTest>) =>
    update(
      "tests",
      wizard.tests.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  return (
    <div>
      <StepHeading
        eyebrow="2. Adım · Hizmetler"
        title="Hizmet kalemlerini seçin"
        description="Test kataloğundaki aktif hizmetleri teklife ekleyin."
        icon={ClipboardList}
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-foreground">Aktif test kataloğu</p>
          <div className="mt-3 space-y-2">
            {available.map((test) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-divider p-3 text-left transition-colors hover:border-brand-outline hover:bg-card-muted"
                key={test.id}
                onClick={() => addTest(test)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">{test.name}</span>
                  <span className="mt-1 block text-[10px] text-muted">
                    {test.code} · {test.category}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
                  <Plus className="size-3.5" />
                  {money(test.price)}
                </span>
              </button>
            ))}
          </div>
          {available.length === 0 && (
            <p className="py-8 text-center text-xs text-muted">
              {tests.length === 0 ? "Katalogda aktif test bulunmuyor." : "Tüm aktif testler eklendi."}
            </p>
          )}
        </div>
        <div className={cn("rounded-2xl border p-4", missing ? "border-danger-border" : "border-border")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Seçilen hizmetler</p>
              <p className="mt-1 text-[10px] text-muted">Başlangıç adedi: {wizard.employeeCount} çalışan</p>
            </div>
            <CountPill>{wizard.tests.length} kalem</CountPill>
          </div>
          {wizard.tests.length > 0 ? (
            <div className="mt-3 divide-y divide-divider">
              <div className="grid grid-cols-[minmax(0,1fr)_78px_92px_32px] gap-2 px-1 pb-1 text-[9px] font-semibold tracking-wide text-subtle uppercase">
                <span>Hizmet</span>
                <span>Adet</span>
                <span>Birim ₺</span>
                <span />
              </div>
              {wizard.tests.map((test) => (
                <div className="grid grid-cols-[minmax(0,1fr)_78px_92px_32px] items-center gap-2 py-3" key={test.id}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{test.name}</p>
                    <p className="mt-1 text-[10px] text-muted">{test.category}</p>
                  </div>
                  <Input
                    aria-label={`${test.name} adedi`}
                    className="h-8 px-2 text-xs"
                    min={1}
                    onChange={(event) => patchLine(test.id, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                    type="number"
                    value={test.quantity}
                  />
                  <Input
                    aria-label={`${test.name} birim fiyatı`}
                    className="h-8 px-2 text-xs"
                    min={0}
                    onChange={(event) => patchLine(test.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })}
                    type="number"
                    value={test.unitPrice ?? test.price}
                  />
                  <Button aria-label={`${test.name} kaldır`} onClick={() => removeTest(test.id)} size="icon-sm" variant="danger">
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-muted">Soldan bir hizmet seçerek teklife ekleyin.</p>
          )}
          {missing && <p className="mt-3 text-[11px] text-danger">En az bir hizmet kalemi seçin.</p>}
        </div>
      </div>
    </div>
  );
}
