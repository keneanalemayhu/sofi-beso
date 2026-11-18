/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useMenu.ts

"use client";
import { useEffect, useMemo, useState } from "react";
import { USE_MOCK } from "@/lib/config";
import { apiJson } from "@/lib/api";
import { mockMenu } from "@/lib/mock-data";
import type { MenuRow } from "@/types/menu";

/** Category key of the "most ordered" section, shown first. */
export const POPULAR = "__popular__";
/** How many items the "most ordered" section shows. */
const POPULAR_SIZE = 16;

/**
 * `chosenCategory` is the section the cashier picked, or null for the
 * default: "most ordered" when there is order history, otherwise "All".
 */
export function useMenu(
  search: string,
  chosenCategory: string | null,
  branchSlug?: string,
) {
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        if (USE_MOCK) {
          setMenu(mockMenu.filter((m) => m.is_active));
          return;
        }

        const data = await apiJson<MenuRow[]>("/menu", undefined, branchSlug);
        setMenu(data.filter((m) => m.is_active));
      } catch (e: any) {
        setError(e?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [branchSlug]);

  // Most ordered first; ties keep their usual order.
  const popular = useMemo(
    () =>
      menu
        .filter((m) => (m.order_count ?? 0) > 0)
        .sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0))
        .slice(0, POPULAR_SIZE),
    [menu],
  );

  const activeCategory =
    chosenCategory ?? (popular.length ? POPULAR : "All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of menu) set.add(m.category_name);
    const named = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [...(popular.length ? [POPULAR] : []), "All", ...named];
  }, [menu, popular]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Search looks through the whole menu when "most ordered" is selected,
    // so a cashier can always type to find any item.
    if (activeCategory === POPULAR && !q) return popular;
    return menu.filter((m) => {
      const inCat =
        activeCategory === "All" ||
        activeCategory === POPULAR ||
        m.category_name === activeCategory;
      const inSearch = !q || m.name.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [menu, popular, activeCategory, search]);

  return { menu, categories, activeCategory, filteredMenu, loading, error };
}
