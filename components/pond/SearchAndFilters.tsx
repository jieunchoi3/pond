"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import { searchNotes, snippetAround } from "@/lib/notes/fish";
import { usePondCategories } from "@/lib/notes/categories";
import { AddCategoryChip } from "@/components/pond/AddCategoryChip";
import type { Note } from "@/lib/notes/types";

export type FilterTag = "all" | string;

type SearchAndFiltersProps = {
  query: string;
  tag: FilterTag;
  notes: Note[];
  onQueryChange: (value: string) => void;
  onTagChange: (value: FilterTag) => void;
  onPickNote: (id: string) => void;
};

export function SearchAndFilters({
  query,
  tag,
  notes,
  onQueryChange,
  onTagChange,
  onPickNote,
}: SearchAndFiltersProps) {
  const categories = usePondCategories();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const scoped = useMemo(
    () => (tag === "all" ? notes : notes.filter((note) => note.cat === tag)),
    [notes, tag],
  );
  const hits = useMemo(() => searchNotes(scoped, query, 8), [scoped, query]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  function pick(id: string) {
    onPickNote(id);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!hits.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      const hit = hits[active];
      if (!hit) return;
      event.preventDefault();
      pick(hit.note.id);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && query.trim().length > 0;

  return (
    <section className="flex w-full flex-col gap-2">
      <div ref={wrapRef} className="relative w-full">
        <label className="relative block w-full">
          <span className="sr-only">search the water</span>
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-20 place-items-center text-ink-soft">
            <Icon icon="bi:search" width={22} height={22} />
          </span>
          <input
            value={query}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${hits[active]?.note.id ?? ""}` : undefined}
            onChange={(event) => {
              onQueryChange(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="search the water..."
            className="type-input h-12 w-full rounded-input border border-line bg-surface-2 pr-5 pl-20 text-ink outline-none placeholder:text-ink-soft"
          />
        </label>

        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-[calc(100%+8px)] z-30 max-h-[280px] w-full overflow-auto rounded-card border border-line bg-surface py-2 shadow-pond-lg"
          >
            {hits.length === 0 ? (
              <li className="type-label px-5 py-4 text-ink-soft">No ripples for that. Try another word.</li>
            ) : (
              hits.map((hit, index) => {
                const snippet = hit.inTitle
                  ? hit.note.body
                    ? snippetAround(hit.note.body, query)
                    : hit.note.cat
                  : snippetAround(hit.note.body || hit.note.cat, query);
                return (
                  <li key={hit.note.id} role="presentation">
                    <button
                      id={`${listId}-${hit.note.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(hit.note.id)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left ${
                        index === active ? "bg-surface-2" : ""
                      }`}
                    >
                      <Fish cat={hit.note.cat} id={hit.note.id} scale={0.22} />
                      <span className="min-w-0 flex-1">
                        <span className="type-card-title block truncate">
                          {hit.note.title || "Untitled spark"}
                        </span>
                        <span className="type-card-body mt-1 block truncate text-ink-soft">
                          {snippet || hit.note.cat}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
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
        {categories.map((item) => {
          const selected = item.id === tag;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTagChange(item.id)}
              aria-pressed={selected}
              className={`type-label rounded-pill px-4 py-2 ${
                selected ? "bg-accent text-surface" : "bg-surface-2 text-ink"
              }`}
            >
              {item.name}
            </button>
          );
        })}
        <AddCategoryChip onCreated={onTagChange} />
      </div>
    </section>
  );
}
