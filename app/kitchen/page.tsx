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
  const [showCompleted, setShowCompleted] = useState(false);

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = String(o.order.status || "").toLowerCase();

      if (showCompleted) return status === "completed";
      return status !== "completed";
    });
  }, [orders, showCompleted]);

  const activeCount = counts.pending + counts.preparing + counts.ready;
  const completedCount = orders.filter(
    (o) => String(o.order.status || "").toLowerCase() === "completed"
  ).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-extrabold tracking-tight">ኩሽና</div>
            <div className="text-xs text-white/70">
              Swipe right or tap Done
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-400 text-slate-950">
              ያልተሰሩ {activeCount}
            </Badge>

            <Badge className="bg-emerald-400 text-slate-950">
              የወጡ {completedCount}
            </Badge>

            <Button
              variant="secondary"
              className="h-9 border border-white/10 bg-slate-800/70 px-3 text-white hover:bg-slate-800"
              onClick={() => setShowCompleted((v) => !v)}
            >
              {showCompleted ? "ያልተሰሩ ምግቦች" : "የወጡ ምግቦች"}
            </Button>

            <Button
              variant="secondary"
              className="h-9 border border-white/10 bg-slate-800/70 px-3 text-white hover:bg-slate-800"
              onClick={() => refresh()}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 p-3">
        <Card className="h-full p-3 bg-slate-900/60 border-white/10 shadow-sm">
          {loading ? (
            <div className="text-sm text-white/70">Loading orders…</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : visibleOrders.length === 0 ? (
            <div className="text-sm text-white/70">
              {showCompleted ? "No orders found." : "No active orders."}
            </div>
          ) : (
            <ScrollArea className="h-full pr-1 sm:pr-2">
              <div className="flex flex-col gap-3">
                {visibleOrders.map((o) => (
                  <OrderRow
                    key={o.order.id}
                    status={o.order.status}
                    createdAt={o.order.created_at}
                    waiterName={o.order.waiter_name ?? "Unknown waiter"}
                    servingMode={o.order.serving_mode ?? "individual"}
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
  servingMode,
  items,
  onComplete,
}: {
  status: string;
  createdAt: string;
  waiterName: string;
  servingMode: "individual" | "shared_tray";
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
      if (status !== "completed" && dx >= threshold) onComplete();
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


  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-end rounded-xl border border-emerald-400/25 bg-emerald-500/20 pr-4">
        <div className="flex items-center gap-3">
          <div className="hidden text-xs text-white/80 sm:block">Swipe →</div>
          <div className="font-extrabold text-emerald-200">DONE</div>
        </div>
      </div>

      <div
        {...swipe}
        style={{ transform: `translateX(${dx}px)` }}
        className="relative will-change-transform transition-transform duration-150"
      >
        <Card className="rounded-xl border-white/10 bg-slate-900/70 p-3">

          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <div key={idx}>
                <div className="text-lg font-extrabold text-white leading-tight">
                  {it.name}{" "}
                  <span className="text-white/70 font-bold">× {it.qty}</span>
                </div>

                {it.comment ? (
                  <div className="text-sm text-amber-200/90 mt-0.5 break-words">
                    {it.comment}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <Separator className="my-3 bg-white/10" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 text-xs">

              {/* ⏱ time (still subtle) */}
              <div className="text-white/50">{minutes} min ago</div>

              {/* 🍽 serving mode (PROMINENT) */}
              <div className="inline-flex w-fit items-center rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-sm font-extrabold text-amber-200">
                {servingMode === "shared_tray" ? "አንድ ላይ" : "የተለያዩ ትእዛዞች"}
              </div>

              {/* 👤 waiter (boxed + strong) */}
              <div className="inline-flex w-fit items-center rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-sm font-extrabold text-white">
                {waiterName}
              </div>

            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge className={statusBadge(status)}>
                {status.toUpperCase()}
              </Badge>

              {status !== "completed" ? (
                <Button
                  className="h-10 px-4 font-extrabold bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  onClick={onComplete}
                >
                  አልቆአል
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}