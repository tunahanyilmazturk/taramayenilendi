"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
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
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      )).filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousActive = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const firstField = panelRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
      );
      firstField?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previous;
      if (previousActive?.isConnected) previousActive.focus();
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
        aria-describedby={description ? descriptionId : undefined}
        aria-modal="true"
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl",
          sizes[size],
          className,
        )}
        ref={panelRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:gap-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <IconBadge icon={icon} size="lg" />}
            <div className="min-w-0">
              {eyebrow && <p className="text-[10px] font-bold tracking-[0.14em] text-brand uppercase">{eyebrow}</p>}
              <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-heading" id={titleId}>
                {title}
              </h2>
              {description && <p className="mt-1 text-xs leading-5 text-muted" id={descriptionId}>{description}</p>}
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
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-divider bg-card px-4 py-4 [&>*]:w-full sm:flex-row sm:items-center sm:justify-end sm:px-7 sm:[&>*]:w-auto">
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
