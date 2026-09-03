import PanelShell from "@/components/panel/panel-shell";

export default function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PanelShell>{children}</PanelShell>;
}
