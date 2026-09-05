import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-primary hover:bg-primary-hover",
        brand: "bg-brand text-brand-fg hover:bg-brand-strong hover:text-brand-fg dark:hover:text-brand-fg",
        secondary: "border border-border-strong bg-card text-brand-soft-fg hover:bg-brand-soft",
        outline: "border border-border bg-card text-muted hover:bg-brand-soft hover:text-brand-soft-fg",
        ghost: "text-muted hover:bg-brand-soft hover:text-brand-soft-fg",
        soft: "bg-brand-soft text-brand-soft-fg hover:bg-brand-soft/80",
        danger: "text-danger hover:bg-danger-soft hover:text-danger-strong",
        "danger-outline": "border border-danger-border text-danger hover:bg-danger-soft",
        link: "text-brand-soft-fg underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 px-2.5 text-[11px] [&_svg]:size-3.5",
        sm: "h-9 px-3 text-xs [&_svg]:size-4",
        md: "h-11 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-5 text-sm [&_svg]:size-[18px]",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
        "icon-lg": "size-10 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...(asChild ? {} : { type })} {...props} />
  );
}
