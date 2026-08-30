"use client";

import { Icon } from "@iconify/react";
import { CATS, type Cat } from "@/lib/notes/types";

export type FilterTag = "all" | Cat;

type SearchAndFiltersProps = {
  query: string;
  tag: FilterTag;
  onQueryChange: (value: string) => void;
  onTagChange: (value: FilterTag) => void;
};

export function SearchAndFilters({
  query,
  tag,
  onQueryChange,
  onTagChange,
}: SearchAndFiltersProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <label className="relative block w-full">
        <span className="sr-only">search the water</span>
        <span className="pointer-events-none absolute inset-y-0 left-0 grid w-16 place-items-center text-ink-soft">
          <Icon icon="bi:search" width={36} height={36} />
        </span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="search the water..."
          className="type-input h-16 w-full rounded-input border border-line bg-surface-2 pr-5 pl-16 text-ink outline-none placeholder:text-ink-soft"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onTagChange("all")}
          aria-pressed={tag === "all"}
          className={`type-label rounded-pill px-4 py-2 ${
            tag === "all" ? "bg-accent text-surface" : "bg-surface-2 text-ink"
          }`}
        >
          ALL
        </button>
        {CATS.map((item) => {
          const selected = item === tag;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onTagChange(item)}
              aria-pressed={selected}
              className={`type-label rounded-pill px-4 py-2 ${
                selected ? "bg-accent text-surface" : "bg-surface-2 text-ink"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}
