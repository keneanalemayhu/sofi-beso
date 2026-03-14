// @/app/orders/page.tsx

"use client";
import { useMemo } from "react";
import { money } from "@/lib/money";
import { useWaiters } from "@/hooks/useWaiter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/hooks/useOrders";

export default function WaiterOrdersPage() {
  const { waiters, loading: waitersLoading, error: waitersError } = useWaiters();
  const { orders, loading, error, refresh } = useOrders();

  const waiterNameById = useMemo(
    () => new Map(waiters.map((w) => [w.id, w.name])),
    [waiters]
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        waiterId: string;
        waiterName: string;
        total: number;
        orders: typeof orders;
      }
    >();

    for (const row of orders) {
      const waiterId = row.order.waiter_id || "unknown";
      const waiterName =
        row.order.waiter_id
          ? waiterNameById.get(row.order.waiter_id) || "Unknown"
          : "No waiter";

      if (!map.has(waiterId)) {
        map.set(waiterId, {
          waiterId,
          waiterName,
          total: 0,
          orders: [],
        });
      }

      const current = map.get(waiterId)!;
      current.orders.push(row);
      current.total += Number(row.order.total_amount || 0);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [orders, waiterNameById]);

  const grandTotal = grouped.reduce((sum, g) => sum + g.total, 0);

  if (loading || waitersLoading) {
    return (
      <div className="h-screen bg-slate-950 text-white p-4">
        <div className="text-sm text-white/70">Loading waiter orders…</div>
      </div>
    );
  }

  if (error || waitersError) {
    return (
      <div className="h-screen bg-slate-950 text-white p-4">
        <div className="text-sm text-red-300">{error || waitersError}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-white">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold tracking-tight">Waiter Orders</div>
          <div className="text-xs text-white/70">
            Orders grouped by waiter and held amount
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-400 text-slate-950">
            Total {money(grandTotal)}
          </Badge>

          <Button
            variant="secondary"
            className="bg-slate-800/70 border border-white/10 text-white hover:bg-slate-800"
            onClick={refresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <ScrollArea className="h-full pr-2">
          <div className="flex flex-col gap-3">
            {grouped.length === 0 ? (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="text-sm text-white/70">No active orders found.</div>
              </Card>
            ) : (
              grouped.map((group) => (
                <Card
                  key={group.waiterId}
                  className="p-4 bg-white/5 border-white/10 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-white">
                        {group.waiterName}
                      </div>
                      <div className="text-xs text-white/60">
                        {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white/60">Held total</div>
                      <div className="text-lg font-extrabold text-emerald-300">
                        {money(group.total)}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3 bg-white/10" />

                  <div className="flex flex-col gap-2">
                    {group.orders.map(({ order, items }) => (
                      <Card
                        key={order.id}
                        className="p-3 bg-white/6 border-white/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">
                              Order #{order.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-white/60">
                              {new Date(order.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="font-extrabold tabular-nums text-white">
                            {money(Number(order.total_amount))}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((item) => (
                            <Badge
                              key={item.id}
                              variant="outline"
                              className="border-white/20 text-white/85"
                            >
                              {item.quantity}× {item.name}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}