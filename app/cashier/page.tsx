/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useEffect, useState } from "react";
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

export default function CashierPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { waiters, loading: waitersLoading, error: waitersError } = useWaiters();
  const { categories, filteredMenu, loading: menuLoading, error: menuError } = useMenu(search, activeCategory);

  const { cart, total, addToCart, decQty, incQty, updateComment, clearCart } = useCart();

  const [waiterId, setWaiterId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const waiterNameById = new Map(waiters.map((w) => [w.id, w.name]));


  const [ordersOpen, setOrdersOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);

  const loadError = menuError || waitersError;
  const loading = menuLoading || waitersLoading;

  // auto pick first waiter when loaded
  useEffect(() => {
    if (!waiterId && waiters.length > 0) {
      setWaiterId(waiters[0].id);
    }
  }, [waiters, waiterId]);

  async function submitOrder() {
    if (!waiterId) {
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
        waiter_id: waiterId,
        created_by: CASHIER_USER_ID,
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
      if (!res.ok) throw new Error((data as any)?.error || `Order failed (${res.status})`);

      alert(`Order sent! OrderId: ${(data as any).orderId}\nTotal: ${money(Number((data as any).total))}`);
      clearCart();
      setOrdersOpen(true);
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
      if (!res.ok) throw new Error((data as any)?.error || "Failed to load orders");

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
      if (!res.ok) throw new Error((data as any)?.error || `Void failed (${res.status})`);

      await fetchActiveOrders();
      alert("Order voided.");
    } catch (e: any) {
      alert(e?.message || "Failed to void order");
    } finally {
      setVoidingOrderId(null);
    }
  }

  useEffect(() => {
    if (ordersOpen) {
      fetchActiveOrders();
    }
  }, [ordersOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="px-4 py-3 border-b/30 border-white/10 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="text-lg font-extrabold tracking-tight text-white">Cashier</div>
          <div className="text-xs text-white/70">Tablet ordering</div>
        </div>

        <div className="flex items-center gap-2 w-[min(60vw,720px)] justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOrdersOpen((v) => !v)}
            className="bg-slate-800/70 text-white border border-white/10 hover:bg-slate-800"
          >
            {ordersOpen ? "Hide Orders" : `Orders (${activeOrders.length})`}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setOrdersOpen(true);
              fetchActiveOrders();
            }}
            className="bg-slate-800/70 text-white border border-white/10 hover:bg-slate-800"
          >
            Refresh Orders
          </Button>

          <div className="w-90 max-w-[55vw]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="bg-slate-900/70 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-teal-500/40"
            />
          </div>
        </div>
      </div>

      {/* vertical split */}
      {ordersOpen && (
        <Card className="p-3 bg-white/5 border-white/10 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-extrabold text-white">
              Active Orders
            </div>
            <div className="text-xs text-white/60">
              Pending orders currently in the system
            </div>
          </div>

          <Separator className="my-3 bg-white/10" />

          {ordersLoading ? (
            <div className="text-sm text-white/70">Loading orders…</div>
          ) : activeOrders.length === 0 ? (
            <div className="text-sm text-white/70">No active orders.</div>
          ) : (
            <ScrollArea className="max-h-65 pr-2">
              <div className="flex flex-col gap-2">
                {activeOrders.map(({ order, items }) => (
                  <Card key={order.id} className="p-3 bg-white/6 border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">
                          Order #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-white/60">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/60">
                          Waiter: {order.waiter_id ? waiterNameById.get(order.waiter_id) || "Unknown" : "N/A"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="font-extrabold tabular-nums text-white">
                          {money(Number(order.total_amount))}
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => voidOrder(order.id)}
                          disabled={voidingOrderId === order.id}
                          className="h-9"
                        >
                          {voidingOrderId === order.id ? "Voiding..." : "Void"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
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
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      )}
      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3">
        {/* TOP: Menu */}
        <Card className="min-h-0 flex-[0_0_62%] p-3 bg-white/5 border-white/10 backdrop-blur">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {categories.map((c) => {
                const active = activeCategory === c;
                return (
                  <Button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={[
                      "rounded-full h-10 px-4 whitespace-nowrap border",
                      active
                        ? "bg-teal-500 text-slate-950 border-teal-400 hover:bg-teal-400"
                        : "bg-slate-800/70 text-white border-white/10 hover:bg-slate-800",
                    ].join(" ")}
                    variant={active ? "default" : "secondary"}
                  >
                    {c}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <Separator className="my-2 bg-white/10" />

          {loading ? (
            <div className="text-sm text-white/70">Loading…</div>
          ) : loadError ? (
            <div className="text-sm text-red-300">{loadError}</div>
          ) : (
            <ScrollArea className="h-[calc(100%-70px)] pr-2">
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredMenu.map((m) => (
                  <Button
                    key={m.id}
                    onClick={() => addToCart(m)}
                    variant="ghost"
                    className="h-auto p-3 rounded-2xl justify-start text-left flex-col items-start gap-2
                    bg-transparent hover:bg-transparent
                    bg-linear-to-b from-white/12 to-white/6 hover:from-white/18 hover:to-white/10
                    border border-white/10"
                  >
                    <div className="font-semibold leading-tight text-white">{m.name}</div>
                    <div className="w-full flex items-center justify-between gap-2">
                      <Badge variant="outline" className="max-w-[70%] truncate border-white/20 text-white/85">
                        {m.category_name}
                      </Badge>
                      <div className="font-extrabold tabular-nums text-white">{money(Number(m.price))}</div>
                    </div>
                    <div className="text-xs text-white/65">Tap to add</div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* BOTTOM: Order */}
        <Card className="min-h-0 flex-[0_0_38%] p-3 bg-white/5 border-white/10 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-base font-extrabold text-white">Order</div>

              <div className="flex flex-wrap gap-2">
                {waiters.map((w) => {
                  const active = waiterId === w.id;

                  return (
                    <Button
                      key={w.id}
                      type="button"
                      onClick={() => setWaiterId(w.id)} // only changes when user clicks
                      variant="secondary"
                      className={[
                        "h-10 px-4 rounded-full border transition",
                        active
                          ? "bg-teal-500 text-slate-950 border-teal-400 hover:bg-teal-400"
                          : "bg-slate-800/70 text-white border-white/10 hover:bg-slate-800 hover:border-white/20",
                      ].join(" ")}
                    >
                      {w.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button variant="ghost" onClick={clearCart} disabled={cart.length === 0 || submitting} className="text-white hover:bg-white/10">
              Clear
            </Button>
          </div>

          <Separator className="my-3 bg-white/10" />

          <div className="min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
            <ScrollArea className="min-h-0 pr-2">
              {cart.length === 0 ? (
                <div className="text-sm text-white/70">No items yet. Tap menu items to add.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {cart.map((it) => (
                    <Card key={it.menu_item_id} className="p-3 bg-white/6 border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold leading-tight text-white">{it.name}</div>
                        <div className="font-extrabold tabular-nums text-white">{money(it.price * it.quantity)}</div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          className="h-11 w-11 p-0 text-lg bg-slate-800/70 text-white border border-white/10 hover:border-teal-400/60 hover:bg-slate-800"
                          onClick={() => decQty(it.menu_item_id)}
                          disabled={submitting}
                        >
                          –
                        </Button>

                        <div className="w-10 text-center font-extrabold tabular-nums text-white">{it.quantity}</div>

                        <Button
                          variant="secondary"
                          className="h-11 w-11 p-0 text-lg bg-slate-800/70 text-white border border-white/10 hover:border-teal-400/60 hover:bg-slate-800"
                          onClick={() => incQty(it.menu_item_id)}
                          disabled={submitting}
                        >
                          +
                        </Button>

                        <div className="ml-auto text-xs text-white/65 tabular-nums">@ {money(it.price)}</div>
                      </div>

                      <div className="mt-2">
                        <Input
                          value={it.comment}
                          onChange={(e) => updateComment(it.menu_item_id, e.target.value)}
                          placeholder="Note (e.g. no onions)"
                          disabled={submitting}
                          className="bg-slate-900/70 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-teal-500/40"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Card className="p-3 bg-white/6 border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between text-base">
                <span className="text-white/70">Total</span>
                <span className="font-extrabold tabular-nums text-white">{money(total)}</span>
              </div>

              <Button
                onClick={submitOrder}
                disabled={cart.length === 0 || submitting || !waiterId}
                className="h-12 text-base font-extrabold bg-amber-400 text-slate-950 hover:bg-amber-300"
              >
                {submitting ? "Sending…" : "Send to Kitchen"}
              </Button>

              <div className="text-xs text-white/60">Connected to live API.</div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}