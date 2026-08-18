// @/components/history/OrdersHistoryScreen.tsx

"use client";
import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/money";
import { getBranchInfo, type BranchInfo } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useCompletedOrdersByDay } from "@/hooks/useCompletedOrdersByDay";
import Header from "@/components/common/Header";
import { useCalendar } from "@/hooks/useCalendar";

type OrderRow = {
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
};

type GroupedOrders = {
  waiterId: string;
  waiterName: string;
  total: number;
  orders: OrderRow[];
};

function toDayString(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDay(day: string, delta: number) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDayString(date);
}

const STATUS_LABEL: Record<string, string> = {
  completed: "ተጠናቋል",
  voided: "ጠፍቷል",
  pending: "በመጠባበቅ ላይ",
};

export function OrdersHistoryScreen({ branchSlug }: { branchSlug: string }) {
  const today = toDayString(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [showVoided, setShowVoided] = useState(false);
  const [branch, setBranch] = useState<BranchInfo | null>(null);

  const { orders, loading, error, refresh } = useCompletedOrdersByDay(
    selectedDay,
    showVoided,
    branchSlug,
  );

  const { formatDateTime } = useCalendar();

  useEffect(() => {
    let active = true;
    getBranchInfo(branchSlug)
      .then((b) => {
        if (active) setBranch(b);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [branchSlug]);

  const { groups, total, itemTotal } = useMemo(() => {
    const map = new Map<string, GroupedOrders>();

    for (const row of orders as OrderRow[]) {
      const waiterId = row.order.waiter_id || "unknown";
      const waiterName = row.order.waiter_name || "ያልታወቀ";

      if (!map.has(waiterId)) {
        map.set(waiterId, { waiterId, waiterName, total: 0, orders: [] });
      }

      const current = map.get(waiterId)!;
      current.orders.push(row);
      current.total += Number(row.order.total_amount || 0);
    }

    const groups = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const total = groups.reduce((sum, g) => sum + g.total, 0);
    const itemTotal = (orders as OrderRow[]).reduce(
      (sum, r) =>
        sum + r.items.reduce((n, i) => n + Number(i.quantity || 0), 0),
      0,
    );

    return { groups, total, itemTotal };
  }, [orders]);

  const isToday = selectedDay === today;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-950">
      <header className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
              የትእዛዞች ዝርዝር
            </h1>
            {branch ? (
              <span className="rounded-full bg-teal-500 px-2.5 py-1 text-xs font-bold text-white sm:text-sm">
                {branch.branch_name}
              </span>
            ) : null}
            <span className="ml-auto lg:hidden">
              <Header />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden lg:block">
              <Header />
            </span>

            <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedDay((d) => shiftDay(d, -1))}
                className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <input
                type="date"
                value={selectedDay}
                max={today}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="h-9 rounded-lg bg-transparent px-2 text-sm outline-none"
              />

              <Button
                type="button"
                variant="ghost"
                disabled={isToday}
                onClick={() => setSelectedDay((d) => shiftDay(d, 1))}
                className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={isToday}
              onClick={() => setSelectedDay(today)}
              className="h-11 border border-slate-300 bg-white px-3 font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-40"
            >
              ዛሬ
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={refresh}
              disabled={loading}
              className="h-11 border border-slate-300 bg-white px-3 font-semibold text-slate-900 hover:bg-slate-100"
            >
              {loading ? "..." : "አድስ"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowVoided((v) => !v)}
              className={[
                "h-11 border px-3 font-semibold",
                showVoided
                  ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
              ].join(" ")}
            >
              {showVoided ? "የጠፉ ደብቅ" : "የጠፉ አሳይ"}
            </Button>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-200 bg-white px-3 pb-3 sm:px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox label="ቀን">
            {formatDateTime(new Date(selectedDay), { includeTime: false })}
          </StatBox>
          <StatBox label="ትእዛዞች">{orders.length}</StatBox>
          <StatBox label="ምግቦች">{itemTotal}</StatBox>
          <StatBox label="ጠቅላላ" accent>
            {money(total)}
          </StatBox>
        </div>
      </div>

      <main className="min-h-0 flex-1 p-2 sm:p-3">
        <Card className="flex h-full min-h-0 flex-col gap-0 border-slate-200 bg-white p-0 shadow-sm">
          <div className="min-h-0 flex-1">
            {error ? (
              <div className="m-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : loading && groups.length === 0 ? (
              <div className="flex flex-col gap-2.5 p-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                    📋
                  </div>
                  <div className="text-sm font-semibold text-slate-600">
                    በዚህ ቀን ምንም ትእዛዝ የለም።
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    ሌላ ቀን ይሞክሩ ወይም ያድሱ።
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2.5 p-2.5">
                  {groups.map((group) => (
                    <WaiterGroupCard
                      key={group.waiterId}
                      group={group}
                      share={total > 0 ? group.total / total : 0}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-2.5">
            <div className="text-sm font-semibold text-slate-600">
              {groups.length} አስተናጋጆች
            </div>
            <div className="text-2xl font-extrabold tabular-nums text-emerald-700">
              {money(total)}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StatBox({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={[
          "truncate text-base font-extrabold tabular-nums",
          accent ? "text-emerald-700" : "text-slate-950",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function WaiterGroupCard({
  group,
  share,
}: {
  group: GroupedOrders;
  share: number;
}) {
  const [open, setOpen] = useState(false);

  const totalItems = group.orders.reduce(
    (sum, row) =>
      sum + row.items.reduce((n, item) => n + Number(item.quantity || 0), 0),
    0,
  );

  return (
    <Card className="border-slate-200 bg-slate-50 p-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="text-slate-400">
            {open ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-extrabold text-slate-950">
              {group.waiterName}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {group.orders.length} ትእዛዞች · {totalItems} ምግቦች
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${Math.round(share * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            ድምር
          </div>
          <div className="text-lg font-extrabold tabular-nums text-emerald-700">
            {money(group.total)}
          </div>
        </div>
      </button>

      {open ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
          {group.orders.map(({ order, items }) => (
            <OrderCard key={order.id} order={order} items={items} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function OrderCard({
  order,
  items,
}: {
  order: OrderRow["order"];
  items: OrderRow["items"];
}) {
  const [open, setOpen] = useState(false);
  const { formatDateTime } = useCalendar();

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const status = order.status ?? "pending";

  return (
    <Card className="rounded-xl border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 text-slate-400">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-950">
              ትእዛዝ #{order.id.slice(0, 8)}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              ተጀመረ:{" "}
              {formatDateTime(new Date(order.created_at), {
                includeTime: true,
              })}
            </div>

            {order.completed_at ? (
              <div className="text-xs text-slate-500">
                ተጠናቀቀ:{" "}
                {formatDateTime(new Date(order.completed_at), {
                  includeTime: true,
                })}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={[
                  "border px-2 py-0 text-[10px]",
                  status === "completed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status === "voided"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {STATUS_LABEL[status] ?? status}
              </Badge>

              <Badge
                variant="outline"
                className="border-slate-300 bg-slate-50 px-2 py-0 text-[10px] text-slate-600"
              >
                {itemCount} ምግቦች
              </Badge>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-extrabold tabular-nums text-slate-950">
            {money(Number(order.total_amount))}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {open ? "ዝርዝር ደብቅ" : "ዝርዝር አሳይ"}
          </div>
        </div>
      </button>

      {open ? (
        <div className="mt-2.5 flex flex-col gap-1.5 border-t border-slate-200 pt-2.5">
          {items.map((item) => {
            const price = Number(item.price_at_time || 0);
            const qty = Number(item.quantity || 0);
            const subtotal = price * qty;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-950">
                      <span className="mr-1.5 tabular-nums text-teal-600">
                        {qty}×
                      </span>
                      {item.name}
                    </div>

                    {price > 0 ? (
                      <div className="text-xs tabular-nums text-slate-500">
                        {money(price)} ለአንዱ
                      </div>
                    ) : null}

                    {item.comment ? (
                      <div className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                        {item.comment}
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
      ) : null}
    </Card>
  );
}