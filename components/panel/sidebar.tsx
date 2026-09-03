"use client";

import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import { isActivePath, navGroups, settingsNav, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  open: boolean;
  collapsed: boolean;
  badges?: Partial<Record<string, number>>;
  onClose: () => void;
  onToggleCollapse: () => void;
};

export default function Sidebar({ open, collapsed, badges = {}, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 transition-[width,transform] duration-200 lg:translate-x-0",
          collapsed ? "lg:w-[84px]" : "lg:w-[260px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          <Link aria-label="HanTech ana sayfa" href="/dashboard" onClick={onClose}>
            <BrandMark compact={collapsed} variant="sidebar" />
          </Link>
          {!collapsed && (
            <button
              aria-label="Menüyü kapat"
              className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover lg:hidden"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <button
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className="absolute top-[72px] -right-3 hidden size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-hover text-brand-strong shadow-sm transition hover:bg-sidebar-active lg:flex"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>
        <nav aria-label="Panel navigasyonu" className={cn("mt-9 flex-1 space-y-6", !collapsed && "overflow-y-auto")}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "px-3 text-[10px] font-bold tracking-[0.18em] text-sidebar-muted uppercase",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </p>
              <div className="mt-3 space-y-1">
                {group.links.map((item) => (
                  <NavLink
                    active={isActivePath(pathname, item.href)}
                    badge={badges[item.href]}
                    collapsed={collapsed}
                    item={item}
                    key={item.href}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-4">
          <NavLink
            active={isActivePath(pathname, settingsNav.href)}
            collapsed={collapsed}
            item={settingsNav}
            onClick={onClose}
          />
        </div>
      </aside>
      {open && (
        <button
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
    </>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-xl py-3 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-sidebar-active text-sidebar-active-fg shadow-[inset_3px_0_0_var(--sidebar-accent)]"
          : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-strong",
      )}
      href={item.href}
      onClick={onClick}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-brand-strong/20 text-sidebar-active-fg" : "bg-sidebar-hover text-sidebar-fg",
          )}
        >
          {badge}
        </span>
      )}
      {!collapsed && (
        <ChevronRight
          className={cn(
            "size-3.5 transition",
            active ? "opacity-70" : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60",
          )}
        />
      )}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden whitespace-nowrap rounded-lg bg-sidebar-hover px-2.5 py-2 text-xs font-semibold text-sidebar-fg-strong shadow-lg group-hover:block"
          role="tooltip"
        >
          {item.label}
          {badge !== undefined && badge > 0 && <span className="ml-1.5 text-brand-strong">{badge}</span>}
        </span>
      )}
    </Link>
  );
}
