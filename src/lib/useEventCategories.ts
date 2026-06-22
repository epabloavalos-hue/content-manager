"use client";
import { useState, useEffect } from "react";

export interface EventCategory { id: string; value: string; label: string; order: number; }

let cache: EventCategory[] | null = null;

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategory[]>(cache ?? []);
  useEffect(() => {
    if (cache) { setCategories(cache); return; }
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(data => { cache = data; setCategories(data); })
      .catch(() => {});
  }, []);
  const categoryLabel = (v: string) => categories.find(c => c.value === v)?.label ?? v;
  return { categories, categoryLabel };
}

export function invalidateCategoriesCache() { cache = null; }
