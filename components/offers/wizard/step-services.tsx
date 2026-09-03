import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SelectedTest, TestItem, WizardState } from "./types";
import { fieldClass, money } from "./types";
function Heading() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
        <ClipboardList className="size-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">2. ADIM · HİZMETLER</p>
        <h2 className="mt-1 text-lg font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Hizmet kalemlerini seçin</h2>
        <p className="mt-1 text-xs text-[#81958f]">Test kataloğundaki aktif hizmetleri teklife ekleyin.</p>
      </div>
    </div>
  );
}
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
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  addTest: (test: TestItem) => void;
  removeTest: (id: number) => void;
  submitted: boolean;
}) {
  const availableTests = tests.filter((test) => !wizard.tests.some((selected) => selected.id === test.id));
  const companyEmployees = Math.max(1, wizard.employeeCount);
  const initializedIds = useRef<number[]>([]);
  useEffect(() => {
    const newTests = wizard.tests.filter((test) => !initializedIds.current.includes(test.id));
    if (newTests.length) {
      initializedIds.current = [...initializedIds.current, ...newTests.map((test) => test.id)];
      update(
        "tests",
        wizard.tests.map((test) =>
          newTests.some((item) => item.id === test.id) ? { ...test, quantity: companyEmployees } : test,
        ),
      );
    }
  }, [wizard.tests, companyEmployees, update]);
  return (
    <div>
      <Heading />
      <div className="mt-5 grid h-[620px] min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-h-0 overflow-y-auto rounded-2xl border border-[#e5eee9] p-4 dark:border-[#1d4941]">
          <p className="text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">Aktif test kataloğu</p>
          <div className="mt-3 space-y-2">
            {availableTests.map((test) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#edf3f0] p-3 text-left hover:border-[#8ed3b7] hover:bg-[#f5f8f6] dark:border-[#1d4941] dark:hover:bg-[#174238]"
                key={test.id}
                onClick={() => addTest(test)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">
                    {test.name}
                  </span>
                  <span className="mt-1 block text-[10px] text-[#81958f]">
                    {test.code} · {test.category}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#278b70]">
                  <Plus className="size-3.5" />
                  {money(test.price)}
                </span>
              </button>
            ))}
          </div>
          {availableTests.length === 0 && (
            <p className="py-8 text-center text-xs text-[#81958f]">Tüm aktif testler eklendi.</p>
          )}
        </div>
        <div
          className={`min-h-0 overflow-y-auto rounded-2xl border p-4 ${submitted && wizard.tests.length === 0 ? "border-[#c47b69]" : "border-[#e5eee9] dark:border-[#1d4941]"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">Seçilen hizmetler</p>
              <p className="mt-1 text-[10px] text-[#81958f]">Başlangıç adedi: {companyEmployees} çalışan</p>
            </div>
            <span className="rounded-full bg-[#e5f5ec] px-2 py-1 text-[10px] font-bold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
              {wizard.tests.length} kalem
            </span>
          </div>
          {wizard.tests.length ? (
            <div className="mt-3 divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
              <div className="grid grid-cols-[minmax(0,1fr)_78px_92px_32px] gap-2 px-1 pb-1 text-[9px] font-semibold tracking-wide text-[#91a49f] uppercase">
                <span>Hizmet</span>
                <span>Adet</span>
                <span>Birim ₺</span>
                <span />
              </div>
              {wizard.tests.map((test: SelectedTest) => (
                <div className="grid grid-cols-[minmax(0,1fr)_78px_92px_32px] items-center gap-2 py-3" key={test.id}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{test.name}</p>
                    <p className="mt-1 text-[10px] text-[#81958f]">{test.category}</p>
                  </div>
                  <input
                    aria-label={`${test.name} adedi`}
                    className={`${fieldClass} mt-0 h-8 w-full px-2`}
                    min="1"
                    onChange={(event) =>
                      update(
                        "tests",
                        wizard.tests.map((item) =>
                          item.id === test.id
                            ? { ...item, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : item,
                        ),
                      )
                    }
                    type="number"
                    value={test.quantity}
                  />
                  <input
                    aria-label={`${test.name} birim fiyatı`}
                    className={`${fieldClass} mt-0 h-8 w-full px-2`}
                    min="0"
                    onChange={(event) =>
                      update(
                        "tests",
                        wizard.tests.map((item) =>
                          item.id === test.id
                            ? { ...item, unitPrice: Math.max(0, Number(event.target.value) || 0) }
                            : item,
                        ),
                      )
                    }
                    type="number"
                    value={test.unitPrice ?? test.price}
                  />
                  <button
                    aria-label={`${test.name} kaldır`}
                    className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
                    onClick={() => removeTest(test.id)}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-[#81958f]">Soldan bir hizmet seçerek teklife ekleyin.</p>
          )}
          {submitted && wizard.tests.length === 0 && (
            <p className="mt-3 text-[10px] text-[#b06e5d]">En az bir hizmet kalemi seçin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
