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
  const [showVoided, setShowVoided] = useState(false);

  const { orders, loading, error, refresh } = useCompletedOrdersByDay(
    selectedDay,
    showVoided,
  );

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

  const { formatDateTime } = useCalendar();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Loading orders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-950">
              Orders By Day
            </div>
            <div className="text-xs text-slate-500">
              View orders for a selected day, grouped by waiter
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Header />

            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Total
              </div>
              <div className="text-base font-extrabold text-emerald-700">
                {money(total)}
              </div>
            </div>

            <Button
              variant="secondary"
              className="h-10 border border-slate-300 bg-white px-3 text-slate-900 hover:bg-slate-100"
              onClick={refresh}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              className={[
                "h-10 border px-3",
                showVoided
                  ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => setShowVoided((v) => !v)}
            >
              {showVoided ? "Hide voided" : "Show voided"}
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-2 sm:p-3">
        <Card className="flex h-full min-h-0 flex-col border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-slate-950">
                {formatDateTime(new Date(selectedDay), { includeTime: false })}
              </div>
              <div className="text-xs text-slate-500">
                {groups.length} waiter{groups.length !== 1 ? "s" : ""} •{" "}
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {money(total)}
            </Badge>
          </div>

          <Separator className="my-3 bg-slate-200" />

          <ScrollArea className="min-h-0 flex-1 pr-2">
            <div className="flex flex-col gap-3">
              {groups.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <div className="text-sm font-medium text-slate-700">
                    No orders found for this day.
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Try another date or press refresh.
                  </div>
                </Card>
              ) : (
                groups.map((group) => (
                  <WaiterGroupCard key={group.waiterId} group={group} />
                ))
              )}
            </div>
          </ScrollArea>

          <Separator className="my-3 bg-slate-200" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {groups.length} waiter{groups.length !== 1 ? "s" : ""}
            </div>

            <div className="text-lg font-extrabold text-emerald-700">
              {money(total)}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function WaiterGroupCard({ group }: { group: GroupedOrders }) {
  const [open, setOpen] = useState(false);

  const totalItems = group.orders.reduce(
    (sum, row) =>
      sum + row.items.reduce((n, item) => n + Number(item.quantity || 0), 0),
    0,
  );

  return (
    <Card className="border-slate-200 bg-slate-50 p-3 shadow-sm sm:p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 text-slate-500">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-slate-950">
              {group.waiterName}
            </div>
            <div className="text-xs text-slate-500">
              {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}{" "}
              • {totalItems} item{totalItems !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Waiter Total
          </div>
          <div className="text-lg font-extrabold text-emerald-700">
            {money(group.total)}
          </div>
        </div>
      </button>

      {open ? (
        <>
          <Separator className="my-3 bg-slate-200" />

          <div className="flex flex-col gap-2">
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

  const status = order.status ?? "pending";

  return (
    <Card className="rounded-xl border-slate-200 bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 text-slate-500">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-950">
              Order #{order.id.slice(0, 8)}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Created:{" "}
              {formatDateTime(new Date(order.created_at), {
                includeTime: true,
              })}
            </div>

            {order.completed_at ? (
              <div className="text-xs text-slate-500">
                Completed:{" "}
                {formatDateTime(new Date(order.completed_at), {
                  includeTime: true,
                })}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={[
                  "border px-2 py-0 text-[10px] capitalize",
                  status === "completed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status === "voided"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {status}
              </Badge>

              <Badge
                variant="outline"
                className="border-slate-300 bg-slate-50 px-2 py-0 text-[10px] text-slate-600"
              >
                {itemCount} items
              </Badge>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-extrabold tabular-nums text-slate-950">
            {money(Number(order.total_amount))}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {open ? "Hide details" : "Show details"}
          </div>
        </div>
      </button>

      {open ? (
        <>
          <Separator className="my-2 bg-slate-200" />

          <div className="flex flex-col gap-1.5">
            {items.map((item) => {
              const price = Number(item.price_at_time || 0);
              const qty = Number(item.quantity || 0);
              const subtotal = price * qty;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-950">
                        {item.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        Qty: {qty}
                        {price > 0 ? ` • ${money(price)} each` : ""}
                      </div>

                      {item.comment ? (
                        <div className="mt-1 text-xs font-medium text-amber-700">
                          Note: {item.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-sm font-bold tabular-nums text-slate-950">
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
