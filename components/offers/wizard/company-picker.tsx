"use client";

import { Building2, Check, ChevronDown, MapPin, Search, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { companyLocation, type Company } from "@/lib/demo-data";
import { includesQuery, initials } from "@/lib/utils";

type CompanyPickerProps = {
  companies: Company[];
  value: number | null;
  invalid?: boolean;
  onSelect: (company: Company) => void;
};

export default function CompanyPicker({ companies, value, invalid, onSelect }: CompanyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = companies.find((company) => company.id === value) ?? null;

  const filtered = useMemo(
    () =>
      companies.filter((company) =>
        includesQuery(`${company.name} ${company.sector} ${company.city} ${company.district} ${company.contact}`, query),
      ),
    [companies, query],
  );

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.clearTimeout(timer);
    };
  }, [open]);

  const choose = (company: Company) => {
    onSelect(company);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-card-muted px-3 text-sm transition outline-none focus:border-brand-outline focus:ring-4 focus:ring-brand-ring ${
          invalid ? "border-danger" : open ? "border-brand-outline ring-4 ring-brand-ring" : "border-border"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand-soft-fg">
                {initials(selected.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{selected.name}</span>
                <span className="block truncate text-[10px] text-muted">
                  {companyLocation(selected) || selected.sector}
                </span>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-muted">
              <Building2 className="size-4" />
              Firma seçin
            </span>
          )}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-20px_rgba(16,60,58,0.25)]"
          role="listbox"
        >
          {/* Search header */}
          <div className="border-b border-divider p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <input
                aria-label="Firma ara"
                className="h-10 w-full rounded-xl border border-border bg-card-muted pl-9 pr-9 text-sm outline-none focus:border-brand-outline focus:ring-4 focus:ring-brand-ring"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Firma, sektör veya şehir ara..."
                ref={inputRef}
                type="search"
                value={query}
              />
              {query && (
                <button
                  aria-label="Aramayı temizle"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle hover:text-foreground"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-subtle">{filtered.length} firma</p>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">
                {companies.length === 0 ? "Kayıtlı firma yok." : "Aramayla eşleşen firma bulunamadı."}
              </p>
            ) : (
              <ul className="divide-y divide-divider">
                {filtered.map((company) => {
                  const active = company.id === value;
                  return (
                    <li key={company.id}>
                      <button
                        aria-selected={active}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-card-muted"
                        onClick={() => choose(company)}
                        role="option"
                        type="button"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand-soft-fg">
                          {initials(company.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">{company.name}</span>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                company.contract === "Aktif"
                                  ? "bg-brand-soft text-brand-soft-fg"
                                  : company.contract === "Yenileniyor"
                                    ? "bg-warning-soft text-warning"
                                    : "bg-danger-soft text-danger"
                              }`}
                            >
                              {company.contract}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="size-3" />
                              {companyLocation(company) || "—"}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <UsersRound className="size-3" />
                              {company.employees}
                            </span>
                            <span className="truncate">{company.sector}</span>
                          </span>
                        </span>
                        {active && <Check className="size-4 shrink-0 text-brand" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
