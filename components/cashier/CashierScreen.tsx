/* eslint-disable @typescript-eslint/no-explicit-any */
// @/components/cashier/CashierScreen.tsx

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CASHIER_USER_ID } from "@/lib/config";
import { apiJson, getBranchInfo, type BranchInfo } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { createLocalId, printReceipt } from "@/lib/print";
import { money } from "@/lib/money";
import { useWaiters } from "@/hooks/useWaiter";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { useCalendar } from "@/hooks/useCalendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    tone: "ok" | "err";
  } | null>(null);

  const [servingMode, setServingMode] = useState<"individual" | "shared_tray">(
    "individual",
  );

  const searchRef = useRef<HTMLInputElement>(null);

  const sectionRef = useRef<HTMLElement>(null);

  // Width lives in a CSS variable, not state — dragging shouldn't re-render
  // the whole menu grid on every pointermove.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const saved = window.localStorage.getItem("cashier:cartWidth");
    if (saved) el.style.setProperty("--cart-w", `${saved}px`);
  }, []);

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    const el = sectionRef.current;
    if (!el) return;

    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const next = Math.min(
        Math.max(rect.right - ev.clientX, 320),
        Math.max(rect.width - 420, 320),
      );
      el!.style.setProperty("--cart-w", `${Math.round(next)}px`);
    }

    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const current = el!.style.getPropertyValue("--cart-w").replace("px", "");
      if (current) window.localStorage.setItem("cashier:cartWidth", current);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function resetWidth() {
    const el = sectionRef.current;
    if (!el) return;
    el.style.removeProperty("--cart-w");
    window.localStorage.removeItem("cashier:cartWidth");
  }

  const { formatDateTime } = useCalendar();
  const {
    waiters,
    loading: waitersLoading,
    error: waitersError,
  } = useWaiters(branchSlug);
  const {
    categories,
    filteredMenu,
    loading: menuLoading,
    error: menuError,
  } = useMenu(search, activeCategory, branchSlug);
  const {
    cart,
    total,
    addToCart,
    decQty,
    incQty,
    clearCart,
    removeFromCart,
    setComment,
  } = useCart();

  const notify = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

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

  const cartQty = useMemo(
    () =>
      cart.reduce<Record<string, number>>((acc, c) => {
        acc[c.menu_item_id] = c.quantity;
        return acc;
      }, {}),
    [cart],
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart],
  );

  // User-triggered fetch: owns the dialog spinner and surfaces errors.
  const fetchActiveOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await apiJson<ActiveOrder[]>(
        "/orders/active-with-items",
        undefined,
        branchSlug,
      );
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      notify(e?.message || "ትእዛዞችን መጫን አልተቻለም።", "err");
    } finally {
      setOrdersLoading(false);
    }
  }, [branchSlug, notify]);

  // Background poll for the header badge. Every setState here happens inside
  // an async callback after an await — never synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;

    async function loadQuietly() {
      try {
        const data = await apiJson<ActiveOrder[]>(
          "/orders/active-with-items",
          undefined,
          branchSlug,
        );
        if (!cancelled) setActiveOrders(Array.isArray(data) ? data : []);
      } catch {
        // A stale badge is not worth a toast.
      }
    }

    void loadQuietly();
    const timer = window.setInterval(loadQuietly, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [branchSlug]);

  // "/" focuses search, Esc clears it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && typing) {
        setSearch("");
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submitOrder() {
    if (!selectedWaiterId) return notify("አስተናጋጅ ይምረጡ።", "err");
    if (!CASHIER_USER_ID) {
      return notify("የካሸሪ መለያ አልተዋቀረም። (ADMIN)", "err");
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
          waiters.find((w) => w.id === selectedWaiterId)?.name ?? "ያልታወቀ",
        servingMode,
        items: cart,
        total,
        createdAt: formatDateTime(new Date(), { includeTime: true }),
        branchName: branch?.branch_name,
      });

      clearCart();
      setServingMode("individual");
      setCartOpen(false);
      setSearch("");
      notify("ትእዛዝ ተልኮአል።");
      await fetchActiveOrders();
    } catch (e: any) {
      notify(e?.message || "ትእዛዝ መላክ አልተቻለም።", "err");
    } finally {
      setSubmitting(false);
    }
  }

  async function voidOrder(orderId: string) {
    if (!CASHIER_USER_ID) {
      return notify("የካሸሪ መለያ አልተዋቀረም። (ADMIN)", "err");
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
      notify("ትእዛዝ ጠፍቶአል።");
      await fetchActiveOrders();
    } catch (e: any) {
      notify(e?.message || "ትእዛዝ ማጥፋት አልተቻለም።", "err");
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-950">
      <header className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
              ካሸሪ
            </h1>
            {branch ? (
              <span className="rounded-full bg-teal-500 px-2.5 py-1 text-xs font-bold text-white sm:text-sm">
                {branch.branch_name}
              </span>
            ) : null}
            <span className="ml-auto lg:hidden">
              <Header />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden lg:block">
              <Header />
            </span>

            <div className="relative min-w-0 flex-1 lg:w-85 lg:flex-none">
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredMenu.length > 0) {
                    addToCart(filteredMenu[0]);
                    setSearch("");
                  }
                }}
                placeholder="ሜኑ ላይ ይፍልጉ...  ( / )"
                className="h-12 border-slate-300 bg-white pr-10 text-base placeholder:text-slate-400 focus-visible:ring-teal-500/40"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full text-lg leading-none text-slate-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <ActiveOrdersDialog
              open={ordersOpen}
              onOpenChange={async (open) => {
                setOrdersOpen(open);
                if (open) await fetchActiveOrders();
              }}
              todayOrders={todayOrders}
              loading={ordersLoading}
              voidingOrderId={voidingOrderId}
              onRefresh={fetchActiveOrders}
              onVoid={voidOrder}
            />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-2 sm:p-3">
        <section
          ref={sectionRef}
          className="grid h-full min-h-0 grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_14px_var(--cart-w,400px)]"
        >
          <MenuGrid
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            items={filteredMenu}
            cartQty={cartQty}
            loading={loading}
            error={loadError}
            onSelect={addToCart}
          />

          <div
            onPointerDown={startResize}
            onDoubleClick={resetWidth}
            title="ለማስተካከል ይጎትቱ · ለመመለስ ሁለቴ ይንኩ"
            className="group hidden cursor-col-resize items-center justify-center xl:flex"
          >
            <div className="h-16 w-1.5 rounded-full bg-slate-300 transition group-hover:h-24 group-hover:bg-teal-500" />
          </div>

          <div
            onClick={() => setCartOpen(false)}
            className={[
              "fixed inset-0 z-30 bg-slate-950/40 transition-opacity xl:hidden",
              cartOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
          />

          <div
            className={[
              "z-40 flex min-h-0 min-w-0 flex-col",
              "fixed inset-x-0 bottom-0 h-[88dvh] transition-transform duration-300 ease-out",
              "xl:static xl:inset-auto xl:h-auto xl:translate-y-0 xl:transition-none",
              cartOpen ? "translate-y-0" : "translate-y-full xl:translate-y-0",
            ].join(" ")}
          >
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
              onRemove={removeFromCart}
              onSetComment={setComment}
              onClear={clearCart}
              onSubmit={submitOrder}
              submitting={submitting}
              onClose={() => setCartOpen(false)}
            />
          </div>
        </section>
      </main>

      <div className="shrink-0 border-t border-slate-200 bg-white p-2 xl:hidden">
        <Button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex h-14 w-full items-center justify-between bg-slate-950 px-4 text-white hover:bg-slate-800"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-teal-500 px-2 py-0.5 tabular-nums">
              {itemCount}
            </span>
            ትእዛዝ ይመልከቱ
          </span>
          <span className="text-lg font-extrabold tabular-nums">
            {money(total)}
          </span>
        </Button>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 xl:bottom-8">
          <div
            className={[
              "rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg",
              toast.tone === "err" ? "bg-red-600" : "bg-slate-950",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        </div>
      ) : null}
    </div>
  );
}
