// @/app/providers.tsx

"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { CalendarModeProvider } from "@/components/context/CalendarModeContext";
import { type ThemeProviderProps } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="jireh-theme"
      themes={["light", "dark", "system"]}
      value={{
        light: "light",
        dark: "dark",
        system: "system",
      }}
      {...props}
    >
      <CalendarModeProvider>
        {children}
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
        />
      </CalendarModeProvider>
    </NextThemesProvider>
  );
}
