import { ChevronDown, Search } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const controlClass =
  "w-full rounded-xl border border-border bg-card-muted text-sm text-foreground transition outline-none placeholder:text-subtle focus:border-brand-outline focus:ring-4 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-divider disabled:text-muted aria-invalid:border-danger aria-invalid:focus:ring-danger-soft";

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode | boolean;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error wrapper. Pass `error={true}` to highlight without a message. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <label className={cn("block text-sm font-medium text-foreground", className)}>
      {label && (
        <span className="mb-2 block">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </span>
      )}
      {children}
      {typeof error === "string" || (error && typeof error !== "boolean") ? (
        <span className="mt-1.5 block text-[11px] font-normal text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[11px] font-normal text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  icon: Icon,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; invalid?: boolean }) {
  const input = (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClass, "h-11 px-3", Icon && "pl-10", className)}
      {...props}
    />
  );
  if (!Icon) return input;
  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      {input}
    </span>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(controlClass, "min-h-28 resize-y p-3 leading-6", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <span className="relative block">
      <select
        aria-invalid={invalid || undefined}
        className={cn(controlClass, "h-11 appearance-none bg-card px-3 pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
    </span>
  );
}

/** Compact select used in filter bars. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className={cn(controlClass, "h-10 w-auto appearance-none bg-card pr-8 pl-3 text-xs font-medium text-muted")}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-subtle" />
    </label>
  );
}

export function SearchInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { className?: string }) {
  return (
    <span className={cn("relative block", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input className={cn(controlClass, "h-11 pr-3 pl-9")} type="search" {...props} />
    </span>
  );
}

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("size-4 shrink-0 rounded accent-brand", className)} type="checkbox" {...props} />;
}
