"use client";

import { ClipboardList, FlaskConical, Plus, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, SearchInput, Select } from "@/components/ui/field";
import type { TestItem } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { cn, includesQuery } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import { lineTotal, type SelectedTest, type UpdateWizard, type WizardState } from "./types";

const allCategories = "Tüm kategoriler";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(tests.map((t) => t.category)));
    return [allCategories, ...unique];
  }, [tests]);

  const available = useMemo(
    () =>
      tests.filter(
        (test) =>
          !wizard.tests.some((selected) => selected.id === test.id) &&
          (category === allCategories || test.category === category) &&
          includesQuery(`${test.code} ${test.name} ${test.category}`, query),
      ),
    [tests, wizard.tests, category, query],
  );

  const availableByCategory = useMemo(() => {
    const groups = new Map<string, TestItem[]>();
    available.forEach((test) => {
      const list = groups.get(test.category) ?? [];
      list.push(test);
      groups.set(test.category, list);
    });
    return Array.from(groups.entries());
  }, [available]);

  const missing = submitted && wizard.tests.length === 0;
  const patchLine = (id: number, patch: Partial<SelectedTest>) =>
    update(
      "tests",
      wizard.tests.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const addCategory = (items: TestItem[]) => items.forEach((test) => addTest(test));
  const setAllQuantity = (quantity: number) =>
    update(
      "tests",
      wizard.tests.map((test) => ({ ...test, quantity: Math.max(1, quantity) })),
    );
  const resetAllUnitPrices = () =>
    update(
      "tests",
      wizard.tests.map((test) => ({ ...test, unitPrice: test.price })),
    );
  const resetAllQuantities = () =>
    update(
      "tests",
      wizard.tests.map((test) => ({ ...test, quantity: wizard.employeeCount })),
    );
  const clearAllTests = () => update("tests", []);

  return (
    <div>
      <StepHeading
        eyebrow="2. Adım · Hizmetler"
        title="Hizmet kalemlerini seçin"
        description="Test kataloğundaki aktif hizmetleri teklife ekleyin."
        icon={ClipboardList}
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Catalog panel */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
              <FlaskConical className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Test kataloğu</p>
              <p className="text-[10px] text-muted">{available.length} aktif test seçilebilir</p>
            </div>
            <Badge tone="neutral">{available.length}</Badge>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <SearchInput
              aria-label="Test ara"
              className="min-w-0 flex-1 [&_input]:h-9 [&_input]:text-xs"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Test adı veya kod ara..."
              value={query}
            />
            <Select
              aria-label="Kategori filtresi"
              className="h-9 w-auto text-xs"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </Select>
          </div>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {availableByCategory.length === 0 ? (
              <div className="py-10 text-center">
                <FlaskConical className="mx-auto size-8 text-subtle" />
                <p className="mt-3 text-xs text-muted">
                  {tests.length === 0
                    ? "Katalogda aktif test bulunmuyor."
                    : query || category !== allCategories
                      ? "Arama veya filtreyle eşleşen test yok."
                      : "Tüm aktif testler eklendi."}
                </p>
              </div>
            ) : (
              availableByCategory.map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-subtle uppercase">
                      <Tag className="size-3" />
                      {cat}
                    </span>
                    <button
                      className="text-[10px] font-semibold text-brand transition-colors hover:text-brand-strong"
                      onClick={() => addCategory(items)}
                      type="button"
                    >
                      Tümünü ekle
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((test) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-divider p-2.5 text-left transition-colors hover:border-brand-outline hover:bg-card-muted"
                        key={test.id}
                        onClick={() => addTest(test)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-foreground">{test.name}</span>
                          <span className="mt-0.5 block text-[10px] text-muted">
                            {test.code} · {money(test.price)}
                          </span>
                        </span>
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Plus className="size-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected services panel */}
        <div className={`rounded-2xl border bg-card p-4 ${missing ? "border-danger-border" : "border-border"}`}>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
              <ClipboardList className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Seçilen hizmetler</p>
              <p className="text-[10px] text-muted">Başlangıç adedi: {wizard.employeeCount} çalışan</p>
            </div>
            <CountPill>{wizard.tests.length} kalem</CountPill>
          </div>

          {wizard.tests.length > 0 ? (
            <>
              {/* Bulk actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-card-muted px-3 py-2">
                <span className="text-[10px] font-semibold text-muted">Toplu adet:</span>
                {[10, 25, 50, 100].map((qty) => (
                  <button
                    className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                    key={qty}
                    onClick={() => setAllQuantity(qty)}
                    type="button"
                  >
                    {qty}
                  </button>
                ))}
                <span className="mx-1 text-subtle">·</span>
                <button
                  className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                  onClick={resetAllQuantities}
                  type="button"
                >
                  Varsayılan adet
                </button>
                <button
                  className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-brand-outline hover:text-brand"
                  onClick={resetAllUnitPrices}
                  type="button"
                >
                  Fiyatları sıfırla
                </button>
                <button
                  className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
                  onClick={clearAllTests}
                  type="button"
                >
                  Tümünü sil
                </button>
              </div>

              <div className="mt-3 divide-y divide-divider">
                <div className="grid grid-cols-[minmax(0,1fr)_64px_84px_72px_32px] gap-2 px-1 pb-1 text-[9px] font-semibold tracking-wide text-subtle uppercase">
                  <span>Hizmet</span>
                  <span>Adet</span>
                  <span>Birim ₺</span>
                  <span>Tutar</span>
                  <span />
                </div>
                {wizard.tests.map((test) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_64px_84px_72px_32px] items-center gap-2 py-2.5"
                    key={test.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{test.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{test.category}</p>
                    </div>
                    <Input
                      aria-label={`${test.name} adedi`}
                      className="h-8 px-2 text-xs"
                      min={1}
                      onChange={(event) =>
                        patchLine(test.id, { quantity: Math.max(1, Number(event.target.value) || 1) })
                      }
                      type="number"
                      value={test.quantity}
                    />
                    <Input
                      aria-label={`${test.name} birim fiyatı`}
                      className="h-8 px-2 text-xs"
                      min={0}
                      onChange={(event) =>
                        patchLine(test.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })
                      }
                      type="number"
                      value={test.unitPrice ?? test.price}
                    />
                    <span className="text-right text-xs font-semibold text-foreground">{money(lineTotal(test))}</span>
                    <Button
                      aria-label={`${test.name} kaldır`}
                      onClick={() => removeTest(test.id)}
                      size="icon-sm"
                      variant="danger"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-divider pt-3 text-xs">
                <span className="font-semibold text-muted">Ara toplam</span>
                <span className="font-bold text-heading">
                  {money(wizard.tests.reduce((sum, test) => sum + lineTotal(test), 0))}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border-strong py-10 text-center">
              <ClipboardList className="mx-auto size-8 text-subtle" />
              <p className="mt-3 text-xs font-semibold text-muted">Henüz hizmet seçilmedi</p>
              <p className="mt-1 text-[10px] text-subtle">
                Soldan bir test ekleyin veya kategorinin &quot;Tümünü ekle&quot; butonunu kullanın.
              </p>
            </div>
          )}
          {missing && <p className="mt-3 text-[11px] text-danger">En az bir hizmet kalemi seçin.</p>}
        </div>
      </div>
    </div>
  );
}
