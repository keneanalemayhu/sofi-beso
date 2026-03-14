/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useMenu.ts

"use client";
import { useEffect, useMemo, useState } from "react";
import { API_BASE, USE_MOCK } from "@/lib/config";
import { mockMenu } from "@/lib/mock-data";
import type { MenuRow } from "@/types/menu";

export function useMenu(search: string, activeCategory: string) {
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

        if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_URL");
        const res = await fetch(`${API_BASE}/menu`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Menu fetch failed (${res.status})`);
        const data = (await res.json()) as MenuRow[];
        setMenu(data.filter((m) => m.is_active));
      } catch (e: any) {
        setError(e?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of menu) set.add(m.category_name);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((m) => {
      const inCat = activeCategory === "All" || m.category_name === activeCategory;
      const inSearch = !q || m.name.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [menu, activeCategory, search]);

  return { menu, categories, filteredMenu, loading, error };
}