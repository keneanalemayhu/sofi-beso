/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useCompletedOrdersByDay.ts

"use client";
import { useCallback, useEffect, useState } from "react";
import { API_BASE, USE_MOCK } from "@/lib/config";
import { mockCompletedOrdersByDay } from "@/lib/mock-history";
import type { OrderWithItems } from "@/types/order";

function toDayString(dateLike: string) {
  const d = new Date(dateLike);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filterOrdersByDay(orders: OrderWithItems[], day: string) {
  return orders.filter((row) => {
    const completedAt = row.order.completed_at;
    if (!completedAt) return false;
    return toDayString(completedAt) === day;
  });
}

function sortOrders(rows: OrderWithItems[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.order.completed_at || 0).getTime() -
      new Date(a.order.completed_at || 0).getTime()
  );
}

export function useCompletedOrdersByDay(day: string) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        const filtered = sortOrders(filterOrdersByDay(mockCompletedOrdersByDay, day));
        setOrders(filtered);
        return;
      }

      if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

      const res = await fetch(`${API_BASE}/orders/completed-by-day?day=${day}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Completed orders fetch failed (${res.status})`);
      }

      const data = (await res.json()) as OrderWithItems[];
      setOrders(sortOrders(Array.isArray(data) ? data : []));
    } catch (err: any) {
      setError(err?.message || "Failed to load completed orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        if (USE_MOCK) {
          const filtered = sortOrders(filterOrdersByDay(mockCompletedOrdersByDay, day));
          if (!cancelled) {
            setOrders(filtered);
            setError(null);
          }
          return;
        }

        if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

        const res = await fetch(`${API_BASE}/orders/completed-by-day?day=${day}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Completed orders fetch failed (${res.status})`);
        }

        const data = (await res.json()) as OrderWithItems[];

        if (!cancelled) {
          setOrders(sortOrders(Array.isArray(data) ? data : []));
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load completed orders");
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [day]);

  return {
    orders,
    loading,
    error,
    refresh,
  };
}