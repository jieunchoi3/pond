"use client";

import { Fish } from "@/components/pond/Fish";
import { clipBody, daysLabel } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchCardProps = {
  note: Note;
  onOpen: () => void;
  onRecast: () => void;
};

export function CatchCard({ note, onOpen, onRecast }: CatchCardProps) {
  return (
    <article className="flex h-full flex-col rounded-card border border-line bg-surface-2 p-4">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className="mb-2 flex items-center gap-2">
          <Fish cat={note.cat} id={note.id} scale={0.45} />
        </div>
        <h3 className="type-title">{note.title || "Untitled spark"}</h3>
        <p className="type-body mt-2 flex-1 text-ink-soft">
          {note.body ? clipBody(note.body) : "Empty water. Add a line."}
        </p>
      </button>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="type-caption">{daysLabel(note.acted_at)}</p>
        <button
          type="button"
          onClick={onRecast}
          className="type-label rounded-pill bg-accent-soft px-3 py-1 text-ink"
        >
          recast
        </button>
      </div>
    </article>
  );
}
