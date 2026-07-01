"use client";

import { Bell, Code2 } from "lucide-react";

import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useConsolePreferences();
  const links = [
    t.nav.dashboard,
    t.nav.jobs,
    t.nav.createJob,
    t.nav.issues,
    t.nav.exports,
    t.nav.models,
    t.nav.settings,
  ];
  return (
    <div className="grid min-h-screen grid-rows-[64px_1fr_34px] bg-background text-foreground">
      <header className="flex items-center gap-7 border-b border-border bg-surface px-7">
        <div className="flex items-center gap-2.5 font-bold">
          <span className="h-6 w-6 rounded-lg bg-brand" />
          <span>{t.appName}</span>
        </div>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link}
              className={`border-b-2 px-0 py-5 text-sm no-underline ${link === t.nav.jobs ? "border-brand text-brand" : "border-transparent text-foreground"}`}
              href="#"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3 text-sm text-muted">
            <Code2 size={14} />
            {t.actions.debugMode}
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-success/30 bg-success-soft px-3 text-sm text-success">
            {t.actions.readyModels}
          </span>
          <ThemeToggle />
          <LanguageToggle />
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.actions.notifications}>
            <Bell size={16} />
          </button>
        </div>
      </header>
      {children}
      <footer className="flex items-center gap-7 border-t border-border bg-surface px-7 text-xs text-muted">
        <span>Schema Version: 1.0.0</span>
        <span>Document Version: 1</span>
        <span>Renderer: markdown v0.3.0, html v0.2.1</span>
        <span className="ml-auto flex gap-5">
          <span>Storage: Local</span>
          <span>API: Connected</span>
        </span>
      </footer>
    </div>
  );
}
