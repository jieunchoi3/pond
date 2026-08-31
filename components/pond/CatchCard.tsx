"use client";

import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import { clipBody, daysLabel } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchCardProps = {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
};

export function CatchCard({ note, onOpen, onDelete }: CatchCardProps) {
  return (
    <article className="group relative h-full min-w-0 overflow-hidden rounded-card border border-line bg-surface-2 px-5 py-3 pl-6">
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${note.title || "Untitled spark"}`}
        className="absolute top-2 right-2 z-10 grid size-8 place-items-center text-[#C4473A] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        <Icon icon="bi:trash3" width={14} height={14} />
      </button>
      <button type="button" onClick={onOpen} className="flex h-full min-w-0 w-full flex-col text-left">
        <div className="mb-2 flex min-w-0 items-start gap-3">
          <span className="mt-0.5 shrink-0">
            <Fish cat={note.cat} id={note.id} scale={0.28} />
          </span>
          <h3 className="type-card-title min-w-0 flex-1 wrap-break-word [overflow-wrap:anywhere] line-clamp-2">
            {note.title || "Untitled spark"}
          </h3>
        </div>
        <p className="type-card-body min-w-0 wrap-break-word [overflow-wrap:anywhere] line-clamp-2 flex-1 text-ink-soft">
          {note.body ? clipBody(note.body) : "Empty water. Add a line."}
        </p>
        <p className="type-label mt-2 text-ink-soft">{daysLabel(note.acted_at)}</p>
      </button>
    </article>
  );
}
