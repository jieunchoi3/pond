"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  addCategory,
  deleteCategory,
  renameCategory,
  setCategoryFish,
  usePondCategories,
} from "@/lib/notes/categories";
import { matchesQuery, unusedFishKey, randomUnusedFishKey } from "@/lib/notes/fish";
import { FishInventory, FishThumb } from "@/components/pond/FishInventory";
import { patchNotesCat } from "@/lib/notes/store";
import { actedNotes, isOpenNote, type Note, type PondCategory } from "@/lib/notes/types";

const WIDTH = 280;
const COLLAPSE_KEY = "pond.sidebar.collapsed.v1";

function readCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COLLAPSE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeCollapsed(ids: Set<string>) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode can block storage.
  }
}

export type FilterTag = "all" | "acted" | string;

type CategorySidebarProps = {
  open: boolean;
  selected: FilterTag;
  editingId: string | null;
  notes: Note[];
  query: string;
  narrow: boolean;
  onToggle: () => void;
  onSelect: (tag: FilterTag) => void;
  onOpenNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (cat: string) => void;
};

export function CategorySidebar({
  open,
  selected,
  editingId,
  notes,
  query,
  narrow,
  onToggle,
  onSelect,
  onOpenNote,
  onDeleteNote,
  onAddNote,
}: CategorySidebarProps) {
  const categories = usePondCategories();
  const [draft, setDraft] = useState<{ name: string; fishKey: string } | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const grouped = useMemo(() => {
    return categories.map((item) => ({
      item,
      notes: notes.filter(
        (note) =>
          isOpenNote(note) &&
          note.cat === item.id &&
          matchesQuery(note.title, note.body, note.cat, query),
      ),
    }));
  }, [categories, notes, query]);

  const actedCount = useMemo(() => actedNotes(notes).length, [notes]);

  const searching = query.trim().length > 0;

  useEffect(() => {
    if (!editingId) return;
    const note = notes.find((item) => item.id === editingId);
    if (!note) return;
    setCollapsed((prev) => {
      if (!prev.has(note.cat)) return prev;
      const next = new Set(prev);
      next.delete(note.cat);
      writeCollapsed(next);
      return next;
    });
  }, [editingId, notes]);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeCollapsed(next);
      return next;
    });
  }

  function startAdd() {
    setEditingCat(null);
    setDraft({
      name: "",
      fishKey: randomUnusedFishKey(categories.map((item) => item.fishKey)),
    });
  }

  function saveDraft() {
    if (!draft) return;
    const created = addCategory(draft.name, draft.fishKey);
    if (!created) return;
    setDraft(null);
    onSelect(created.id);
  }

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
        className={`relative z-30 h-full bg-surface-2 transition-[width] duration-200 ${
          open ? "w-[280px] shrink-0" : "w-0 min-w-0 shrink-0"
        } ${narrow ? "absolute inset-y-0 left-0 shadow-pond-lg" : ""}`}
      >
        <div
          className={`flex h-full flex-col overflow-hidden ${open ? "" : "opacity-0"}`}
          style={{ width: open ? WIDTH : 0 }}
        >
          <div className="type-label flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-4 text-ink-soft">
            <span>category</span>
            <button
              type="button"
              onClick={startAdd}
              aria-label="Add category"
              className="grid size-8 place-items-center rounded-pill text-ink"
            >
              <Icon icon="ant-design:plus" width={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelect("acted")}
            aria-pressed={selected === "acted"}
            className={`flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 text-left ${
              selected === "acted" ? "bg-surface" : ""
            }`}
          >
            <span className="grid size-10 shrink-0 place-items-center text-accent">
              <Icon icon="bi:check2-circle" width={22} height={22} />
            </span>
            <span className="type-label min-w-0 flex-1 text-ink">Acted</span>
            {actedCount > 0 ? (
              <span className="type-label shrink-0 text-ink-soft">{actedCount}</span>
            ) : null}
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {grouped.map(({ item, notes: sparks }) => {
              const expanded = searching || !collapsed.has(item.id);
              return (
              <section key={item.id} className="border-b border-line">
                <CategoryRow
                  item={item}
                  selected={selected === item.id}
                  editing={editingCat === item.id}
                  expanded={expanded}
                  sparkCount={sparks.length}
                  onSelect={() => onSelect(item.id)}
                  onToggleExpand={() => toggleCollapsed(item.id)}
                  onEdit={() => {
                    setDraft(null);
                    setEditingCat(item.id);
                  }}
                  onRename={(name) => {
                    const trimmed = name.trim();
                    if (!trimmed || trimmed === item.name) {
                      setEditingCat(null);
                      return;
                    }
                    if (renameCategory(item.id, trimmed)) setEditingCat(null);
                  }}
                  onCancelEdit={() => setEditingCat(null)}
                  onFish={(key) => setCategoryFish(item.id, key)}
                  onDelete={() => {
                    const fallback = deleteCategory(item.id);
                    if (!fallback) return;
                    patchNotesCat(item.id, fallback.id);
                    if (selected === item.id) onSelect("all");
                  }}
                  canDelete={categories.length > 1}
                />
                {expanded
                  ? sparks.map((note) => {
                      const active = note.id === editingId;
                      return (
                        <div
                          key={note.id}
                          className={`group flex items-center gap-1 pl-12 pr-3 ${
                            active ? "bg-surface" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenNote(note.id)}
                            className={`type-label min-w-0 flex-1 truncate py-2 text-left ${
                              active ? "text-ink" : "text-ink-soft"
                            }`}
                          >
                            {note.title || "Untitled spark"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            aria-label={`Delete ${note.title || "Untitled spark"}`}
                            className="grid size-8 shrink-0 place-items-center text-[#C4473A] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          >
                            <Icon icon="bi:trash3" width={14} height={14} />
                          </button>
                        </div>
                      );
                    })
                  : null}
                <button
                  type="button"
                  onClick={() => onAddNote(item.id)}
                  className="type-label flex min-h-11 w-full items-center gap-2 py-2 pr-3 pl-14 text-left text-ink-soft"
                >
                  <Icon icon="ant-design:plus" width={12} height={12} />
                  add spark
                </button>
              </section>
              );
            })}

            {draft ? (
              <DraftRow
                name={draft.name}
                fishKey={draft.fishKey}
                onName={(name) => setDraft({ ...draft, name })}
                onFish={(key) => setDraft({ ...draft, fishKey: key })}
                onSave={saveDraft}
                onCancel={() => setDraft(null)}
              />
            ) : (
              <button
                type="button"
                onClick={startAdd}
                className="type-label flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 text-left text-ink-soft"
              >
                <span className="grid size-10 shrink-0 place-items-center">
                  <FishThumb
                    fishKey={unusedFishKey(categories.map((item) => item.fishKey))}
                  />
                </span>
                add category
              </button>
            )}

            <button
              type="button"
              onClick={startAdd}
              aria-label="Add category"
              className="min-h-14 flex-1"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={open}
          aria-label={open ? "Hide categories" : "Show categories"}
          className="pointer-events-auto absolute top-1/2 right-0 z-40 flex h-[72px] w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface text-ink-soft shadow-pond-sm"
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

function CategoryRow({
  item,
  selected,
  editing,
  expanded,
  sparkCount,
  canDelete,
  onSelect,
  onToggleExpand,
  onEdit,
  onRename,
  onCancelEdit,
  onFish,
  onDelete,
}: {
  item: PondCategory;
  selected: boolean;
  editing: boolean;
  expanded: boolean;
  sparkCount: number;
  canDelete: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRename: (name: string) => void;
  onCancelEdit: () => void;
  onFish: (key: string) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      className={`group relative flex h-14 items-center gap-3 px-4 ${
        selected ? "bg-surface" : ""
      }`}
    >
      <FishInventory
        current={item.fishKey}
        label={`Change fish for ${item.name}`}
        onPick={onFish}
      />

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

      {sparkCount > 0 && !expanded ? (
        <span className="type-label shrink-0 text-ink-soft">{sparkCount}</span>
      ) : null}

      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
        onClick={onToggleExpand}
        className="grid size-8 shrink-0 place-items-center text-ink-soft"
      >
        <Icon
          icon="bi:chevron-down"
          width={14}
          height={14}
          className={expanded ? "" : "-rotate-90"}
        />
      </button>

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
    </div>
  );
}

function DraftRow({
  name,
  fishKey,
  onName,
  onFish,
  onSave,
  onCancel,
}: {
  name: string;
  fishKey: string;
  onName: (name: string) => void;
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
      <FishInventory current={fishKey} label="Choose a fish" onPick={onFish} />
      <input
        ref={inputRef}
        value={name}
        onChange={(event) => onName(event.target.value)}
        placeholder="category name"
        aria-label="New category name"
        className="type-label min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-soft"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          }
        }}
      />
      <button type="button" onClick={onSave} className="type-label shrink-0 text-accent">
        add
      </button>
      <button type="button" onClick={onCancel} className="type-label px-1 text-ink-soft">
        ×
      </button>
    </div>
  );
}
