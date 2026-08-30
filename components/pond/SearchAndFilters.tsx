"use client";

import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import { CATEGORIES } from "@/lib/notes/types";
import type { Cat } from "@/lib/notes/types";

export type FilterTag = Cat | null;

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
    <section className="flex flex-col gap-3">
      <label className="flex items-center rounded-input border border-line bg-surface-2 px-4">
        <span className="sr-only">search the water</span>
        <Icon icon="bi:search" width={20} className="text-ink-soft" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="search the water…"
          className="type-label min-w-0 flex-1 bg-transparent px-3 py-3 text-ink outline-none placeholder:text-ink-soft"
        />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => onTagChange(null)}
          aria-pressed={tag === null}
          className={`type-label shrink-0 rounded-pill border border-line px-4 py-2 ${
            tag === null ? "bg-accent text-surface" : "bg-surface-2 text-ink-soft"
          }`}
        >
          ALL
        </button>
        {CATEGORIES.map((cat) => {
          const on = tag === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onTagChange(on ? null : cat.id)}
              aria-pressed={on}
              className={`type-label flex shrink-0 items-center gap-1.5 rounded-pill border border-line py-1 pr-4 pl-2 ${
                on ? "bg-accent text-surface" : "bg-surface-2 text-ink-soft"
              }`}
            >
              <Fish species={cat.species} fill={cat.fill} mark={cat.mark} scale={0.2} />
              {cat.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
