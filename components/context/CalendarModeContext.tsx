// @/components/context/CalendarModeContext.tsx

"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CalendarMode = "gregorian" | "ethiopian";

type CalendarModeContextType = {
  calendarMode: CalendarMode;
  setCalendarMode: (mode: CalendarMode) => void;
  toggleCalendarMode: () => void;
};

const CalendarModeContext = createContext<CalendarModeContextType | undefined>(
  undefined
);

function getInitialCalendarMode(): CalendarMode {
  if (typeof window === "undefined") return "ethiopian";

  const saved = window.localStorage.getItem("sofi-beso-calendar-mode");
  return saved === "gregorian" || saved === "ethiopian"
    ? saved
    : "ethiopian";
}

export function CalendarModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [calendarMode, setCalendarModeState] = useState<CalendarMode>(
    getInitialCalendarMode
  );

  useEffect(() => {
    window.localStorage.setItem("sofi-beso-calendar-mode", calendarMode);
  }, [calendarMode]);

  const setCalendarMode = useCallback((mode: CalendarMode) => {
    setCalendarModeState(mode);
  }, []);

  const toggleCalendarMode = useCallback(() => {
    setCalendarModeState((prev) =>
      prev === "ethiopian" ? "gregorian" : "ethiopian"
    );
  }, []);

  const value = useMemo(
    () => ({
      calendarMode,
      setCalendarMode,
      toggleCalendarMode,
    }),
    [calendarMode, setCalendarMode, toggleCalendarMode]
  );

  return (
    <CalendarModeContext.Provider value={value}>
      {children}
    </CalendarModeContext.Provider>
  );
}

export function useCalendarMode() {
  const context = useContext(CalendarModeContext);

  if (!context) {
    throw new Error("useCalendarMode must be used within CalendarModeProvider");
  }

  return context;
}