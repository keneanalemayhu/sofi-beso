
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

  async function fetchOrders() {
    if (USE_MOCK) {
      setOrders(mockKitchenOrders);
      return;
    }

    if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");

    // Your API returns orders without items, so we fetch list then hydrate items.
    const res = await fetch(`${API_BASE}/orders/with-items`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Orders fetch failed (${res.status})`);

    const full = (await res.json()) as ActiveOrder[];

    full.sort(
      (a, b) =>
        new Date(a.order.created_at).getTime() - new Date(b.order.created_at).getTime()
    );

    setOrders(full);
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchOrders();
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

    const refresh = () => fetchOrders().catch(() => { });

    s.on("connect", () => { });
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
    setOrders((prev) =>
      prev.map((x) =>
        x.order.id === orderId
          ? {
            ...x,
            order: {
              ...x.order,
              status,
              completed_at:
                status === "completed"
                  ? new Date().toISOString()
                  : x.order.completed_at ?? null,
            },
          }
          : x
      )
    );

    if (USE_MOCK) return;

    await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return { orders, loading, error, counts, setStatus, refresh: fetchOrders };
}