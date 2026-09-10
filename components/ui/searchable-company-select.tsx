"use client";

import { Building2, Check, ChevronDown, MapPin, Search, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { companyLocation, type Company } from "@/lib/demo-data";
import { includesQuery, initials } from "@/lib/utils";

export function SearchableCompanySelect({ companies, value, onChange, includeAll = false, allLabel = "Tüm firmalar", allValue = "Tümü", fallback, invalid = false }: { companies: Company[]; value: number | string | null; onChange: (value: number | string | null) => void; includeAll?: boolean; allLabel?: string; allValue?: string; fallback?: { value: number | string; label: string }; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = companies.find((item) => item.id === Number(value));
  const filtered = useMemo(() => companies.filter((item) => includesQuery(`${item.name} ${item.sector} ${item.city} ${item.district} ${item.contact}`, query)), [companies, query]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", close);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => { document.removeEventListener("mousedown", close); window.clearTimeout(timer); };
  }, [open]);
  const choose = (next: number | string | null) => { onChange(next); setOpen(false); setQuery(""); };
  const fallbackSelected = fallback && value === fallback.value;
  return <div className="relative" ref={ref}>
    <button aria-expanded={open} aria-haspopup="listbox" className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border bg-card-muted px-3 text-left text-sm outline-none transition focus:border-brand-outline focus:ring-4 focus:ring-brand-ring ${invalid ? "border-danger" : open ? "border-brand-outline ring-4 ring-brand-ring" : "border-border"}`} onClick={() => setOpen((current) => !current)} type="button">
      {selected ? <span className="flex min-w-0 items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand-soft-fg">{initials(selected.name)}</span><span className="truncate font-semibold text-foreground">{selected.name}</span></span> : fallbackSelected ? <span className="flex min-w-0 items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card-muted text-[10px] font-bold text-muted">—</span><span className="truncate font-semibold text-foreground">{fallback.label}</span></span> : <span className="flex items-center gap-2 text-muted"><Building2 className="size-4" />{value === allValue ? allLabel : "Firma seçin"}</span>}
      <ChevronDown className={`size-4 shrink-0 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" role="listbox">
      <div className="border-b border-divider p-2.5"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" /><input aria-label="Firma ara" className="h-10 w-full rounded-xl border border-border bg-card-muted pl-9 pr-9 text-sm outline-none focus:border-brand-outline" onChange={(event) => setQuery(event.target.value)} placeholder="Firma, sektör veya şehir ara..." ref={inputRef} type="search" value={query} />{query && <button aria-label="Firma aramasını temizle" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle" onClick={() => setQuery("")} type="button"><X className="size-4" /></button>}</div><p className="mt-1 px-1 text-[10px] text-subtle">{filtered.length} firma</p></div>
      <div className="max-h-72 overflow-y-auto">{includeAll && <button aria-selected={value === allValue} className="flex w-full items-center gap-3 border-b border-divider px-3 py-3 text-left text-sm font-semibold hover:bg-card-muted" onClick={() => choose(allValue)} role="option" type="button"><Building2 className="size-4 text-brand" />{allLabel}{value === allValue && <Check className="ml-auto size-4 text-brand" />}</button>}{fallback && <button aria-selected={fallbackSelected} className="flex w-full items-center gap-3 border-b border-divider px-3 py-3 text-left text-sm font-semibold hover:bg-card-muted" onClick={() => choose(fallback.value)} role="option" type="button"><Building2 className="size-4 text-muted" />{fallback.label}{fallbackSelected && <Check className="ml-auto size-4 text-brand" />}</button>}{filtered.length === 0 ? <p className="py-8 text-center text-xs text-muted">Eşleşen firma bulunamadı.</p> : filtered.map((company) => <button aria-selected={company.id === Number(value)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-card-muted" key={company.id} onClick={() => choose(company.id)} role="option" type="button"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand-soft-fg">{initials(company.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{company.name}</span><span className="mt-0.5 flex items-center gap-2 truncate text-[10px] text-muted"><MapPin className="size-3" />{companyLocation(company) || "—"}<UsersRound className="ml-1 size-3" />{company.employees}</span></span>{company.id === Number(value) && <Check className="size-4 text-brand" />}</button>)}</div>
    </div>}
  </div>;
}
