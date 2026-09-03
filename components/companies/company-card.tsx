"use client";

import { Edit3, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge, contractTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/table";
import { companyLocation, type Company } from "@/lib/demo-data";
import { initials } from "@/lib/utils";

export type CompanyActions = {
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
};

/** Row actions shared by the table, the card grid and the mobile list. */
export function CompanyRowActions({ company, onEdit, onDelete }: { company: Company } & CompanyActions) {
  return (
    <div className="flex justify-end gap-1">
      <Button aria-label={`${company.name} detaylarını gör`} asChild size="icon-sm" variant="ghost">
        <Link href={`/firmalar/${company.id}`}>
          <Eye />
        </Link>
      </Button>
      <Button aria-label={`${company.name} düzenle`} onClick={() => onEdit(company)} size="icon-sm" variant="ghost">
        <Edit3 />
      </Button>
      <Button aria-label={`${company.name} sil`} onClick={() => onDelete(company)} size="icon-sm" variant="danger">
        <Trash2 />
      </Button>
    </div>
  );
}

export function CompanyCard({ company, onEdit, onDelete }: { company: Company } & CompanyActions) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <Link className="flex items-center gap-3 rounded-xl" href={`/firmalar/${company.id}`}>
        <Avatar text={initials(company.name)} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{company.name}</span>
          <span className="mt-1 block truncate text-xs text-muted">
            {company.sector}
            {companyLocation(company) && ` · ${companyLocation(company)}`}
          </span>
        </span>
      </Link>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <span className="rounded-xl bg-card-muted p-3 text-muted">
          Çalışan
          <strong className="mt-1 block text-sm text-foreground">{company.employees}</strong>
        </span>
        <span className="rounded-xl bg-card-muted p-3 text-muted">
          Son tarama
          <strong className="mt-1 block text-sm text-foreground">{company.lastScreening}</strong>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
          {company.contractEnd && <span className="text-[10px] text-subtle">{company.contractEnd}</span>}
        </div>
        <CompanyRowActions company={company} onDelete={onDelete} onEdit={onEdit} />
      </div>
    </div>
  );
}
