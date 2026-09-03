"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/panel/sidebar";
import Topbar from "@/components/panel/topbar";
import { useSession } from "@/lib/auth";
import { useOffers } from "@/lib/data";
import { storageKeys, useStoredState } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function PanelShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { session, hydrated } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useStoredState<boolean>(storageKeys.sidebar, true);
  const [offers] = useOffers();
  const badges = useMemo(
    () => ({ "/teklifler": offers.filter((offer) => ["Gönderildi", "Görüşülüyor"].includes(offer.status)).length }),
    [offers],
  );

  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  if (!hydrated || !session) return <ShellSkeleton />;

  const collapsed = !expanded;
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        badges={badges}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setExpanded(!expanded)}
        open={sidebarOpen}
      />
      <div className={cn("min-h-dvh transition-[padding] duration-200", collapsed ? "lg:pl-[84px]" : "lg:pl-[260px]")}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} session={session} />
        <div className="p-(--panel-padding)">{children}</div>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div aria-busy className="flex min-h-dvh bg-background" role="status">
      <div className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block" />
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
