"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = hydrated && resolvedTheme === "dark";
  return (
    <Button
      aria-label={isDark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      className={cn("text-muted hover:border-brand-outline hover:text-brand", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size="icon-lg"
      variant="outline"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
