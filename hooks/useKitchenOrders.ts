
/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useKitchenOrders.ts

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { API_BASE, USE_MOCK } from "@/lib/config";
import { mockKitchenOrders } from "@/lib/mock-kitchen";
import type { OrderStatus, OrderWithItems } from "@/types/order";

type ActiveOrder = OrderWithItems;

export function useKitchenOrders() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  async function fetchActiveOrders() {
    if (USE_MOCK) {
      setOrders(mockKitchenOrders);
      return;
    }

    if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

    // Your API returns orders without items, so we fetch list then hydrate items.
    const listRes = await fetch(`${API_BASE}/orders`, { cache: "no-store" });
    if (!listRes.ok) throw new Error(`Orders fetch failed (${listRes.status})`);
    const list = (await listRes.json()) as { id: string }[];

    // Fetch each order’s items (simple + correct). Optimize later if needed.
    const full = await Promise.all(
      list.map(async (o) => {
        const res = await fetch(`${API_BASE}/orders/${o.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Order ${o.id} fetch failed (${res.status})`);
        return (await res.json()) as ActiveOrder;
      })
    );

    // Sort oldest -> newest
    full.sort((a, b) => new Date(a.order.created_at).getTime() - new Date(b.order.created_at).getTime());
    setOrders(full);
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchActiveOrders();
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // socket live refresh
  useEffect(() => {
    if (USE_MOCK) return;
    if (!API_BASE) return;

    const s = io(API_BASE, { transports: ["websocket"] });
    socketRef.current = s;

    const refresh = () => fetchActiveOrders().catch(() => {});

    s.on("connect", () => {});
    s.on("new_order", refresh);
    s.on("order_status_update", refresh);
    s.on("payment_update", refresh);

    return () => {
      s.off("new_order", refresh);
      s.off("order_status_update", refresh);
      s.off("payment_update", refresh);
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, preparing: 0, ready: 0 };
    for (const o of orders) {
      if (o.order.status === "pending") c.pending++;
    }
    return c;
  }, [orders]);

  async function setStatus(orderId: string, status: OrderStatus) {
    // optimistic UI: remove when completed
    if (status === "completed") {
      setOrders((prev) => prev.filter((x) => x.order.id !== orderId));
    } else {
      setOrders((prev) =>
        prev.map((x) => (x.order.id === orderId ? { ...x, order: { ...x.order, status } } : x))
      );
    }

    if (USE_MOCK) return;

    await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return { orders, loading, error, counts, setStatus, refresh: fetchActiveOrders };
}