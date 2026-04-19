// @/app/providers.tsx

"use client";
import { CalendarModeProvider } from "@/components/context/CalendarModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CalendarModeProvider>{children}</CalendarModeProvider>;
}
