"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function ThemeToggle() {
  const { t } = useConsolePreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-subtle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? t.actions.light : t.actions.dark}
    </button>
  );
}
