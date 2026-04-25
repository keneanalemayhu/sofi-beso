/* eslint-disable @typescript-eslint/no-explicit-any */
// @/app/cashier/page.tsx

"use client";
import { useState } from "react";
import { API_BASE, CASHIER_USER_ID } from "@/lib/config";
import { money } from "@/lib/money";
import { useWaiters } from "@/hooks/useWaiter";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ActiveOrder } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/common/Header";

function createLocalId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      ((Math.random() * 16) >> (Number(c) / 4))
    ).toString(16),
  );
}

export default function CashierPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [waiterId, setWaiterId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);

  const [servingMode, setServingMode] = useState<"individual" | "shared_tray">(
    "individual",
  );

  const {
    waiters,
    loading: waitersLoading,
    error: waitersError,
  } = useWaiters();

  const {
    categories,
    filteredMenu,
    loading: menuLoading,
    error: menuError,
  } = useMenu(search, activeCategory);

  const { cart, total, addToCart, decQty, incQty, updateComment, clearCart } =
    useCart();

  const loadError = menuError || waitersError;
  const loading = menuLoading || waitersLoading;

  const selectedWaiterId = waiterId ?? waiters[0]?.id ?? null;

  async function submitOrder() {
    if (!selectedWaiterId) {
      alert("Pick a waiter first.");
      return;
    }

    if (!CASHIER_USER_ID) {
      alert("Missing NEXT_PUBLIC_CASHIER_USER_ID in .env.local");
      return;
    }

    if (cart.length === 0) return;

    setSubmitting(true);

    try {
      const payload = {
        waiter_id: selectedWaiterId,
        created_by: CASHIER_USER_ID,
        serving_mode: servingMode,
        device_id: "cashier-1",
        local_id: createLocalId(),
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          comment: c.comment?.trim() || null,
        })),
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as any)?.error || `Order failed (${res.status})`);
      }

      clearCart();
      setServingMode("individual");
      await fetchActiveOrders();
    } catch (e: any) {
      alert(e?.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchActiveOrders() {
    setOrdersLoading(true);

    try {
      const res = await fetch(`${API_BASE}/orders/active-with-items`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error((data as any)?.error || "Failed to load orders");
      }

      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e?.message || "Failed to load active orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function voidOrder(orderId: string) {
    if (!CASHIER_USER_ID) {
      alert("Missing NEXT_PUBLIC_CASHIER_USER_ID in .env.local");
      return;
    }

    setVoidingOrderId(orderId);

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "voided",
          voided_by: CASHIER_USER_ID,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as any)?.error || `Void failed (${res.status})`);
      }

      await fetchActiveOrders();
    } catch (e: any) {
      alert(e?.message || "Failed to void order");
    } finally {
      setVoidingOrderId(null);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white">
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-slate-950 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Cashier</h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Header />

              <div className="w-full sm:w-[320px]">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ሜኑ ላይ ይፍልጉ..."
                  className="h-12 border-white/10 bg-slate-900/70 text-base text-white placeholder:text-white/45 focus-visible:ring-teal-500/40"
                />
              </div>

              <Dialog
                open={ordersOpen}
                onOpenChange={async (open) => {
                  setOrdersOpen(open);
                  if (open) {
                    await fetchActiveOrders();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 border border-white/10 bg-slate-800/70 px-4 text-white hover:bg-slate-800"
                  >
                    ትእዛዞችን አሳይ ({activeOrders.length})
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-4xl border-white/10 bg-slate-950 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Active Orders
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                      Pending orders currently in the system
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="border-white/20 text-white/85"
                    >
                      {activeOrders.length} orders
                    </Badge>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={fetchActiveOrders}
                      className="border border-white/10 bg-slate-800/70 text-white hover:bg-slate-800"
                    >
                      Refresh
                    </Button>
                  </div>

                  <div className="min-h-0">
                    {ordersLoading ? (
                      <div className="text-sm text-white/70">
                        Loading orders...
                      </div>
                    ) : activeOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/70">
                        No active orders.
                      </div>
                    ) : (
                      <ScrollArea className="h-[65vh] pr-2">
                        <div className="flex flex-col gap-3">
                          {activeOrders.map(({ order, items }) => (
                            <Card
                              key={order.id}
                              className="border-white/10 bg-white/5 hover:bg-white/8 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-semibold text-white truncate">
                                    {items
                                      .map((i) => `${i.name} x${i.quantity}`)
                                      .join(" • ")}
                                  </div>
                                  <div className="mt-1 text-xs text-white/60">
                                    {new Date(
                                      order.created_at,
                                    ).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    Waiter: {order.waiter_name ?? "Unknown"}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="font-extrabold tabular-nums text-white">
                                    {money(Number(order.total_amount))}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {items.map((item) => (
                                  <Badge
                                    key={item.id}
                                    variant="outline"
                                    className="border-white/20 text-white/85"
                                  >
                                    {item.quantity}× {item.name}
                                  </Badge>
                                ))}
                              </div>

                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => voidOrder(order.id)}
                                disabled={voidingOrderId === order.id}
                                className="mt-3 h-10 w-full"
                              >
                                {voidingOrderId === order.id
                                  ? "Voiding..."
                                  : "Void Order"}
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 min-h-0 overflow-hidden p-3">
          <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[1.35fr_1fr]">
            {/* Menu */}
            <Card className="flex min-h-0 h-full flex-col border-white/10 bg-white/5 p-3 backdrop-blur">
              <div className="shrink-0">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2">
                    {categories.map((c) => {
                      const active = activeCategory === c;

                      return (
                        <Button
                          key={c}
                          onClick={() => setActiveCategory(c)}
                          variant={active ? "default" : "secondary"}
                          className={[
                            "h-11 rounded-full border px-4 text-sm whitespace-nowrap",
                            active
                              ? "border-teal-400 bg-teal-500 text-slate-950 hover:bg-teal-400"
                              : "border-white/10 bg-slate-800/70 text-white hover:bg-slate-700 hover:border-teal-400/50",
                          ].join(" ")}
                        >
                          {c}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="my-3 shrink-0 bg-white/10" />

              <div className="min-h-0 flex-1">
                {loading ? (
                  <div className="text-sm text-white/70">Loading...</div>
                ) : loadError ? (
                  <div className="text-sm text-red-300">{loadError}</div>
                ) : (
                  <ScrollArea className="h-full pr-2">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredMenu.map((m) => (
                        <Button
                          key={m.id}
                          onClick={() => addToCart(m)}
                          variant="ghost"
                          className="h-31 rounded-2xl border border-white/10 bg-linear-to-b from-white/12 to-white/6 p-3 text-left hover:from-white/12 hover:to-white/6 hover:border-teal-400/50 active:scale-[0.98]"
                        >
                          <div className="flex h-full w-full flex-col items-start justify-between">
                            <div className="line-clamp-2 text-sm font-bold leading-tight text-white">
                              {m.name}
                            </div>

                            <div className="w-full">
                              <Badge
                                variant="outline"
                                className="mb-2 max-w-full truncate border-white/20 text-white/80"
                              >
                                {m.category_name}
                              </Badge>

                              <div className="text-base font-extrabold tabular-nums text-white">
                                {money(Number(m.price))}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>

            {/* Order entry */}
            <Card className="flex min-h-0 flex-1 flex-col border-white/10 bg-white/5 p-3 backdrop-blur">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <div className="text-lg font-extrabold text-white">
                      የአሁን ትእዛዞች
                    </div>
                    <div className="text-xs text-white/60">
                      {cart.length} item{cart.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold text-white/75">
                      Waiter
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2 pb-2">
                        {waiters.map((w) => {
                          const active = selectedWaiterId === w.id;

                          return (
                            <Button
                              key={w.id}
                              type="button"
                              onClick={() => setWaiterId(w.id)}
                              variant="secondary"
                              className={[
                                "h-11 rounded-full border px-4",
                                active
                                  ? "border-teal-400 bg-teal-500 text-slate-950 hover:bg-teal-400"
                                  : "border-white/10 bg-slate-800/70 text-white hover:bg-slate-700 hover:border-teal-400/50",
                              ].join(" ")}
                            >
                              {w.name}
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 text-sm font-semibold text-white/75">
                      Serving Style
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setServingMode("individual")}
                        className={[
                          "h-11 rounded-full border px-4",
                          servingMode === "individual"
                            ? "border-teal-400 bg-teal-500 text-slate-950 hover:bg-teal-400"
                            : "border-white/10 bg-slate-800/70 text-white hover:bg-slate-700 hover:border-teal-400/50",
                        ].join(" ")}
                      >
                        የተለያዩ ትእዛዞች
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setServingMode("shared_tray")}
                        className={[
                          "h-11 rounded-full border px-4",
                          servingMode === "shared_tray"
                            ? "border-teal-400 bg-teal-500 text-slate-950 hover:bg-teal-400"
                            : "border-white/10 bg-slate-800/70 text-white hover:bg-slate-700 hover:border-teal-400/50",
                        ].join(" ")}
                      >
                        አንድ ላይ
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={clearCart}
                  disabled={cart.length === 0 || submitting}
                  className="h-11 shrink-0 text-white hover:bg-slate-700"
                >
                  ያጥፉ
                </Button>
              </div>

              <Separator className="my-3 bg-white/10" />

              {/* Cart items */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 2xl:grid 2xl:grid-cols-[1fr_300px]">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    {cart.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/70">
                        ምንም ነገር አልተመረጠም።
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {cart.map((it) => (
                          <Card
                            key={it.menu_item_id}
                            className="border-white/10 bg-white/5 hover:bg-white/8 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold leading-tight text-white">
                                {it.name}
                              </div>
                              <div className="font-extrabold tabular-nums text-white">
                                {money(it.price * it.quantity)}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                variant="secondary"
                                className="h-12 w-12 border border-white/10 bg-slate-800/70 p-0 text-lg text-white hover:border-teal-400 hover:bg-slate-700"
                                onClick={() => decQty(it.menu_item_id)}
                                disabled={submitting}
                              >
                                –
                              </Button>

                              <div className="w-12 text-center text-lg font-extrabold tabular-nums text-white">
                                {it.quantity}
                              </div>

                              <Button
                                variant="secondary"
                                className="h-12 w-12 border border-white/10 bg-slate-800/70 p-0 text-lg text-white hover:border-teal-400 hover:bg-slate-700"
                                onClick={() => incQty(it.menu_item_id)}
                                disabled={submitting}
                              >
                                +
                              </Button>

                              <div className="ml-auto text-xs tabular-nums text-white/65">
                                @ {money(it.price)}
                              </div>
                            </div>

                            <div className="mt-3">
                              <Input
                                value={it.comment}
                                onChange={(e) =>
                                  updateComment(it.menu_item_id, e.target.value)
                                }
                                placeholder="Note (e.g. no onions)"
                                disabled={submitting}
                                className="h-11 border-white/10 bg-slate-900/70 text-white placeholder:text-white/50 focus-visible:ring-teal-500/40"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Summary */}
                <Card className="mt-auto flex flex-col gap-3 border-white/10 bg-white/5 hover:bg-white/8 p-3 2xl:mt-0 2xl:h-full">
                  <div className="flex-1">
                    <div className="rounded-xl border border-white/10 bg-slate-900/30 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">ምግቦች</span>
                        <span className="font-bold tabular-nums text-white">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>

                      <Separator className="my-3 bg-white/10" />

                      <div className="flex items-center justify-between text-base">
                        <span className="text-white/70">ጠቅላላ</span>
                        <span className="text-2xl font-extrabold tabular-nums text-white">
                          {money(total)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={submitOrder}
                      disabled={
                        cart.length === 0 || submitting || !selectedWaiterId
                      }
                      className="h-14 w-full text-base font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300"
                    >
                      {submitting ? "Sending..." : "ወደ ኩሽና ይላኩ"}
                    </Button>

                    <div className="text-center text-xs text-white/60 mt-1">
                      Connected to live API.
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
