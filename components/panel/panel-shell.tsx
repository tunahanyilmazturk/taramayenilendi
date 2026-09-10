"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomBar from "@/components/panel/bottom-bar";
import Sidebar from "@/components/panel/sidebar";
import Topbar from "@/components/panel/topbar";
import { useSession } from "@/lib/auth";
import { useOffers, useRoles } from "@/lib/data";
import { canAccessPath } from "@/lib/permissions-core";
import { storageKeys, useStoredState } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function PanelShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { session, hydrated } = useSession();
  const [roles] = useRoles();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useStoredState<boolean>(storageKeys.sidebar, true);
  const [density] = useStoredState<"comfortable" | "compact">(storageKeys.density, "comfortable");
  const [motion] = useStoredState<boolean>(storageKeys.motion, true);
  const [offers] = useOffers();
  const badges = useMemo(
    () => ({ "/teklifler": offers.filter((offer) => ["Gönderildi", "Görüşülüyor"].includes(offer.status)).length }),
    [offers],
  );
  const permissions = useMemo(
    () => roles.find((role) => role.name === session?.role)?.permissions ?? [],
    [roles, session?.role],
  );

  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  useEffect(() => {
    if (!hydrated || !session || window.location.pathname === "/dashboard") return;
    const currentPath = window.location.pathname;
    if (!canAccessPath(permissions, currentPath)) router.replace("/dashboard");
  }, [hydrated, permissions, router, session]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.density = density;
    document.documentElement.dataset.motion = motion ? "on" : "off";
  }, [density, hydrated, motion]);

  if (!hydrated || !session) return <ShellSkeleton />;

  const collapsed = !expanded;
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        badges={badges}
        collapsed={collapsed}
        permissions={permissions}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setExpanded(!expanded)}
        open={sidebarOpen}
      />
      <div className={cn("min-h-dvh transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[244px]")}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} session={session} />
        <div className="p-(--panel-padding) pb-24 lg:pb-(--panel-padding)">{children}</div>
      </div>
      <BottomBar onMore={() => setSidebarOpen(true)} />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div aria-busy className="flex min-h-dvh bg-background" role="status">
      <div className="hidden w-[244px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block" />
      <div className="flex-1">
        <div className="h-[76px] border-b border-border bg-card/90" />
        <div className="space-y-4 p-6 sm:p-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-divider" />
          <div className="h-4 w-80 animate-pulse rounded bg-divider" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div className="h-28 animate-pulse rounded-2xl bg-card" key={index} />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}
