// @/components/cashier/ActiveOrdersDialog.tsx

"use client";
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
  orders: ActiveOrder[];
  todayOrders: ActiveOrder[];
  loading: boolean;
  voidingOrderId: string | null;
  onRefresh: () => void;
  onVoid: (orderId: string) => void;
};

export function ActiveOrdersDialog({
  open,
  onOpenChange,
  orders,
  todayOrders,
  loading,
  voidingOrderId,
  onRefresh,
  onVoid,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="h-12 border border-slate-300 bg-white px-4 text-slate-900 hover:bg-slate-100"
        >
          ትእዛዞችን አሳይ ({todayOrders.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col border-slate-200 bg-white text-slate-950">
        <DialogHeader>
          <DialogTitle className="text-slate-950">Active Orders</DialogTitle>
          <DialogDescription className="text-slate-600">
            Pending orders currently in the system
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between gap-3">
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            {orders.length} orders
          </Badge>

          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          >
            Refresh
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="text-sm text-slate-600">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              No active orders.
            </div>
          ) : (
            <ScrollArea className="h-[72vh] pr-2">
              <div className="flex flex-col gap-3">
                {todayOrders.map(({ order, items }) => (
                  <Card
                    key={order.id}
                    className="border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="wrap-break-word whitespace-normal font-semibold leading-relaxed text-slate-950">
                          {items.map((i) => (
                            <div key={i.id}>
                              {i.quantity}× {i.name}
                            </div>
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          Waiter: {order.waiter_name ?? "Unknown"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold tabular-nums text-slate-950">
                          {money(Number(order.total_amount))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Badge
                          key={item.id}
                          variant="outline"
                          className="border-slate-300 bg-slate-50 text-slate-700"
                        >
                          {item.quantity}× {item.name}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => onVoid(order.id)}
                      disabled={voidingOrderId === order.id}
                      className="mt-3 h-10 w-full"
                    >
                      {voidingOrderId === order.id
                        ? "በማጥፋት ላይ..."
                        : "ትእዛዝ አጥፋ"}
                    </Button>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}