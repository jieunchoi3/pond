"use client";

import { clipBody, daysLabel, type Note } from "@/lib/notes";

type CatchCardProps = {
  note: Note;
  onOpen: () => void;
};

export function CatchCard({ note, onOpen }: CatchCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full flex-col rounded-card border border-line bg-surface-2 p-4 text-left shadow-pond-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="type-title min-w-0">{note.title || "Untitled spark"}</h3>
        {note.recast ? (
          <span className="type-caption shrink-0 rounded-pill bg-koi-soft px-2 py-0.5 text-ink">
            recast
          </span>
        ) : null}
      </div>
      <p className="type-body flex-1 text-ink-soft">
        {note.body ? clipBody(note.body) : "Empty water. Add a line."}
      </p>
      <p className="type-caption mt-4">{daysLabel(note.daysUntouched)}</p>
    </button>
  );
}
