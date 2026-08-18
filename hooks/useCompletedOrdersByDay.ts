/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useCompletedOrdersByDay.ts

"use client";
import { useCallback, useEffect, useState } from "react";
import { USE_MOCK } from "@/lib/config";
import { apiJson } from "@/lib/api";
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

async function fetchOrdersByDay(
  day: string,
  includeVoided: boolean,
  branchSlug?: string,
) {
  if (USE_MOCK) {
    return sortOrders(
      filterOrdersByDay(mockCompletedOrdersByDay, day, includeVoided),
    );
  }

  const params = new URLSearchParams({
    day,
    includeVoided: String(includeVoided),
  });

  const data = await apiJson<OrderWithItems[]>(
    `/orders/completed-by-day?${params.toString()}`,
    undefined,
    branchSlug,
  );
  return sortOrders(Array.isArray(data) ? data : []);
}

export function useCompletedOrdersByDay(
  day: string,
  includeVoided = false,
  branchSlug?: string,
) {
  const [state, setState] = useState<{
    key: string;
    orders: OrderWithItems[];
    error: string | null;
  }>({ key: "", orders: [], error: null });

  // Bumped by refresh() so an identical day/branch still refetches.
  const [reloadToken, setReloadToken] = useState(0);

  const requestedKey = `${day}|${includeVoided}|${branchSlug ?? ""}|${reloadToken}`;

  // Loading is derived, never set — so nothing here fires setState
  // synchronously inside the effect body.
  const loading = state.key !== requestedKey;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await fetchOrdersByDay(day, includeVoided, branchSlug);
        if (!cancelled) setState({ key: requestedKey, orders: rows, error: null });
      } catch (err: any) {
        if (!cancelled) {
          setState({
            key: requestedKey,
            orders: [],
            error: err?.message || "ትእዛዞችን መጫን አልተቻለም።",
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [day, includeVoided, branchSlug, requestedKey]);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  return {
    orders: state.orders,
    loading,
    error: state.error,
    refresh,
  };
}