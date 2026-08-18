/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useWaiter.ts

"use client";
import { useEffect, useState } from "react";
import { USE_MOCK } from "@/lib/config";
import { apiJson } from "@/lib/api";
import { mockWaiters } from "@/lib/mock-data";
import type { Waiter } from "@/types/waiter";

export function useWaiters(branchSlug?: string) {
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

        const data = await apiJson<Waiter[]>("/waiters", undefined, branchSlug);
        setWaiters(data.filter((w) => w.is_active));
      } catch (e: any) {
        setError(e?.message || "Failed to load waiters");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [branchSlug]);

  return { waiters, loading, error };
}
