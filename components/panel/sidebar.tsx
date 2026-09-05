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
          "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r px-2.5 py-4 transition-[width,transform] duration-200 lg:translate-x-0",
          collapsed ? "lg:w-[84px]" : "lg:w-[260px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "border-sidebar-border flex items-center border-b pb-5",
            collapsed ? "justify-center" : "justify-between px-1",
          )}
        >
          <Link aria-label="HanTech ana sayfa" href="/dashboard" onClick={onClose}>
            <BrandMark compact={collapsed} variant="sidebar" />
          </Link>
          {!collapsed && (
            <button
              aria-label="Menüyü kapat"
              className="text-sidebar-muted hover:bg-sidebar-hover rounded-lg p-1.5 lg:hidden"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        {!collapsed && (
          <div className="text-sidebar-muted mt-4 flex items-center gap-2 px-2 text-[10px] font-medium tracking-wide">
            <span className="bg-sidebar-accent size-1.5 rounded-full shadow-[0_0_0_3px_color-mix(in_srgb,var(--sidebar-accent)_15%,transparent)]" />
            <span>Operasyon merkezi</span>
          </div>
        )}
        <button
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className="border-sidebar-border bg-sidebar-active text-sidebar-accent hover:bg-sidebar-hover absolute top-[72px] -right-3 hidden size-8 items-center justify-center rounded-lg border shadow-lg transition hover:scale-105 lg:flex"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
        <nav aria-label="Panel navigasyonu" className={cn("mt-6 flex-1 space-y-7", !collapsed && "overflow-y-auto")}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className={cn("flex items-center gap-2 px-3", collapsed && "sr-only")}>
                <p className="text-sidebar-muted text-[10px] font-bold tracking-[0.18em] uppercase">{group.label}</p>
                <span className="bg-sidebar-border h-px flex-1" />
              </div>
              <div className="mt-2 space-y-1">
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
        <div className="border-sidebar-border border-t pt-3">
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
          className="bg-overlay fixed inset-0 z-30 lg:hidden"
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
        "group relative flex items-center rounded-xl border py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "border-sidebar-accent/25 bg-sidebar-active text-sidebar-active-fg shadow-[inset_3px_0_0_var(--sidebar-accent)]"
          : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-strong border-transparent",
      )}
      href={item.href}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active ? "bg-sidebar-accent/15 text-sidebar-accent" : "bg-sidebar-hover/60 text-sidebar-fg",
        )}
      >
        <Icon className="size-[17px]" />
      </span>
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-sidebar-accent/15 text-sidebar-accent" : "bg-sidebar-hover text-sidebar-fg",
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
          className="bg-sidebar-hover text-sidebar-fg-strong pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden rounded-lg px-2.5 py-2 text-xs font-semibold whitespace-nowrap shadow-lg group-hover:block"
          role="tooltip"
        >
          {item.label}
          {badge !== undefined && badge > 0 && <span className="text-brand-strong ml-1.5">{badge}</span>}
        </span>
      )}
    </Link>
  );
}
