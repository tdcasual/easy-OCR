"use client";

import { Languages } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useConsolePreferences();
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-subtle"
      onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
    >
      <Languages size={15} />
      {t.actions.language}: {locale === "zh-CN" ? "中文" : "EN"}
    </button>
  );
}
