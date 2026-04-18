/* eslint-disable react-hooks/purity */
// @/app/kitchen/page.tsx

"use client";
import { useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";

import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function statusBadge(status: string) {
  // keep simple: we treat any non-completed as active
  if (status === "pending") return "bg-amber-400 text-slate-950";
  if (status === "ready") return "bg-emerald-400 text-slate-950";
  return "bg-slate-400 text-slate-950";
}

export default function KitchenPage() {
  const { orders, loading, error, counts, setStatus, refresh } = useKitchenOrders();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-950 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="text-lg font-extrabold tracking-tight">Kitchen</div>
          <div className="text-xs text-white/70">Swipe right or tap Done</div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-400 text-slate-950">Active {counts.pending + counts.preparing + counts.ready}</Badge>
          <Button
            variant="secondary"
            className="bg-slate-800/70 border border-white/10 text-white hover:bg-slate-800"
            onClick={() => refresh()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 p-3">
        <Card className="h-full p-3 bg-slate-900/60 border-white/10 shadow-sm">
          {loading ? (
            <div className="text-sm text-white/70">Loading orders…</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-white/70">No active orders.</div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="flex flex-col gap-3">
                {orders.map((o) => (
                  <OrderRow
                    key={o.order.id}
                    status={o.order.status}
                    createdAt={o.order.created_at}
                    waiterName={o.order.waiter_name ?? "Unknown waiter"}
                    items={o.items.map((i) => ({
                      name: i.name,
                      qty: i.quantity,
                      comment: i.comment ?? "",
                    }))}
                    onComplete={() => setStatus(o.order.id, "completed")}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}

function OrderRow({
  status,
  createdAt,
  waiterName,
  items,
  onComplete,
}: {
  status: string;
  createdAt: string;
  waiterName: string;
  items: { name: string; qty: number; comment: string }[];
  onComplete: () => void;
}) {
  const [dx, setDx] = useState(0);
  const threshold = 120;

  const swipe = useSwipeable({
    onSwiping: (e) => {
      // only right swipe
      const next = Math.max(0, Math.min(e.deltaX, 220));
      setDx(next);
    },
    onSwipedRight: () => {
      if (dx >= threshold) onComplete();
      setDx(0);
    },
    onSwiped: () => setDx(0),
    trackMouse: true, // lets you test on desktop
    preventScrollOnSwipe: true,
  });

  const minutes = useMemo(() => {
    const m = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
    return Math.max(0, m);
  }, [createdAt]);

  const swipeProgress = Math.min(1, dx / threshold);

  return (
    <div className="relative">
      {/* Background "Done" layer revealed on swipe */}
      <div className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-400/25 flex items-center justify-end pr-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/80 hidden sm:block">Swipe →</div>
          <div className="font-extrabold text-emerald-200">DONE</div>
        </div>
      </div>

      {/* Foreground row that moves */}
      <div
        {...swipe}
        style={{ transform: `translateX(${dx}px)` }}
        className="relative will-change-transform transition-transform duration-150"
      >
        <Card className="p-3 bg-slate-900/70 border-white/10 rounded-xl">
          {/* Row header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-white truncate">
                {items.map((it) => `${it.name} x${it.qty}`).join(" • ")}
              </div>
              <div className="text-xs text-white/60">{minutes} min ago</div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={statusBadge(status)}>{status.toUpperCase()}</Badge>
              <Button
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300 h-10 px-4 font-extrabold"
                onClick={onComplete}
              >
                Done
              </Button>
            </div>
          </div>

          <Separator className="my-3 bg-white/10" />

          {/* Items in a single horizontal line (wrap if too long) */}
          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-extrabold text-white leading-tight">
                  {it.name} <span className="text-white/70 font-bold">x {it.qty}</span>
                </div>

                {it.comment ? (
                  <div className="text-xs text-amber-200/90 mt-0.5">{it.comment}</div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Visible swipe hint + progress */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-white/70">
              Waiter: <span className="font-semibold text-white">{waiterName}</span>
            </div>
            <div className="h-2 w-40 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${Math.round(swipeProgress * 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}