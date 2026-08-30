"use client";

import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
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
    <section className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Search the pond</span>
        <Icon
          icon="bi:search"
          width={16}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search the pond"
          className="type-label h-12 w-full rounded-input border border-line bg-surface-2 pr-4 pl-10 text-ink outline-none placeholder:text-ink-soft"
        />
      </label>
      <div className="flex flex-wrap gap-2">
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
              className={`type-label flex items-center gap-2 rounded-pill py-1 pr-4 pl-2 ${
                selected ? "bg-accent text-surface" : "bg-surface-2 text-ink"
              }`}
            >
              <Fish cat={item} id={item} scale={0.28} />
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}
