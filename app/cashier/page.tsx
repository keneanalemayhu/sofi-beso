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
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

async function printReceipt(order: any) {
  const canvas = document.createElement("canvas");
  canvas.width = 576;
  canvas.height = 700;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "40px serif";
  ctx.fillText("ሶፊ ቤሶ", 288, 55);

  ctx.font = "24px serif";
  ctx.fillText("Kitchen Order", 288, 95);

  ctx.textAlign = "left";
  ctx.font = "24px serif";

  let y = 145;

  ctx.fillText(`Order: ${order.orderId.slice(0, 8)}`, 20, y);
  y += 35;
  ctx.fillText(`Waiter: ${order.waiterName}`, 20, y);
  y += 35;
  ctx.fillText(`Mode: ${order.servingMode}`, 20, y);
  y += 45;

  ctx.fillText("--------------------------------", 20, y);
  y += 40;

  for (const item of order.items) {
    ctx.fillText(`${item.quantity} x ${item.name}`, 20, y);
    y += 35;

    if (item.comment?.trim()) {
      ctx.font = "20px serif";
      ctx.fillText(`NOTE: ${item.comment}`, 40, y);
      ctx.font = "24px serif";
      y += 30;
    }

    y += 10;
  }

  ctx.fillText("--------------------------------", 20, y);
  y += 40;

  ctx.font = "30px serif";
  ctx.fillText(`TOTAL: ${order.total} ብር`, 20, y);
  y += 50;

  ctx.textAlign = "center";
  ctx.font = "24px serif";
  ctx.fillText("እናመሰግናለን", 288, y);

  const imageBase64 = canvas.toDataURL("image/png");

  const res = await fetch("https://localhost:5051/print", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!res.ok) {
    throw new Error("Local print agent failed");
  }
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

      await printReceipt({
        orderId: data.orderId,
        waiterName:
          waiters.find((w) => w.id === selectedWaiterId)?.name ?? "Unknown",
        servingMode,
        items: cart,
        total,
        createdAt: new Date().toISOString(),
      });

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
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-950">
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
                Cashier
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Header />

              <div className="w-full sm:w-[320px]">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ሜኑ ላይ ይፍልጉ..."
                  className="h-12 border-slate-300 bg-white text-base text-slate-950 placeholder:text-slate-400 focus-visible:ring-teal-500/40"
                />
              </div>

              <Dialog
                open={ordersOpen}
                onOpenChange={async (open) => {
                  setOrdersOpen(open);
                  if (open) await fetchActiveOrders();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 border border-slate-300 bg-white px-4 text-slate-900 hover:bg-slate-100"
                  >
                    ትእዛዞችን አሳይ ({activeOrders.length})
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-4xl border-slate-200 bg-white text-slate-950">
                  <DialogHeader>
                    <DialogTitle className="text-slate-950">
                      Active Orders
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Pending orders currently in the system
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="border-slate-300 text-slate-700"
                    >
                      {activeOrders.length} orders
                    </Badge>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={fetchActiveOrders}
                      className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                    >
                      Refresh
                    </Button>
                  </div>

                  <div className="min-h-0">
                    {ordersLoading ? (
                      <div className="text-sm text-slate-600">
                        Loading orders...
                      </div>
                    ) : activeOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                        No active orders.
                      </div>
                    ) : (
                      <ScrollArea className="h-[65vh] pr-2">
                        <div className="flex flex-col gap-3">
                          {activeOrders.map(({ order, items }) => (
                            <Card
                              key={order.id}
                              className="border-slate-200 bg-white p-3 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-slate-950">
                                    {items
                                      .map((i) => `${i.name} x${i.quantity}`)
                                      .join(" • ")}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {new Date(
                                      order.created_at,
                                    ).toLocaleString()}
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

        <main className="flex-1 min-h-0 overflow-hidden p-3">
          <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[1.5fr_0.95fr]">
            <Card className="flex min-h-0 h-full flex-col border-slate-200 bg-white p-3 shadow-sm">
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
                              ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {c}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="my-3 shrink-0 bg-slate-200" />

              <div className="min-h-0 flex-1">
                {loading ? (
                  <div className="text-sm text-slate-600">Loading...</div>
                ) : loadError ? (
                  <div className="text-sm text-red-600">{loadError}</div>
                ) : (
                  <ScrollArea className="h-full pr-2">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredMenu.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addToCart(m)}
                          className="flex h-32 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:bg-teal-50 active:scale-[0.98]"
                        >
                          <div className="flex h-full w-full flex-col justify-between">
                            <div className="line-clamp-2 text-sm font-extrabold leading-tight text-slate-950">
                              {m.name}
                            </div>

                            <div>
                              <Badge
                                variant="outline"
                                className="mb-2 max-w-full truncate border-slate-300 bg-slate-50 text-slate-600"
                              >
                                {m.category_name}
                              </Badge>

                              <div className="text-base font-extrabold tabular-nums text-slate-950">
                                {money(Number(m.price))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>

            <Card className="flex min-h-0 flex-1 flex-col border-slate-200 bg-white p-3 shadow-sm">
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
                                  ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
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
                    <div className="mb-2 text-sm font-semibold text-slate-700">
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
                            ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
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
                            ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
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
                  className="h-11 shrink-0 text-slate-700 hover:bg-slate-100"
                >
                  ያጥፉ
                </Button>
              </div>

              <Separator className="my-3 bg-slate-200" />

              <div className="flex min-h-0 flex-1 flex-col gap-3 2xl:grid 2xl:grid-cols-[1fr_300px]">
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
                            className="border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold leading-tight text-slate-950">
                                {it.name}
                              </div>
                              <div className="font-extrabold tabular-nums text-slate-950">
                                {money(it.price * it.quantity)}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                variant="secondary"
                                className="h-12 w-12 border border-slate-300 bg-white p-0 text-lg text-slate-950 hover:bg-slate-100"
                                onClick={() => decQty(it.menu_item_id)}
                                disabled={submitting}
                              >
                                –
                              </Button>

                              <div className="w-12 text-center text-lg font-extrabold tabular-nums text-slate-950">
                                {it.quantity}
                              </div>

                              <Button
                                variant="secondary"
                                className="h-12 w-12 border border-slate-300 bg-white p-0 text-lg text-slate-950 hover:bg-slate-100"
                                onClick={() => incQty(it.menu_item_id)}
                                disabled={submitting}
                              >
                                +
                              </Button>

                              <div className="ml-auto text-xs tabular-nums text-slate-500">
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
                                className="h-11 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-teal-500/40"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <Card className="mt-auto flex flex-col gap-3 border-slate-200 bg-slate-50 p-3 2xl:mt-0 2xl:h-full">
                  <div className="flex-1">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">ምግቦች</span>
                        <span className="font-bold tabular-nums text-slate-950">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>

                      <Separator className="my-3 bg-slate-200" />

                      <div className="flex items-center justify-between text-base">
                        <span className="text-slate-600">ጠቅላላ</span>
                        <span className="text-2xl font-extrabold tabular-nums text-slate-950">
                          {money(total)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={submitOrder}
                      disabled={
                        cart.length === 0 || submitting || !selectedWaiterId
                      }
                      className="mt-3 h-14 w-full bg-amber-400 text-base font-extrabold text-slate-950 hover:bg-amber-300"
                    >
                      {submitting ? "Printing..." : "ትእዛዝ ያትሙ"}
                    </Button>

                    <div className="mt-1 text-center text-xs text-slate-500">
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
