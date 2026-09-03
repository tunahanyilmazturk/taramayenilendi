"use client";

import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type SectorManagerProps = {
  open: boolean;
  sectors: string[];
  onAdd: (sector: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (sector: string) => void;
  onClose: () => void;
};

const sameSector = (a: string, b: string) => a.toLocaleLowerCase("tr-TR") === b.toLocaleLowerCase("tr-TR");

export function SectorManager({ open, sectors, onAdd, onRename, onDelete, onClose }: SectorManagerProps) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const value = draft.trim();
  const duplicate = Boolean(value) && sectors.some((sector) => sector !== editing && sameSector(sector, value));

  const reset = () => {
    setDraft("");
    setEditing(null);
  };
  const save = () => {
    if (!value || duplicate) return;
    if (editing) {
      if (editing !== value) onRename(editing, value);
    } else onAdd(value);
    reset();
  };
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      description="Firma kayıtlarında kullanılacak sektörleri yönetin."
      eyebrow="Tanımlamalar"
      footer={
        <Button onClick={close} variant="ghost">
          Tamam
        </Button>
      }
      icon={Tag}
      onClose={close}
      open={open}
      title="Sektör yönetimi"
    >
      <div className="flex gap-2">
        <Input
          aria-label="Sektör adı"
          className="min-w-0 flex-1"
          invalid={duplicate}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
          placeholder={editing ? "Sektör adını güncelle" : "Yeni sektör adı"}
          value={draft}
        />
        <Button disabled={!value || duplicate} onClick={save}>
          {editing ? <Pencil /> : <Plus />}
          {editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <Button onClick={reset} variant="ghost">
            İptal
          </Button>
        )}
      </div>
      {duplicate && <p className="mt-2 text-[11px] text-danger">Bu sektör zaten tanımlı.</p>}
      <div className="mt-5 divide-y divide-divider rounded-2xl border border-border">
        {sectors.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted">Henüz sektör tanımlanmadı.</p>}
        {sectors.map((sector) => (
          <div className="flex items-center justify-between gap-3 px-4 py-3" key={sector}>
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="size-2 rounded-full bg-brand" />
              {sector}
            </span>
            <div className="flex gap-1">
              <Button
                aria-label={`${sector} düzenle`}
                onClick={() => {
                  setEditing(sector);
                  setDraft(sector);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Pencil />
              </Button>
              <Button
                aria-label={`${sector} sil`}
                onClick={() => {
                  if (editing === sector) reset();
                  onDelete(sector);
                }}
                size="icon-sm"
                variant="danger"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
