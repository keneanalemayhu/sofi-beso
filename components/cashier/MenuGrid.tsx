// @/components/cashier/MenuGrid.tsx

"use client";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { MenuRow } from "@/types/menu";

type Props = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  items: MenuRow[];
  loading: boolean;
  error: string | null;
  onSelect: (item: MenuRow) => void;
};

export function MenuGrid({
  categories,
  activeCategory,
  onCategoryChange,
  items,
  loading,
  error,
  onSelect,
}: Props) {
  return (
    <Card className="flex min-h-0 min-w-0 h-full flex-col border-slate-200 bg-white p-3 shadow-sm">
      <div className="shrink-0">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = activeCategory === c;
            return (
              <Button
                key={c}
                onClick={() => onCategoryChange(c)}
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
      </div>

      <Separator className="my-3 shrink-0 bg-slate-200" />

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m)}
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
  );
}