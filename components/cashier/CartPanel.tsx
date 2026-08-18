// @/components/cashier/CartPanel.tsx

"use client";
import { useState } from "react";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  onRemove: (menuItemId: string) => void;
  onSetComment: (menuItemId: string, comment: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  submitting: boolean;
  onClose?: () => void;
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
  onRemove,
  onSetComment,
  onClear,
  onSubmit,
  submitting,
  onClose,
}: Props) {
  const [noteFor, setNoteFor] = useState<string | null>(null);

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const segment = (active: boolean) =>
    [
      "h-11 flex-1 rounded-xl text-sm font-bold transition",
      active
        ? "bg-white text-slate-950 shadow-sm"
        : "bg-transparent text-slate-500 hover:text-slate-800",
    ].join(" ");

  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col gap-0 rounded-b-none border-slate-200 bg-white p-0 shadow-xl xl:rounded-b-xl xl:shadow-sm">
      <div className="shrink-0 border-b border-slate-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-base font-extrabold text-slate-950">
              የአሁን ትእዛዝ
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {itemCount} ምግቦች
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={cart.length === 0 || submitting}
            className="h-10 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            ያጥፉ
          </Button>

          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 w-10 p-0 text-xl leading-none text-slate-500 hover:bg-slate-100 xl:hidden"
              aria-label="Close cart"
            >
              ×
            </Button>
          ) : null}
        </div>

        <div className="mt-2.5">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            አስተናጋጅ ይምረጡ
            {!selectedWaiterId ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold normal-case text-red-700">
                ያስፈልጋል
              </span>
            ) : null}
          </div>

          <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
            {waiters.length === 0 ? (
              <div className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
                አስተናጋጅ አልተመዘገበም።
              </div>
            ) : (
              waiters.map((w) => {
                const active = selectedWaiterId === w.id;
                return (
                  <Button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWaiter(w.id)}
                    variant="secondary"
                    className={[
                      "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold",
                      active
                        ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {w.name}
                  </Button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-2 flex gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onServingModeChange("individual")}
            className={segment(servingMode === "individual")}
          >
            የተለያዩ
          </button>
          <button
            type="button"
            onClick={() => onServingModeChange("shared_tray")}
            className={segment(servingMode === "shared_tray")}
          >
            አንድ ላይ
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {cart.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                🧾
              </div>
              <div className="text-sm font-semibold text-slate-600">
                ምንም ነገር አልተመረጠም።
              </div>
              <div className="mt-1 text-xs text-slate-400">
                ከሜኑ ላይ ይንኩ ወይም ይፍልጉ።
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2.5">
              {cart.map((it) => {
                const editing = noteFor === it.menu_item_id;
                return (
                  <div
                    key={it.menu_item_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold text-slate-950">
                          {it.name}
                        </div>
                        <div className="mt-0.5 text-xs tabular-nums text-slate-500">
                          {it.quantity} × {money(it.price)}
                        </div>
                      </div>
                      <div className="text-[15px] font-extrabold tabular-nums text-slate-950">
                        {money(it.price * it.quantity)}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onDecQty(it.menu_item_id)}
                          disabled={submitting}
                          className="h-10 w-10 rounded-xl border border-slate-300 bg-white p-0 text-xl leading-none text-slate-950 hover:bg-slate-100"
                        >
                          −
                        </Button>
                        <div className="w-9 text-center text-base font-extrabold tabular-nums text-slate-950">
                          {it.quantity}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onIncQty(it.menu_item_id)}
                          disabled={submitting}
                          className="h-10 w-10 rounded-xl border border-slate-300 bg-white p-0 text-xl leading-none text-slate-950 hover:bg-slate-100"
                        >
                          +
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setNoteFor(editing ? null : it.menu_item_id)
                          }
                          disabled={submitting}
                          className={[
                            "h-10 rounded-xl px-3 text-xs font-bold",
                            it.comment
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "text-slate-600 hover:bg-slate-200",
                          ].join(" ")}
                        >
                          ማስታወሻ
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onRemove(it.menu_item_id)}
                          disabled={submitting}
                          className="h-10 w-10 rounded-xl p-0 text-base text-red-600 hover:bg-red-50"
                          aria-label="Remove item"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>

                    {editing ? (
                      <Input
                        autoFocus
                        value={it.comment ?? ""}
                        onChange={(e) =>
                          onSetComment(it.menu_item_id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            setNoteFor(null);
                          }
                        }}
                        onBlur={() => setNoteFor(null)}
                        placeholder="ለምሳሌ፦ በርበሬ አይግባ"
                        className="mt-2 h-11 border-slate-300 bg-white text-sm focus-visible:ring-teal-500/40"
                      />
                    ) : it.comment ? (
                      <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
                        {it.comment}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="mb-2.5 flex items-end justify-between">
          <span className="text-sm font-semibold text-slate-600">ጠቅላላ</span>
          <span className="text-3xl font-extrabold tabular-nums text-slate-950">
            {money(total)}
          </span>
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={cart.length === 0 || submitting || !selectedWaiterId}
          className="h-16 w-full rounded-2xl bg-amber-400 text-lg font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-40"
        >
          {submitting ? "በማተም ላይ..." : "ትእዛዝ ያትሙ"}
        </Button>
      </div>
    </Card>
  );
}
