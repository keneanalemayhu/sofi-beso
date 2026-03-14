/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useWaiter.ts

"use client";
import { useEffect, useState } from "react";
import { API_BASE, USE_MOCK } from "@/lib/config";
import { mockWaiters } from "@/lib/mock-data";
import type { Waiter } from "@/types/waiter";

export function useWaiters() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        if (USE_MOCK) {
          setWaiters(mockWaiters.filter((w) => w.is_active));
          return;
        }

        if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");
        const res = await fetch(`${API_BASE}/waiters`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Waiters fetch failed (${res.status})`);
        const data = (await res.json()) as Waiter[];
        setWaiters(data.filter((w) => w.is_active));
      } catch (e: any) {
        setError(e?.message || "Failed to load waiters");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return { waiters, loading, error };
}