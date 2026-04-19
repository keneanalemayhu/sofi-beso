// @/app/orders-history/page.tsx

"use client";
import { useMemo, useState } from "react";
import { money } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCompletedOrdersByDay } from "@/hooks/useCompletedOrdersByDay";
import Header from "@/components/common/Header";
import { useCalendar } from "@/hooks/useCalendar";

type GroupedOrders = {
  waiterId: string;
  waiterName: string;
  total: number;
  orders: {
    order: {
      id: string;
      waiter_id: string | null;
      waiter_name?: string | null;
      created_at: string;
      completed_at?: string | null;
      total_amount: number | string;
      status?: string;
    };
    items: {
      id: string;
      quantity: number;
      name: string;
      comment?: string | null;
      price_at_time?: number | string;
    }[];
  }[];
};

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OrdersHistoryPage() {
  const [selectedDay, setSelectedDay] = useState(getTodayString());
  const { orders, loading, error, refresh } =
    useCompletedOrdersByDay(selectedDay);


  const { groups, total } = useMemo(() => {
    const map = new Map<string, GroupedOrders>();

    for (const row of orders) {
      const waiterId = row.order.waiter_id || "unknown";
      const waiterName = row.order.waiter_name || "No waiter";

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

    const groups = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const total = groups.reduce((sum, g) => sum + g.total, 0);

    return { groups, total };
  }, [orders]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 p-4 text-white">
        <div className="text-sm text-white/70">Loading completed orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-950 p-4 text-white">
        <div className="text-sm text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-lg font-extrabold tracking-tight">
            Completed Orders By Day
          </div>
          <div className="text-xs text-white/70">
            View only completed orders for a selected day
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Header />

          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
          />

          <div className="flex flex-col items-end">
            <div className="text-xs text-white/60">Total (All Waiters)</div>
            <div className="text-lg font-extrabold text-emerald-300">
              {money(total)}
            </div>
          </div>

          <Button
            variant="secondary"
            className="border border-white/10 bg-slate-800/70 text-white hover:bg-slate-800"
            onClick={refresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <Card className="flex min-h-0 h-full flex-col border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-white">
                {selectedDay}
              </div>
              <div className="text-xs text-white/60">
                Completed orders grouped by waiter
              </div>
            </div>

            <Badge className="bg-emerald-400 text-slate-950">
              {money(total)}
            </Badge>
          </div>

          <Separator className="my-3 bg-white/10" />

          <ScrollArea className="min-h-0 flex-1 pr-2">
            <div className="flex flex-col gap-3">
              {groups.length === 0 ? (
                <Card className="border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/70">
                    No completed orders found for this day.
                  </div>
                </Card>
              ) : (
                groups.map((group) => (
                  <WaiterGroupCard key={group.waiterId} group={group} />
                ))
              )}
            </div>
          </ScrollArea>
          <Separator className="my-3 bg-white/10" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {groups.length} waiter{groups.length !== 1 ? "s" : ""}
            </div>

            <div className="text-lg font-extrabold text-emerald-300">
              {money(total)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WaiterGroupCard({ group }: { group: GroupedOrders }) {
  const [open, setOpen] = useState(true);

  const totalItems = group.orders.reduce(
    (sum, row) =>
      sum + row.items.reduce((n, item) => n + Number(item.quantity || 0), 0),
    0,
  );

  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-white/70">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          <div>
            <div className="text-base font-extrabold text-white">
              {group.waiterName}
            </div>
            <div className="text-xs text-white/60">
              {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}{" "}
              • {totalItems} item{totalItems !== 1 ? "s" : ""} •{" "}
              {money(group.total)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/60">Waiter Total</div>
          <div className="text-lg font-extrabold text-emerald-300">
            {money(group.total)}
          </div>
        </div>
      </button>

      {open ? (
        <>
          <Separator className="my-3 bg-white/10" />

          <div className="flex flex-col gap-3">
            {group.orders.map(({ order, items }) => (
              <OrderCard key={order.id} order={order} items={items} />
            ))}
          </div>
        </>
      ) : null}
    </Card>
  );
}

function OrderCard({
  order,
  items,
}: {
  order: {
    id: string;
    created_at: string;
    completed_at?: string | null;
    total_amount: number | string;
    status?: string;
  };
  items: {
    id: string;
    quantity: number;
    name: string;
    comment?: string | null;
    price_at_time?: number | string;
  }[];
}) {
  const [open, setOpen] = useState(false);

  const { formatDateTime } = useCalendar();

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  return (
    <Card className="border-white/10 bg-white/6 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-white/70">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          <div>
            <div className="font-semibold text-white">
              Order #{order.id.slice(0, 8)}
            </div>

            <div className="mt-1 text-xs text-white/60">
              Created:{" "}
              {formatDateTime(new Date(order.created_at), {
                includeTime: true,
              })}
            </div>

            {order.completed_at ? (
              <div className="text-xs text-white/60">
                Completed:{" "}
                {formatDateTime(new Date(order.completed_at), {
                  includeTime: true,
                })}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-white/20 text-white/80"
              >
                completed
              </Badge>

              <Badge
                variant="outline"
                className="border-white/20 text-white/80"
              >
                {itemCount} items
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-extrabold tabular-nums text-white">
            {money(Number(order.total_amount))}
          </div>
          <div className="mt-1 text-xs text-white/50">
            {open ? "Hide details" : "Show details"}
          </div>
        </div>
      </button>

      {open ? (
        <>
          <Separator className="my-3 bg-white/10" />

          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const price = Number(item.price_at_time || 0);
              const qty = Number(item.quantity || 0);
              const subtotal = price * qty;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-900/30 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.name}</div>

                      <div className="text-xs text-white/60">
                        Qty: {qty}
                        {price > 0 ? ` • ${money(price)} each` : ""}
                      </div>

                      {item.comment ? (
                        <div className="mt-1 text-xs text-amber-200">
                          Note: {item.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-sm font-bold tabular-nums text-white">
                      {subtotal > 0 ? money(subtotal) : `${qty}×`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </Card>
  );
}
