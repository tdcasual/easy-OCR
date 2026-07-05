import type { Metadata } from "next";
import "./globals.css";

import { ConsolePreferencesProvider } from "@/components/providers/console-preferences-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "easy-OCR Debug Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = window.localStorage.getItem("theme") || "light";
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ConsolePreferencesProvider>{children}</ConsolePreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
