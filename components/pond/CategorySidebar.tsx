"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  addCategory,
  deleteCategory,
  renameCategory,
  setCategoryFish,
  usePondCategories,
} from "@/lib/notes/categories";
import { patchNotesCat } from "@/lib/notes/store";
import { FISH_SPECIES, speciesOf, unusedFishKey } from "@/lib/notes/fish";
import type { PondCategory } from "@/lib/notes/types";

const ROW = 56;
const WIDTH = 260;

export type FilterTag = "all" | string;

type CategorySidebarProps = {
  open: boolean;
  selected: FilterTag;
  narrow: boolean;
  onToggle: () => void;
  onSelect: (tag: FilterTag) => void;
};

export function CategorySidebar({
  open,
  selected,
  narrow,
  onToggle,
  onSelect,
}: CategorySidebarProps) {
  const categories = usePondCategories();
  const listRef = useRef<HTMLDivElement>(null);
  const [slotCount, setSlotCount] = useState(8);
  const [draft, setDraft] = useState<{ name: string; fishKey: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | "draft" | null>(null);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (listRef.current?.contains(target)) return;
      setPickerFor(null);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const measure = () => {
      setSlotCount(Math.max(categories.length + 1, Math.floor(node.clientHeight / ROW)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [categories.length, open, draft]);

  function startAdd() {
    setEditingId(null);
    setDraft({
      name: "",
      fishKey: unusedFishKey(categories.map((item) => item.fishKey)),
    });
    setPickerFor(null);
  }

  function saveDraft() {
    if (!draft) return;
    const created = addCategory(draft.name, draft.fishKey);
    if (!created) return;
    setDraft(null);
    onSelect(created.id);
  }

  const extras = Math.max(
    draft ? 0 : 1,
    slotCount - categories.length - (draft ? 1 : 0),
  );

  return (
    <>
      {narrow && open ? (
        <button
          type="button"
          aria-label="Close categories"
          className="absolute inset-0 z-20 bg-[rgba(31,42,40,0.28)]"
          onClick={onToggle}
        />
      ) : null}

      <aside
        className={`relative z-30 h-full shrink-0 bg-surface-2 transition-[width] duration-200 ${
          open ? "w-[260px]" : "w-0"
        } ${narrow ? "absolute inset-y-0 left-0 shadow-pond-lg" : ""}`}
      >
        <div
          className={`flex h-full flex-col overflow-hidden ${open ? "w-[260px]" : "w-0 opacity-0"}`}
          style={{ width: open ? WIDTH : 0 }}
        >
          <div className="type-label flex h-14 shrink-0 items-center border-b border-line px-5 text-ink-soft">
            category
          </div>

          <div ref={listRef} className="flex min-h-0 flex-1 flex-col overflow-auto">
            {categories.map((item) => (
              <CategoryRow
                key={item.id}
                item={item}
                selected={selected === item.id}
                editing={editingId === item.id}
                picking={pickerFor === item.id}
                onSelect={() => onSelect(item.id)}
                onEdit={() => {
                  setDraft(null);
                  setEditingId(item.id);
                  setPickerFor(null);
                }}
                onRename={(name) => {
                  const trimmed = name.trim();
                  if (!trimmed || trimmed === item.name) {
                    setEditingId(null);
                    return;
                  }
                  if (renameCategory(item.id, trimmed)) setEditingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onPickFish={() => setPickerFor(pickerFor === item.id ? null : item.id)}
                onFish={(key) => {
                  setCategoryFish(item.id, key);
                  setPickerFor(null);
                }}
                onDelete={() => {
                  const fallback = deleteCategory(item.id);
                  if (!fallback) return;
                  patchNotesCat(item.id, fallback.id);
                  if (selected === item.id) onSelect("all");
                }}
                canDelete={categories.length > 1}
              />
            ))}

            {draft ? (
              <DraftRow
                name={draft.name}
                fishKey={draft.fishKey}
                picking={pickerFor === "draft"}
                onName={(name) => setDraft({ ...draft, name })}
                onPickFish={() => setPickerFor(pickerFor === "draft" ? null : "draft")}
                onFish={(key) => {
                  setDraft({ ...draft, fishKey: key });
                  setPickerFor(null);
                }}
                onSave={saveDraft}
                onCancel={() => {
                  setDraft(null);
                  setPickerFor(null);
                }}
              />
            ) : null}

            {Array.from({ length: extras }).map((_, index) => (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={startAdd}
                aria-label="Add category"
                className="h-14 shrink-0 border-b border-line"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={open}
          aria-label={open ? "Hide categories" : "Show categories"}
          className="absolute top-1/2 right-0 z-40 flex h-[72px] w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface text-ink-soft shadow-pond-sm"
        >
          <Icon
            icon="bi:chevron-left"
            width={18}
            height={18}
            className={open ? "" : "rotate-180"}
          />
        </button>
      </aside>
    </>
  );
}

function FishThumb({ fishKey, size = 36 }: { fishKey: string; size?: number }) {
  const fish = speciesOf(fishKey);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fish.left}
      alt=""
      width={size}
      height={Math.round(size * 0.62)}
      draggable={false}
      className="pointer-events-none"
      style={{ width: size, height: "auto" }}
    />
  );
}

function FishPicker({
  current,
  onPick,
}: {
  current: string;
  onPick: (key: string) => void;
}) {
  return (
    <div className="absolute top-[calc(100%-8px)] left-3 z-50 grid w-[220px] grid-cols-4 gap-2 rounded-card border border-line bg-surface p-3 shadow-pond-lg">
      {FISH_SPECIES.map((fish) => (
        <button
          key={fish.key}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPick(fish.key);
          }}
          aria-label={fish.species}
          aria-pressed={fish.key === current}
          className={`grid h-12 place-items-center rounded-card ${
            fish.key === current ? "bg-accent-soft" : "bg-surface-2"
          }`}
        >
          <FishThumb fishKey={fish.key} size={32} />
        </button>
      ))}
    </div>
  );
}

function CategoryRow({
  item,
  selected,
  editing,
  picking,
  canDelete,
  onSelect,
  onEdit,
  onRename,
  onCancelEdit,
  onPickFish,
  onFish,
  onDelete,
}: {
  item: PondCategory;
  selected: boolean;
  editing: boolean;
  picking: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRename: (name: string) => void;
  onCancelEdit: () => void;
  onPickFish: () => void;
  onFish: (key: string) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      className={`group relative flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 ${
        selected ? "bg-surface" : ""
      }`}
    >
      <button
        type="button"
        onClick={onPickFish}
        aria-label={`Change fish for ${item.name}`}
        className="grid size-10 shrink-0 place-items-center"
      >
        <FishThumb fishKey={item.fishKey} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          defaultValue={item.name}
          aria-label="Category name"
          className="type-label min-w-0 flex-1 bg-transparent text-ink outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") onRename(event.currentTarget.value);
            if (event.key === "Escape") onCancelEdit();
          }}
          onBlur={(event) => onRename(event.currentTarget.value)}
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={onEdit}
          className="type-label min-w-0 flex-1 truncate text-left text-ink"
        >
          {item.name}
        </button>
      )}

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Rename ${item.name}`}
        className="grid size-8 shrink-0 place-items-center text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        <Icon icon="bi:pencil" width={14} />
      </button>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.name}`}
          className="grid size-8 shrink-0 place-items-center text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      ) : null}

      {picking ? <FishPicker current={item.fishKey} onPick={onFish} /> : null}
    </div>
  );
}

function DraftRow({
  name,
  fishKey,
  picking,
  onName,
  onPickFish,
  onFish,
  onSave,
  onCancel,
}: {
  name: string;
  fishKey: string;
  picking: boolean;
  onName: (name: string) => void;
  onPickFish: () => void;
  onFish: (key: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      <button
        type="button"
        onClick={onPickFish}
        aria-label="Choose a fish"
        className="grid size-10 shrink-0 place-items-center"
      >
        <FishThumb fishKey={fishKey} />
      </button>
      <input
        ref={inputRef}
        value={name}
        onChange={(event) => onName(event.target.value)}
        placeholder="new category"
        aria-label="New category name"
        className="type-label min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-soft"
        onKeyDown={(event) => {
          if (event.key === "Enter") onSave();
          if (event.key === "Escape") onCancel();
        }}
      />
      <button type="button" onClick={onCancel} className="type-label px-1 text-ink-soft">
        ×
      </button>
      {picking ? <FishPicker current={fishKey} onPick={onFish} /> : null}
    </div>
  );
}
