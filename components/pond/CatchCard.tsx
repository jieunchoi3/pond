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
    <article className="h-full rounded-card border border-line bg-surface-2 px-5 py-3 pl-6">
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col text-left">
        <div className="mb-2 flex items-end gap-3">
          <Fish cat={note.cat} id={note.id} scale={0.28} />
          <h3 className="type-card-title min-w-0 flex-1 truncate">
            {note.title || "Untitled spark"}
          </h3>
        </div>
        <p className="type-card-body line-clamp-1 flex-1 text-ink-soft">
          {note.body ? clipBody(note.body) : "Empty water. Add a line."}
        </p>
        <p className="type-label mt-2 text-ink-soft">{daysLabel(note.acted_at)}</p>
      </button>
    </article>
  );
}
