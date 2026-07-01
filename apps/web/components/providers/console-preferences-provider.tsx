"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { dictionaries, type Locale } from "@/lib/i18n";

type ConsolePreferences = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof dictionaries)[Locale];
};

const ConsolePreferencesContext = createContext<ConsolePreferences | null>(null);

export function ConsolePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale]);
  return (
    <ConsolePreferencesContext.Provider value={value}>
      {children}
    </ConsolePreferencesContext.Provider>
  );
}

export function useConsolePreferences() {
  const context = useContext(ConsolePreferencesContext);
  if (!context) {
    throw new Error("useConsolePreferences must be used inside ConsolePreferencesProvider");
  }
  return context;
}
