"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import { usePondCategories } from "@/lib/notes/categories";

type CategoryPickerProps = {
  value: string;
  noteId: string;
  onChange: (cat: string) => void;
};

export function CategoryPicker({ value, noteId, onChange }: CategoryPickerProps) {
  const categories = usePondCategories();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current =
    categories.find((item) => item.id === value) ??
    (value ? { id: value, name: value, fishKey: "" } : categories[0]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const options =
    current && !categories.some((item) => item.id === current.id)
      ? [current, ...categories]
      : categories;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }}
        className="type-label flex items-center gap-2 rounded-pill border border-line bg-surface-2 py-1.5 pr-3 pl-2 text-ink"
      >
        <span className="min-w-0 truncate">{current?.name ?? "category"}</span>
        <Icon
          icon="bi:chevron-down"
          width={12}
          height={12}
          className={`shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 z-50 min-w-[200px] overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pond-lg"
        >
          {options.map((item) => {
            const selected = item.id === value;
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`type-label flex w-full items-center gap-3 px-3 py-2 text-left ${
                    selected ? "bg-surface-2 text-ink" : "text-ink-soft"
                  }`}
                >
                  <Fish cat={item.id} id={`${noteId}-${item.id}`} scale={0.22} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
