// @/components/cashier/CartPanel.tsx

"use client";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/types/cart";
import type { Waiter } from "@/types/waiter";

type ServingMode = "individual" | "shared_tray";

type Props = {
  cart: CartItem[];
  total: number;
  waiters: Waiter[];
  selectedWaiterId: string | null;
  onSelectWaiter: (id: string) => void;
  servingMode: ServingMode;
  onServingModeChange: (mode: ServingMode) => void;
  onIncQty: (menuItemId: string) => void;
  onDecQty: (menuItemId: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function CartPanel({
  cart,
  total,
  waiters,
  selectedWaiterId,
  onSelectWaiter,
  servingMode,
  onServingModeChange,
  onIncQty,
  onDecQty,
  onClear,
  onSubmit,
  submitting,
}: Props) {
  const pillClass = (active: boolean) =>
    [
      "h-11 rounded-full border px-4",
      active
        ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <Card className="flex min-h-0 min-w-0 flex-1 flex-col border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2">
            <div className="text-lg font-extrabold text-slate-950">
              የአሁን ትእዛዞች
            </div>
            <div className="text-xs text-slate-500">
              {cart.length} item{cart.length === 1 ? "" : "s"}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">
              Waiter
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {waiters.map((w) => (
                  <Button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWaiter(w.id)}
                    variant="secondary"
                    className={pillClass(selectedWaiterId === w.id)}
                  >
                    {w.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-slate-700">
              Serving Style
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onServingModeChange("individual")}
                className={pillClass(servingMode === "individual")}
              >
                የተለያዩ ትእዛዞች
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => onServingModeChange("shared_tray")}
                className={pillClass(servingMode === "shared_tray")}
              >
                አንድ ላይ
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onClear}
          disabled={cart.length === 0 || submitting}
          className="h-11 shrink-0 text-slate-700 hover:bg-slate-100"
        >
          ያጥፉ
        </Button>
      </div>

      <Separator className="my-3 bg-slate-200" />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                ምንም ነገር አልተመረጠም።
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map((it) => (
                  <Card
                    key={it.menu_item_id}
                    className="border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-950">
                          {it.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {money(it.price * it.quantity)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          className="h-8 w-8 border border-slate-300 bg-white p-0 text-base text-slate-950 hover:bg-slate-100"
                          onClick={() => onDecQty(it.menu_item_id)}
                          disabled={submitting}
                        >
                          –
                        </Button>

                        <div className="w-8 text-center text-sm font-extrabold tabular-nums text-slate-950">
                          {it.quantity}
                        </div>

                        <Button
                          variant="secondary"
                          className="h-8 w-8 border border-slate-300 bg-white p-0 text-base text-slate-950 hover:bg-slate-100"
                          onClick={() => onIncQty(it.menu_item_id)}
                          disabled={submitting}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Card className="shrink-0 border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">ምግቦች</span>
                <span className="font-bold tabular-nums text-slate-950">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <Separator className="my-2 bg-slate-200" />

              <div className="flex items-center justify-between">
                <span className="text-slate-600">ጠቅላላ</span>
                <span className="text-2xl font-extrabold tabular-nums text-slate-950">
                  {money(total)}
                </span>
              </div>
            </div>

            <Button
              onClick={onSubmit}
              disabled={cart.length === 0 || submitting || !selectedWaiterId}
              className="h-16 min-w-55 bg-amber-400 px-8 text-base font-extrabold text-slate-950 hover:bg-amber-300"
            >
              {submitting ? "በማተም ላይ..." : "ትእዛዝ ያትሙ"}
            </Button>
          </div>

          <div className="mt-2 text-center text-xs text-slate-500">
            ከAPI ጋር ተገናኝቶአል።
          </div>
        </Card>
      </div>
    </Card>
  );
}