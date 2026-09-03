"use client";

/* Sidebar width is restored from localStorage on the client. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Sidebar from "@/components/panel/sidebar";
import Topbar from "@/components/panel/topbar";

export default function PanelShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("hantech-sidebar");
    if (stored === "false") setSidebarCollapsed(true);
  }, []);
  const toggleSidebar = () =>
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("hantech-sidebar", String(!next));
      return next;
    });
  return (
    <div className="min-h-screen bg-white dark:bg-[#071b1a]">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleSidebar}
      />
      <div
        className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"}`}
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
