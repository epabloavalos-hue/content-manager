"use client";
import { useState, useEffect } from "react";

export interface DestinationArea { id: string; value: string; label: string; contact: string; order: number; }

let cache: DestinationArea[] | null = null;

export function useDestinationAreas() {
  const [areas, setAreas] = useState<DestinationArea[]>(cache ?? []);
  useEffect(() => {
    if (cache) { setAreas(cache); return; }
    fetch("/api/admin/destination-areas")
      .then(r => r.json())
      .then(data => { cache = data; setAreas(data); })
      .catch(() => {});
  }, []);
  const areaLabel = (v: string) => areas.find(a => a.value === v)?.label ?? v;
  const areaContact = (v: string) => areas.find(a => a.value === v)?.contact ?? "";
  return { areas, areaLabel, areaContact };
}

export function invalidateAreasCache() { cache = null; }
