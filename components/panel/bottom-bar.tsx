"use client";

import { LayoutDashboard, Building2, ScanLine, FileText, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Primary destinations shown as fixed bottom bar on mobile. */
const primaryItems: NavItem[] = [
  { href: "/dashboard", label: "Genel", description: "", icon: LayoutDashboard },
  { href: "/firmalar", label: "Firmalar", description: "", icon: Building2 },
  { href: "/taramalar", label: "Taramalar", description: "", icon: ScanLine },
  { href: "/teklifler", label: "Teklifler", description: "", icon: FileText },
];

type BottomBarProps = {
  onMore: () => void;
};

export default function BottomBar({ onMore }: BottomBarProps) {
  const pathname = usePathname();
  const moreActive = !primaryItems.some((item) => isActivePath(pathname, item.href));
  return (
    <nav
      aria-label="Mobil navigasyon"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <li className="flex-1" key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand" : "text-muted hover:text-foreground",
                )}
                href={item.href}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-brand-soft" : "bg-transparent",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            aria-current={moreActive ? "page" : undefined}
            aria-label="Tüm menü"
            className={cn(
              "flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
              moreActive ? "text-brand" : "text-muted hover:text-foreground",
            )}
            onClick={onMore}
            type="button"
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                moreActive ? "bg-brand-soft" : "bg-transparent",
              )}
            >
              <Menu className="size-[18px]" />
            </span>
            Menü
          </button>
        </li>
      </ul>
    </nav>
  );
}
