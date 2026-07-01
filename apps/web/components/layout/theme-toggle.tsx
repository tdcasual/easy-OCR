"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { t } = useConsolePreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-subtle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? <Sun size={15} /> : <Moon size={15} />
      ) : (
        <Moon size={15} />
      )}
      {mounted ? (isDark ? t.actions.light : t.actions.dark) : t.actions.dark}
    </button>
  );
}
