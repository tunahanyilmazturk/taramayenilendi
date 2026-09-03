"use client";

import { Check, LayoutPanelTop, Monitor, Moon, Palette, Sun, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SettingsCard from "./settings-card";

type Density = "comfortable" | "compact";

export default function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [density, setDensity] = useState<Density>("comfortable");
  const [animations, setAnimations] = useState(true);
  const [expandedSidebar, setExpandedSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Theme and saved appearance preferences resolve in the browser after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedDensity = window.localStorage.getItem("hantech-density");
    const storedAnimations = window.localStorage.getItem("hantech-animations");
    const storedSidebar = window.localStorage.getItem("hantech-sidebar");
    if (storedDensity === "compact") setDensity("compact");
    if (storedAnimations === "false") setAnimations(false);
    if (storedSidebar === "false") setExpandedSidebar(false);
  }, []);

  const chooseDensity = (value: Density) => {
    setDensity(value);
    window.localStorage.setItem("hantech-density", value);
  };
  const chooseAnimations = (value: boolean) => {
    setAnimations(value);
    window.localStorage.setItem("hantech-animations", String(value));
  };
  const chooseSidebar = (value: boolean) => {
    setExpandedSidebar(value);
    window.localStorage.setItem("hantech-sidebar", String(value));
  };

  return (
    <SettingsCard
      icon={Palette}
      title="Görünüm tercihleri"
      description="HanTech panelinin görünümünü ve kullanım deneyimini kişiselleştirin."
    >
      <div className="mt-6">
        <SectionTitle title="Renk teması" description="Çalışma ortamınıza uygun görünümü seçin." />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ThemeChoice
            active={mounted && resolvedTheme === "light"}
            title="Aydınlık"
            description="Beyaz ve ferah"
            icon={Sun}
            onClick={() => setTheme("light")}
          />
          <ThemeChoice
            active={mounted && resolvedTheme === "dark"}
            title="Karanlık"
            description="Düşük ışık için"
            icon={Moon}
            onClick={() => setTheme("dark")}
          />
          <ThemeChoice
            active={mounted && resolvedTheme !== "light" && resolvedTheme !== "dark"}
            title="Sistem"
            description="Cihaz ayarını kullan"
            icon={Monitor}
            onClick={() => setTheme("system")}
          />
        </div>
      </div>
      <div className="mt-8 border-t border-divider pt-7">
        <SectionTitle title="Arayüz yoğunluğu" description="Liste ve kartların ekrandaki boşluklarını belirleyin." />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DensityChoice
            active={density === "comfortable"}
            title="Rahat"
            description="Daha geniş boşluklar ve kolay okuma"
            onClick={() => chooseDensity("comfortable")}
          />
          <DensityChoice
            active={density === "compact"}
            title="Kompakt"
            description="Daha fazla içeriği tek ekranda görün"
            onClick={() => chooseDensity("compact")}
          />
        </div>
      </div>
      <div className="mt-8 border-t border-divider pt-2">
        <PreferenceRow
          icon={Zap}
          title="Geçiş animasyonları"
          description="Sayfa ve bileşen geçişlerinde yumuşak animasyonları kullan."
          checked={animations}
          onChange={chooseAnimations}
        />
        <PreferenceRow
          icon={LayoutPanelTop}
          title="Genişletilmiş sidebar"
          description="Masaüstünde menü başlıklarını ve çalışma alanını açık göster."
          checked={expandedSidebar}
          onChange={chooseSidebar}
        />
      </div>
    </SettingsCard>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}
function ThemeChoice({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: typeof Sun;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative rounded-2xl border p-4 text-left transition ${
        active
          ? "border-brand-outline bg-brand-soft ring-2 ring-brand-soft/60"
          : "border-border hover:border-border-strong"
      }`}
      onClick={onClick}
      type="button"
    >
      {active && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-brand text-brand-fg">
          <Check className="size-3" />
        </span>
      )}
      <div className="flex h-16 items-center justify-center rounded-xl border border-border bg-card text-brand">
        <Icon className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </button>
  );
}
function DensityChoice({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-brand-outline bg-brand-soft ring-2 ring-brand-soft/60"
          : "border-border hover:border-border-strong"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex gap-1.5">
        <span className={`h-8 flex-1 rounded-md bg-brand-soft ${active ? "opacity-100" : "opacity-60"}`} />
        <span className="h-8 w-1/4 rounded-md bg-brand-soft/50" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </button>
  );
}
function PreferenceRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 text-brand" />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <button
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "açık" : "kapalı"}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-border-strong"
        }`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
