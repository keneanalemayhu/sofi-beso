/* eslint-disable @typescript-eslint/no-explicit-any */
// @/components/cashier/CashierScreen.tsx

"use client";
import { useEffect, useState } from "react";
import { CASHIER_USER_ID } from "@/lib/config";
import { apiJson, getBranchInfo, type BranchInfo } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { createLocalId, printReceipt } from "@/lib/print";
import { useWaiters } from "@/hooks/useWaiter";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { useCalendar } from "@/hooks/useCalendar";
import { Input } from "@/components/ui/input";
import Header from "@/components/common/Header";
import { MenuGrid } from "@/components/cashier/MenuGrid";
import { CartPanel } from "@/components/cashier/CartPanel";
import { ActiveOrdersDialog } from "@/components/cashier/ActiveOrdersDialog";
import type { ActiveOrder } from "@/types";

export function CashierScreen({ branchSlug }: { branchSlug: string }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [waiterId, setWaiterId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [branch, setBranch] = useState<BranchInfo | null>(null);

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);

  const [servingMode, setServingMode] = useState<"individual" | "shared_tray">(
    "individual",
  );

  const { formatDateTime } = useCalendar();
  const { waiters, loading: waitersLoading, error: waitersError } =
    useWaiters(branchSlug);
  const { categories, filteredMenu, loading: menuLoading, error: menuError } =
    useMenu(search, activeCategory, branchSlug);
  const { cart, total, addToCart, decQty, incQty, clearCart } = useCart();

  useEffect(() => {
    let active = true;
    getBranchInfo(branchSlug)
      .then((b) => {
        if (active) setBranch(b);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [branchSlug]);

  const loadError = menuError || waitersError;
  const loading = menuLoading || waitersLoading;
  const selectedWaiterId = waiterId ?? waiters[0]?.id ?? null;

  async function fetchActiveOrders() {
    setOrdersLoading(true);
    try {
      const data = await apiJson<ActiveOrder[]>(
        "/orders/active-with-items",
        undefined,
        branchSlug,
      );
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e?.message || "Failed to load active orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function submitOrder() {
    if (!selectedWaiterId) return alert("Pick a waiter first.");
    if (!CASHIER_USER_ID) {
      return alert("Missing NEXT_PUBLIC_CASHIER_USER_ID in .env.local");
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        waiter_id: selectedWaiterId,
        created_by: CASHIER_USER_ID,
        serving_mode: servingMode,
        device_id: getDeviceId(),
        local_id: createLocalId(),
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          comment: c.comment?.trim() || null,
        })),
      };

      const data = await apiJson<{ orderId: string }>(
        "/orders",
        { method: "POST", body: JSON.stringify(payload) },
        branchSlug,
      );

      await printReceipt({
        orderId: data.orderId,
        waiterName:
          waiters.find((w) => w.id === selectedWaiterId)?.name ?? "Unknown",
        servingMode,
        items: cart,
        total,
        createdAt: formatDateTime(new Date(), { includeTime: true }),
        branchName: branch?.branch_name,
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

  async function voidOrder(orderId: string) {
    if (!CASHIER_USER_ID) {
      return alert("Missing NEXT_PUBLIC_CASHIER_USER_ID in .env.local");
    }

    setVoidingOrderId(orderId);
    try {
      await apiJson(
        `/orders/${orderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "voided",
            voided_by: CASHIER_USER_ID,
          }),
        },
        branchSlug,
      );
      await fetchActiveOrders();
    } catch (e: any) {
      alert(e?.message || "Failed to void order");
    } finally {
      setVoidingOrderId(null);
    }
  }

  const todayOrders = activeOrders.filter(({ order }) => {
    const d = new Date(order.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-950">
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
                ካሸሪ
              </h1>
              {branch ? (
                <span className="rounded-full bg-teal-500 px-3 py-1 text-sm font-bold text-white">
                  {branch.branch_name}
                </span>
              ) : null}
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

              <ActiveOrdersDialog
                open={ordersOpen}
                onOpenChange={async (open) => {
                  setOrdersOpen(open);
                  if (open) await fetchActiveOrders();
                }}
                orders={activeOrders}
                todayOrders={todayOrders}
                loading={ordersLoading}
                voidingOrderId={voidingOrderId}
                onRefresh={fetchActiveOrders}
                onVoid={voidOrder}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden p-3">
          <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <MenuGrid
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              items={filteredMenu}
              loading={loading}
              error={loadError}
              onSelect={addToCart}
            />

            <CartPanel
              cart={cart}
              total={total}
              waiters={waiters}
              selectedWaiterId={selectedWaiterId}
              onSelectWaiter={setWaiterId}
              servingMode={servingMode}
              onServingModeChange={setServingMode}
              onIncQty={incQty}
              onDecQty={decQty}
              onClear={clearCart}
              onSubmit={submitOrder}
              submitting={submitting}
            />
          </section>
        </main>
      </div>
    </div>
  );
}