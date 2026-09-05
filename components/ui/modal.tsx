"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { IconBadge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  className?: string;
};

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };

/**
 * Accessible dialog: closes on Escape / backdrop click, locks body scroll, and slides up from
 * the bottom on mobile. Content scrolls inside while header and footer stay fixed.
 */
export function Modal({ open, onClose, title, eyebrow, description, icon, footer, size = "md", children, className }: ModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl",
          sizes[size],
          className,
        )}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-divider px-6 py-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <IconBadge icon={icon} size="lg" />}
            <div className="min-w-0">
              {eyebrow && <p className="text-[10px] font-bold tracking-[0.14em] text-brand uppercase">{eyebrow}</p>}
              <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-heading" id={titleId}>
                {title}
              </h2>
              {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
            </div>
          </div>
          <button
            aria-label="Kapat"
            className="-mr-2 -mt-1 rounded-xl p-2 text-muted transition hover:bg-brand-soft hover:text-brand-soft-fg"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-divider bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

export function ConfirmDialog({ request, onClose }: { request: { title: string; description: string; confirmLabel?: string; onConfirm: () => void } | null; onClose: () => void }) {
  if (!request) return null;
  return (
    <Modal
      description={request.description}
      footer={
        <>
          <Button onClick={onClose} size="sm" variant="outline">Vazgeç</Button>
          <Button onClick={() => { request.onConfirm(); onClose(); }} size="sm" variant="danger"><Trash2 /> {request.confirmLabel ?? "Sil"}</Button>
        </>
      }
      icon={AlertTriangle}
      onClose={onClose}
      open
      size="sm"
      title={request.title}
    >
      <div className="rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">
        Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
      </div>
    </Modal>
  );
}

/** Inline alert used for validation summaries and notices. */
export function Alert({
  tone = "brand",
  icon: Icon,
  children,
  className,
}: {
  tone?: "brand" | "danger" | "warning";
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    brand: "border-border-strong bg-brand-soft text-brand-soft-fg",
    danger: "border-danger-border bg-danger-soft text-danger",
    warning: "border-warning/30 bg-warning-soft text-warning",
  };
  return (
    <p
      className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium", tones[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
