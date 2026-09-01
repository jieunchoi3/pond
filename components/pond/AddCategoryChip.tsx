"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { addCategory, usePondCategories } from "@/lib/notes/categories";
import { randomUnusedFishKey } from "@/lib/notes/fish";

type AddCategoryChipProps = {
  onCreated: (id: string) => void;
  compact?: boolean;
};

export function AddCategoryChip({ onCreated, compact = false }: AddCategoryChipProps) {
  const categories = usePondCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const pad = compact ? "px-3 py-1.5" : "px-4 py-2";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function save() {
    const created = addCategory(
      name,
      randomUnusedFishKey(categories.map((item) => item.fishKey)),
    );
    if (!created) return;
    setName("");
    setOpen(false);
    onCreated(created.id);
  }

  function cancel() {
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add category"
        className={`type-label flex items-center gap-1.5 rounded-pill bg-surface-2 text-ink-soft ${pad}`}
      >
        <Icon icon="ant-design:plus" width={12} height={12} />
        add category
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-pill bg-surface-2 ${pad}`}>
      <input
        ref={inputRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="category name"
        aria-label="New category name"
        className="type-label w-32 bg-transparent text-ink outline-none placeholder:text-ink-soft"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            save();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          }
        }}
      />
      <button type="button" onClick={save} className="type-label text-accent">
        add
      </button>
    </span>
  );
}
