/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useCompletedOrdersByDay.ts

"use client";
import { useCallback, useState } from "react";
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

function filterOrdersByDay(
  orders: OrderWithItems[],
  day: string,
  includeVoided: boolean,
) {
  return orders.filter((row) => {
    const status = row.order.status ?? "pending";

    if (!includeVoided && status === "voided") {
      return false;
    }

    const dateToCheck =
      status === "voided"
        ? row.order.voided_at || row.order.created_at
        : row.order.completed_at || row.order.created_at;

    if (!dateToCheck) return false;

    return toDayString(dateToCheck) === day;
  });
}

function sortOrders(rows: OrderWithItems[]) {
  return [...rows].sort((a, b) => {
    const aDate =
      a.order.completed_at || a.order.voided_at || a.order.created_at || 0;

    const bDate =
      b.order.completed_at || b.order.voided_at || b.order.created_at || 0;

    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

async function fetchOrdersByDay(day: string, includeVoided: boolean) {
  if (USE_MOCK) {
    return sortOrders(
      filterOrdersByDay(mockCompletedOrdersByDay, day, includeVoided),
    );
  }

  if (!API_BASE) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  const params = new URLSearchParams({
    day,
    includeVoided: String(includeVoided),
  });

  const res = await fetch(
    `${API_BASE}/orders/completed-by-day?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Completed orders fetch failed (${res.status})`);
  }

  const data = (await res.json()) as OrderWithItems[];
  return sortOrders(Array.isArray(data) ? data : []);
}

export function useCompletedOrdersByDay(day: string, includeVoided = false) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKey, setCurrentKey] = useState("");

  const requestedKey = `${day}-${includeVoided}`;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rows = await fetchOrdersByDay(day, includeVoided);

      setOrders(rows);
      setCurrentKey(requestedKey);
    } catch (err: any) {
      setError(err?.message || "Failed to load completed orders");
      setOrders([]);
      setCurrentKey(requestedKey);
    } finally {
      setLoading(false);
    }
  }, [day, includeVoided, requestedKey]);

  if (currentKey !== requestedKey && !loading) {
    void loadOrders();
  }

  return {
    orders,
    loading: loading || currentKey !== requestedKey,
    error,
    refresh: loadOrders,
  };
}