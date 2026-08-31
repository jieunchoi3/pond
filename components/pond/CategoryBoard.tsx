"use client";

import { CaptureButton } from "@/components/capture/CaptureButton";
import { NoteCard } from "@/components/pond/NoteCard";
import type { Note, PondCategory } from "@/lib/notes/types";

type CategoryBoardProps = {
  category: PondCategory;
  notes: Note[];
  pinnedIds: string[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCapture: () => void;
};

export function CategoryBoard({
  category,
  notes,
  pinnedIds,
  onOpen,
  onDelete,
  onTogglePin,
  onCapture,
}: CategoryBoardProps) {
  const pinned = notes.filter((note) => pinnedIds.includes(note.id));

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-auto bg-surface px-8 py-6">
      <h1 className="type-display mb-8 min-w-0 wrap-break-word [overflow-wrap:anywhere]">
        {category.name}
      </h1>

      <section className="mb-8">
        <h2 className="type-label mb-4 text-ink-soft">pinned notes</h2>
        {pinned.length === 0 ? (
          <p className="type-card-body text-ink-soft">
            Nothing pinned. Hover a spark and pin it to keep it at the surface.
          </p>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                pinned
                onOpen={() => onOpen(note.id)}
                onDelete={() => onDelete(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="min-h-0 flex-1 pb-24">
        <h2 className="type-label mb-4 text-ink-soft">all notes</h2>
        {notes.length === 0 ? (
          <p className="type-card-body text-ink-soft">No sparks in this pond yet.</p>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                pinned={pinnedIds.includes(note.id)}
                onOpen={() => onOpen(note.id)}
                onDelete={() => onDelete(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
              />
            ))}
          </div>
        )}
      </section>

      <CaptureButton className="absolute right-6 bottom-6 z-10" onClick={onCapture} />
    </div>
  );
}
