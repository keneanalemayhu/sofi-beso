// @/app/orders/page.tsx

"use client";
import { useMemo, useState } from "react";
import { money } from "@/lib/money";
import { useWaiters } from "@/hooks/useWaiter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/hooks/useOrders";
import { ChevronDown, ChevronRight } from "lucide-react";

type GroupedOrders = {
  waiterId: string;
  waiterName: string;
  total: number;
  orders: ReturnType<typeof useOrders>["orders"];
};

export default function WaiterOrdersPage() {
  const { waiters, loading: waitersLoading, error: waitersError } = useWaiters();
  const { orders, loading, error, refresh } = useOrders();

  const waiterNameById = useMemo(
    () => new Map(waiters.map((w) => [w.id, w.name])),
    [waiters]
  );

  const { pendingGroups, completedGroups, pendingTotal, completedTotal } = useMemo(() => {
    const pendingMap = new Map<string, GroupedOrders>();
    const completedMap = new Map<string, GroupedOrders>();

    for (const row of orders) {
      const waiterId = row.order.waiter_id || "unknown";
      const waiterName = row.order.waiter_id
        ? waiterNameById.get(row.order.waiter_id) || "Unknown"
        : "No waiter";

      const status = String(row.order.status || "").toLowerCase();
      const isCompleted = status === "completed";
      const targetMap = isCompleted ? completedMap : pendingMap;

      if (!targetMap.has(waiterId)) {
        targetMap.set(waiterId, {
          waiterId,
          waiterName,
          total: 0,
          orders: [],
        });
      }

      const current = targetMap.get(waiterId)!;
      current.orders.push(row);
      current.total += Number(row.order.total_amount || 0);
    }

    const sortGroups = (groups: GroupedOrders[]) =>
      groups.sort((a, b) => b.total - a.total);

    const pendingGroups = sortGroups(Array.from(pendingMap.values()));
    const completedGroups = sortGroups(Array.from(completedMap.values()));

    const pendingTotal = pendingGroups.reduce((sum, g) => sum + g.total, 0);
    const completedTotal = completedGroups.reduce((sum, g) => sum + g.total, 0);

    return {
      pendingGroups,
      completedGroups,
      pendingTotal,
      completedTotal,
    };
  }, [orders, waiterNameById]);

  if (loading || waitersLoading) {
    return (
      <div className="h-screen bg-slate-950 p-4 text-white">
        <div className="text-sm text-white/70">Loading waiter orders...</div>
      </div>
    );
  }

  if (error || waitersError) {
    return (
      <div className="h-screen bg-slate-950 p-4 text-white">
        <div className="text-sm text-red-300">{error || waitersError}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-lg font-extrabold tracking-tight">Waiter Orders</div>
          <div className="text-xs text-white/70">
            Pending and completed orders grouped by waiter
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-400 text-slate-950">
            Pending {money(pendingTotal)}
          </Badge>

          <Badge className="bg-emerald-400 text-slate-950">
            Completed {money(completedTotal)}
          </Badge>

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
        <div className="grid h-full min-h-0 gap-3 xl:grid-cols-2">
          <OrdersSection
            title="Pending Orders"
            subtitle="Orders still being handled"
            emptyText="No pending orders found."
            groups={pendingGroups}
            total={pendingTotal}
            totalColor="text-amber-300"
            badgeClassName="bg-amber-400 text-slate-950"
          />

          <OrdersSection
            title="Completed Orders"
            subtitle="Orders already finished"
            emptyText="No completed orders found."
            groups={completedGroups}
            total={completedTotal}
            totalColor="text-emerald-300"
            badgeClassName="bg-emerald-400 text-slate-950"
          />
        </div>
      </div>
    </div>
  );
}

function OrdersSection({
  title,
  subtitle,
  emptyText,
  groups,
  total,
  totalColor,
  badgeClassName,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  groups: {
    waiterId: string;
    waiterName: string;
    total: number;
    orders: {
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
    }[];
  }[];
  total: number;
  totalColor: string;
  badgeClassName: string;
}) {

    const isCompletedSection = title.toLowerCase().includes("completed");

  function OrderCard({
    order,
    items,
    defaultOpen,
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
    defaultOpen: boolean;
  }) {
    const [open, setOpen] = useState(defaultOpen);

    const itemCount = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
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
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>

            <div>
              <div className="font-semibold text-white">
                Order #{order.id.slice(0, 8)}
              </div>

              <div className="mt-1 text-xs text-white/60">
                Created: {new Date(order.created_at).toLocaleString()}
              </div>

              {order.completed_at ? (
                <div className="text-xs text-white/60">
                  Completed: {new Date(order.completed_at).toLocaleString()}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-white/20 text-white/80"
                >
                  {order.status || "unknown"}
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
  return (
    <Card className="flex min-h-0 flex-col border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">{title}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>

        <Badge className={badgeClassName}>{money(total)}</Badge>
      </div>

      <Separator className="my-3 bg-white/10" />

      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="flex flex-col gap-3">
          {groups.length === 0 ? (
            <Card className="border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70">{emptyText}</div>
            </Card>
          ) : (
            groups.map((group) => {
              const totalItems = group.orders.reduce(
                (sum, row) => sum + row.items.reduce((n, item) => n + Number(item.quantity || 0), 0),
                0
              );

              return (
                <Card
                  key={`${title}-${group.waiterId}`}
                  className="border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-white">
                        {group.waiterName}
                      </div>
                      <div className="text-xs text-white/60">
                        {group.orders.length} order{group.orders.length !== 1 ? "s" : ""} • {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white/60">Total</div>
                      <div className={`text-lg font-extrabold ${totalColor}`}>
                        {money(group.total)}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3 bg-white/10" />

                  <div className="flex flex-col gap-3">
                    {group.orders.map(({ order, items }) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        items={items}
                        defaultOpen={!isCompletedSection}
                      />
                    ))}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}