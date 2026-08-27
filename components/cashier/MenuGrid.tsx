// @/components/cashier/MenuGrid.tsx

"use client";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MenuRow } from "@/types/menu";

type Props = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  items: MenuRow[];
  cartQty: Record<string, number>;
  loading: boolean;
  error: string | null;
  onSelect: (item: MenuRow) => void;
};

export function MenuGrid({
  categories,
  activeCategory,
  onCategoryChange,
  items,
  cartQty,
  loading,
  error,
  onSelect,
}: Props) {
  const showCategoryLabel = activeCategory === "All";

  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col gap-0 border-slate-200 bg-white p-0 shadow-sm">
      <div className="shrink-0 border-b border-slate-200 px-2 py-2">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = activeCategory === c;
            return (
              <Button
                key={c}
                type="button"
                onClick={() => onCategoryChange(c)}
                variant="secondary"
                className={[
                  "h-10 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap",
                  active
                    ? "border-teal-500 bg-teal-500 text-white hover:bg-teal-600"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {c === "All" ? "ሁሉም" : c}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 p-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="m-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="m-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            ምንም ምግብ አልተገኘም።
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-2.5 p-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {items.map((m) => {
                const qty = cartQty[m.id] ?? 0;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelect(m)}
                    className={[
                      "relative flex h-28 flex-col justify-between rounded-2xl border p-3 text-left transition active:scale-[0.97]",
                      qty > 0
                        ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500/40"
                        : "border-slate-200 bg-white shadow-sm hover:border-teal-400 hover:bg-teal-50/60",
                    ].join(" ")}
                  >
                    {qty > 0 ? (
                      <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-teal-500 px-1.5 text-xs font-extrabold tabular-nums text-white">
                        {qty}
                      </span>
                    ) : null}

                    <div className="line-clamp-2 pr-8 text-sm font-extrabold leading-tight text-slate-950">
                      {m.name}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div className="text-lg font-extrabold tabular-nums text-slate-950">
                        {money(Number(m.price))}
                      </div>
                      {showCategoryLabel ? (
                        <div className="min-w-0 truncate text-[10px] font-medium text-slate-400">
                          {m.category_name}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}