"use client";

import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Input, SearchInput, Select } from "@/components/ui/field";
import { money } from "@/lib/format";
import type { TestItem } from "@/lib/demo-data";
import { includesQuery } from "@/lib/utils";

type Line = { testId: number; name: string; category: string; quantity: number; unitPrice: number };

export function ScreeningTestPicker({
  tests,
  lines,
  update,
  defaultQuantity = 1,
}: {
  tests: TestItem[];
  lines: Line[];
  update: (lines: Line[]) => void;
  defaultQuantity?: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tüm kategoriler");
  const selectedIds = new Set(lines.map((line) => line.testId));
  const categories = useMemo(
    () => ["Tüm kategoriler", ...Array.from(new Set(tests.map((test) => test.category)))],
    [tests],
  );
  const available = tests.filter(
    (test) =>
      !selectedIds.has(test.id) &&
      (category === "Tüm kategoriler" || test.category === category) &&
      includesQuery(`${test.code} ${test.name} ${test.category}`, query),
  );
  const add = (test: TestItem) =>
    update([
      ...lines,
      {
        testId: test.id,
        name: test.name,
        category: test.category,
        quantity: Math.max(1, defaultQuantity),
        unitPrice: test.price,
      },
    ]);
  const patch = (id: number, values: Partial<Line>) =>
    update(lines.map((line) => (line.testId === id ? { ...line, ...values } : line)));
  const remove = (id: number) => update(lines.filter((line) => line.testId !== id));
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  return (
    <div className="sm:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-foreground text-sm font-semibold">Test kapsamı</p>
          <p className="text-muted mt-1 text-[11px]">
            Tekliflerdeki gibi testleri soldan seçin; adet ve birim fiyatı sağda taramaya göre düzenleyin.
          </p>
        </div>
        <span className="bg-brand-soft text-brand rounded-full px-2 py-1 text-[10px] font-semibold">
          {lines.length} kalem
        </span>
      </div>
      <div className="grid min-h-[420px] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="border-border bg-card min-w-0 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-bold">Aktif test kataloğu</p>
            <span className="text-muted text-[10px]">{available.length} seçilebilir</span>
          </div>
          <div className="mt-3 flex gap-2">
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
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {available.map((test) => (
              <button
                className="border-divider hover:border-brand-outline hover:bg-card-muted flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition"
                key={test.id}
                onClick={() => add(test)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="text-foreground block truncate text-xs font-semibold">{test.name}</span>
                  <span className="text-muted mt-1 block text-[10px]">
                    {test.code} · {test.category} · {money(test.price)}
                  </span>
                </span>
                <Plus className="text-brand size-4 shrink-0" />
              </button>
            ))}
            {available.length === 0 && tests.length > 0 && !query && category === "Tüm kategoriler" && (
              <p className="text-muted p-5 text-center text-xs">Tüm aktif testler eklendi.</p>
            )}
          </div>
        </div>
        <div className="border-border bg-card min-w-0 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-bold">Seçilen testler</p>
            <ClipboardList className="text-brand size-4" />
          </div>
          {lines.length ? (
            <div className="mt-3 max-h-[420px] overflow-y-auto pr-1">
              <div className="border-divider text-subtle grid grid-cols-[minmax(0,1fr)_64px_84px_28px] gap-2 border-b px-1 pb-2 text-[9px] font-bold tracking-wide uppercase">
                <span>Test</span>
                <span>Adet</span>
                <span>Birim ₺</span>
                <span />
              </div>
              {lines.map((line) => (
                <div
                  className="border-divider grid grid-cols-[minmax(0,1fr)_64px_84px_28px] items-center gap-2 border-b py-2.5"
                  key={line.testId}
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-xs font-semibold">{line.name}</p>
                    <p className="text-muted mt-1 text-[10px]">{line.category}</p>
                  </div>
                  <Input
                    aria-label={`${line.name} adedi`}
                    className="h-8 px-2 text-xs"
                    min={1}
                    onChange={(event) => patch(line.testId, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                    type="number"
                    value={line.quantity}
                  />
                  <Input
                    aria-label={`${line.name} birim fiyatı`}
                    className="h-8 px-2 text-xs"
                    min={0}
                    onChange={(event) =>
                      patch(line.testId, { unitPrice: Math.max(0, Number(event.target.value) || 0) })
                    }
                    type="number"
                    value={line.unitPrice}
                  />
                  <button
                    aria-label={`${line.name} kaldır`}
                    className="text-danger hover:text-danger-strong"
                    onClick={() => remove(line.testId)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted flex min-h-28 items-center justify-center text-center text-xs">
              Soldaki katalogdan test seçerek kapsamı oluşturun.
            </div>
          )}
          <div className="border-divider mt-3 flex items-center justify-between border-t pt-3 text-xs">
            <span className="text-muted font-semibold">Genel toplam</span>
            <span className="text-foreground font-bold">{money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
