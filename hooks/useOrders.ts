/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useOrders.ts

"use client";
import { useEffect, useMemo, useState } from "react";
import { API_BASE, USE_MOCK } from "@/lib/config";
import type { OrderWithItems } from "@/types/order";
import { mockOrders } from "@/lib/mock-data";

type ActiveOrder = OrderWithItems;

const isToday = (value?: string | null) => {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const filterTodayOrders = (rows: ActiveOrder[]) => {
  return rows.filter((row) => isToday(row.order.created_at));
};

export function useOrders() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        setOrders(filterTodayOrders(mockOrders));
        return;
      }

      if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

      const res = await fetch(`${API_BASE}/orders/with-items`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(
          (data as any)?.error || `Orders fetch failed (${res.status})`,
        );
      }

      setOrders(filterTodayOrders(Array.isArray(data) ? data : []));
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadInitialOrders = async () => {
      try {
        setError(null);

        if (USE_MOCK) {
          if (!cancelled) setOrders(filterTodayOrders(mockOrders));
          return;
        }

        if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

        const res = await fetch(`${API_BASE}/orders/with-items`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(
            (data as any)?.error || `Orders fetch failed (${res.status})`,
          );
        }

        if (!cancelled) {
          setOrders(filterTodayOrders(Array.isArray(data) ? data : []));
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load orders");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalsByWaiter = useMemo(() => {
    const map = new Map<
      string,
      {
        waiterId: string;
        total: number;
        count: number;
        orders: ActiveOrder[];
      }
    >();

    for (const row of orders) {
      const waiterId = row.order.waiter_id || "unknown";

      if (!map.has(waiterId)) {
        map.set(waiterId, {
          waiterId,
          total: 0,
          count: 0,
          orders: [],
        });
      }

      const current = map.get(waiterId)!;
      current.total += Number(row.order.total_amount || 0);
      current.count += 1;
      current.orders.push(row);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [orders]);

  const grandTotal = useMemo(
    () => totalsByWaiter.reduce((sum, row) => sum + row.total, 0),
    [totalsByWaiter],
  );

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    totalsByWaiter,
    grandTotal,
  };
}