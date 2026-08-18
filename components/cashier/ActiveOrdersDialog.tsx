// @/components/cashier/ActiveOrdersDialog.tsx

"use client";
import { useState } from "react";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActiveOrder } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todayOrders: ActiveOrder[];
  loading: boolean;
  voidingOrderId: string | null;
  onRefresh: () => void;
  onVoid: (orderId: string) => void;
};

export function ActiveOrdersDialog({
  open,
  onOpenChange,
  todayOrders,
  loading,
  voidingOrderId,
  onRefresh,
  onVoid,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setConfirmId(null);
        onOpenChange(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="h-12 shrink-0 border border-slate-300 bg-white px-4 font-semibold text-slate-900 hover:bg-slate-100"
        >
          ትእዛዞች
          <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
            {todayOrders.length}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] max-w-5xl flex-col border-slate-200 bg-white text-slate-950">
        <DialogHeader>
          <DialogTitle className="text-slate-950">የዛሬ ትእዛዞች</DialogTitle>
          <DialogDescription className="text-slate-600">
            አሁን በስርአቱ ውስጥ ያሉ ትእዛዞች
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            {todayOrders.length} ትእዛዞች
          </Badge>

          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={loading}
            className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          >
            {loading ? "..." : "አድስ"}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading && todayOrders.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              ትእዛዞችን በመጫን ላይ...
            </div>
          ) : todayOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              ዛሬ ምንም ንቁ ትእዛዝ የለም።
            </div>
          ) : (
            <ScrollArea className="h-[68dvh] pr-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {todayOrders.map(({ order, items }) => {
                  const confirming = confirmId === order.id;
                  const busy = voidingOrderId === order.id;

                  return (
                    <Card
                      key={order.id}
                      className="flex flex-col border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {order.waiter_name ?? "Unknown"}
                          </div>
                        </div>
                        <div className="text-lg font-extrabold tabular-nums text-slate-950">
                          {money(Number(order.total_amount))}
                        </div>
                      </div>

                      <div className="mt-2 flex-1 space-y-1">
                        {items.map((i) => (
                          <div
                            key={i.id}
                            className="flex items-baseline gap-2 text-sm text-slate-800"
                          >
                            <span className="min-w-6 font-extrabold tabular-nums text-teal-600">
                              {i.quantity}×
                            </span>
                            <span className="wrap-break-word">{i.name}</span>
                          </div>
                        ))}
                      </div>

                      {confirming ? (
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setConfirmId(null)}
                            className="h-10 flex-1 border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                          >
                            ተው
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              setConfirmId(null);
                              onVoid(order.id);
                            }}
                            disabled={busy}
                            className="h-10 flex-1"
                          >
                            {busy ? "በማጥፋት ላይ..." : "አረጋግጡ"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setConfirmId(order.id)}
                          disabled={busy}
                          className="mt-3 h-10 w-full border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {busy ? "በማጥፋት ላይ..." : "ትእዛዝ አጥፋ"}
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}