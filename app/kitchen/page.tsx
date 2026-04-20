// @/app/kitchen/page.tsx

"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/time";
import Header from "@/components/common/Header";
import { useCalendar } from "@/hooks/useCalendar";

function statusBadge(status: string) {
  if (status === "pending") return "bg-amber-400 text-slate-950";
  if (status === "ready") return "bg-emerald-400 text-slate-950";
  return "bg-slate-400 text-slate-950";
}

export default function KitchenPage() {
  const { orders, loading, error, counts, setStatus, refresh } =
    useKitchenOrders();
  const [showCompleted, setShowCompleted] = useState(false);

  const { formatDateTime } = useCalendar();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isToday = (value?: string | null) => {
    if (!value) return false;

    const d = new Date(value);
    const now = new Date();

    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const visibleOrders = useMemo(() => {
    return orders
      .filter((o) => isToday(o.order.created_at))
      .filter((o) => {
        const status = String(o.order.status || "").toLowerCase();

        if (showCompleted) return status === "completed";
        return status !== "completed";
      })
      .sort((a, b) => {
        const aTime = new Date(a.order.created_at).getTime();
        const bTime = new Date(b.order.created_at).getTime();

        return showCompleted ? bTime - aTime : aTime - bTime;
      });
  }, [orders, showCompleted]);

  const activeCount = counts.pending + counts.preparing + counts.ready;
  const completedCount = orders.filter(
    (o) => String(o.order.status || "").toLowerCase() === "completed",
  ).length;

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notify.mp3");
    audioRef.current.volume = 0.8;
  }, []);

  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const activeOrders = orders.filter(
      (o) => String(o.order.status).toLowerCase() !== "completed",
    );

    const currentIds = new Set(activeOrders.map((o) => o.order.id));

    if (prevIdsRef.current.size === 0) {
      prevIdsRef.current = currentIds;
      return;
    }

    const hasNew = [...currentIds].some((id) => !prevIdsRef.current.has(id));

    if (hasNew) {
      audioRef.current?.play().catch(() => {});
    }

    prevIdsRef.current = currentIds;
  }, [orders]);

  useEffect(() => {
    const unlock = () => {
      audioRef.current?.play().catch(() => {});
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);

    return () => window.removeEventListener("click", unlock);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-extrabold tracking-tight">ኩሽና</div>
            <div className="text-xs text-white/70">Swipe right or tap Done</div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            <Header />

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
            <div className="h-full overflow-y-auto pr-1 sm:pr-2">
              <div className="flex flex-col gap-3">
                {visibleOrders.map((o) => {
                  const baseProps = {
                    status: o.order.status,
                    createdAt: o.order.created_at,
                    waiterName: o.order.waiter_name ?? "Unknown waiter",
                    servingMode: o.order.serving_mode ?? "individual",
                    items: o.items.map((i) => ({
                      name: i.name,
                      qty: i.quantity,
                      comment: i.comment ?? "",
                    })),
                  };

                  return showCompleted ? (
                    <CompletedOrderCard
                      key={o.order.id}
                      {...baseProps}
                      completedAt={o.order.completed_at ?? null}
                    />
                  ) : (
                    <ActiveOrderCard
                      key={o.order.id}
                      {...baseProps}
                      onComplete={() => setStatus(o.order.id, "completed")}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
  function ActiveOrderCard({
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
    return (
      <Card className="rounded-xl border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <div key={idx}>
              <div className="text-lg font-extrabold leading-tight text-white">
                {it.name}{" "}
                <span className="font-bold text-white/70">× {it.qty}</span>
              </div>

              {it.comment ? (
                <div className="mt-0.5 wrap-break-word text-sm text-amber-200/90">
                  {it.comment}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Separator className="my-3 bg-white/10" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-xs">
            <div className="text-white/50">{formatTime(createdAt)}</div>

            <div className="inline-flex w-fit items-center rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-sm font-extrabold text-amber-200">
              {servingMode === "shared_tray" ? "አንድ ላይ" : "የተለያዩ ትእዛዞች"}
            </div>

            <div className="inline-flex w-fit items-center rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-sm font-extrabold text-white">
              {waiterName}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge className={statusBadge(status)}>
              {status.toUpperCase()}
            </Badge>

            <Button
              className="h-10 bg-emerald-400 px-4 font-extrabold text-slate-950 hover:bg-emerald-300"
              onClick={onComplete}
            >
              አልቆአል
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  function CompletedOrderCard({
    status,
    createdAt,
    completedAt,
    waiterName,
    servingMode,
    items,
  }: {
    status: string;
    createdAt: string;
    completedAt: string | null;
    waiterName: string;
    servingMode: "individual" | "shared_tray";
    items: { name: string; qty: number; comment: string }[];
  }) {
    return (
      <Card className="rounded-lg border-white/10 bg-slate-900/70 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {items.map((it, idx) => (
                <div key={idx} className="text-sm font-bold text-white">
                  {it.name} <span className="text-white/60">× {it.qty}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
              <span>{waiterName}</span>
              <span>•</span>
              <span>
                {servingMode === "shared_tray" ? "አንድ ላይ" : "የተለያዩ ትእዛዞች"}
              </span>
              <span>•</span>
              <span>
                {formatDateTime(new Date(createdAt), { includeTime: true })}
              </span>
              {completedAt ? (
                <>
                  <span>•</span>
                  <span>
                    {formatDateTime(new Date(completedAt), {
                      includeTime: true,
                    })}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <Badge className={statusBadge(status)}>{status.toUpperCase()}</Badge>
        </div>
      </Card>
    );
  }
}
