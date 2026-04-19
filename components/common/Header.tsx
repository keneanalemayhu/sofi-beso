// @/components/common/Header.tsx

"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useCalendar } from "@/hooks/useCalendar";
import { useCalendarMode } from "@/components/context/CalendarModeContext";

const Header = () => {
  const { calendarMode } = useCalendar();
  const { toggleCalendarMode } = useCalendarMode();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleCalendarMode}
      className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-800/70 px-3 text-white hover:bg-slate-800"
    >
      {/* Clock icon */}
      <CalendarDays className="h-4 w-4 text-amber-300" />

      {/* Toggle */}
      <div className="flex items-center rounded-full bg-white/10 p-0.5 text-[10px] font-semibold">
        <span
          className={`px-2 py-0.5 rounded-full transition ${
            calendarMode === "ethiopian"
              ? "bg-amber-400 text-slate-900"
              : "text-white/60"
          }`}
        >
          ET
        </span>

        <span
          className={`px-2 py-0.5 rounded-full transition ${
            calendarMode === "gregorian"
              ? "bg-amber-400 text-slate-900"
              : "text-white/60"
          }`}
        >
          GR
        </span>
      </div>
    </button>
  );
};

export default Header;
