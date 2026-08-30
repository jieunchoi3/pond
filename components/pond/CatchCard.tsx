"use client";

import { Fish } from "@/components/pond/Fish";
import { clipBody, daysLabel } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchCardProps = {
  note: Note;
  onOpen: () => void;
};

export function CatchCard({ note, onOpen }: CatchCardProps) {
  return (
    <article className="h-full rounded-card border border-line bg-surface-2 p-4">
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col text-left">
        <div className="mb-3 flex items-end gap-3">
          <Fish cat={note.cat} id={note.id} scale={0.28} />
          <h3 className="type-title min-w-0 flex-1 truncate">
            {note.title || "Untitled spark"}
          </h3>
        </div>
        <p className="type-body line-clamp-2 flex-1 text-ink-soft">
          {note.body ? clipBody(note.body) : "Empty water. Add a line."}
        </p>
        <p className="type-caption mt-3">{daysLabel(note.acted_at)}</p>
      </button>
    </article>
  );
}
