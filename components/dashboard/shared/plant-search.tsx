"use client";

import { useMemo, useRef, useState } from "react";
import type { PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PlantSearchProps = {
  plants: PlantDoc[] | undefined;
  value: PlantDoc | null;
  onChange: (plant: PlantDoc | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function PlantSearch({
  plants,
  value,
  onChange,
  placeholder = "Buscar planta por nombre...",
  disabled,
  className,
}: PlantSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value?.name ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const list = plants ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 20);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [plants, query]);

  function selectPlant(p: PlantDoc) {
    onChange(p);
    setQuery(p.name);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-[220px]", className)}>
      <label className="sr-only" htmlFor="plant-search-input">
        Buscar planta
      </label>
      <div className="flex gap-2">
        <input
          id="plant-search-input"
          type="search"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value && e.target.value !== value.name) {
              onChange(null);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 180);
          }}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border border-white/20 bg-white/15 px-3 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-medium text-muted-foreground hover:bg-white/20 hover:text-foreground"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      {open && filtered.length > 0 ? (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-lg)] border border-white/20 bg-popover/95 py-1 text-sm shadow-lg backdrop-blur-md scrollbar-hide"
          role="listbox"
        >
          {filtered.map((p) => (
            <li key={p.id} role="option" aria-selected={value?.id === p.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-sidebar-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlant(p)}
              >
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-[0.7rem] text-muted-foreground">
                  {p.location} · {p.brand}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
