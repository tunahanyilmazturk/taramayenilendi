"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Theme resolves in the browser; mount state avoids a hydration icon mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      aria-label={isDark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dbe9e4] bg-white text-[#52776d] transition-colors hover:border-[#8ed3b7] hover:text-[#208267] dark:border-[#2b5a50] dark:bg-[#12332f] dark:text-[#a7d7c7] dark:hover:border-[#5bc49f] dark:hover:text-[#bdf4df]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
