"use client";

import { NoteCard } from "@/components/pond/NoteCard";
import { actedOnLabel } from "@/lib/notes/fish";
import { usePondCategories } from "@/lib/notes/categories";
import type { Note } from "@/lib/notes/types";

type ActedBoardProps = {
  notes: Note[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ActedBoard({ notes, onOpen, onDelete }: ActedBoardProps) {
  const categories = usePondCategories();
  const sorted = [...notes].sort(
    (a, b) => Date.parse(b.acted_at) - Date.parse(a.acted_at),
  );

  function categoryName(cat: string) {
    return categories.find((item) => item.id === cat)?.name ?? cat;
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-auto bg-surface px-8 py-6">
      <h1 className="type-display mb-8 min-w-0 wrap-break-word [overflow-wrap:anywhere]">
        Acted
      </h1>

      {sorted.length === 0 ? (
        <p className="type-body text-ink-soft">
          Nothing acted on yet. When you solve a spark, it lands here.
        </p>
      ) : (
        <div className="grid gap-4 pb-8 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {sorted.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              showPin={false}
              meta={`${categoryName(note.cat)} · ${actedOnLabel(note.acted_at)}`}
              onOpen={() => onOpen(note.id)}
              onDelete={() => onDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
