"use client";

import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import type { Note } from "@/lib/notes/types";

type NoteCardProps = {
  note: Note;
  pinned: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
};

export function NoteCard({ note, pinned, onOpen, onDelete, onTogglePin }: NoteCardProps) {
  return (
    <article className="group relative flex min-h-[148px] flex-col rounded-card bg-surface-2 px-4 py-3">
      <div className="absolute top-2 right-2 z-10 flex gap-0.5">
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={pinned ? `Unpin ${note.title || "Untitled spark"}` : `Pin ${note.title || "Untitled spark"}`}
          aria-pressed={pinned}
          className={`grid size-8 place-items-center transition-opacity ${
            pinned ? "text-accent opacity-100" : "text-ink-soft opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        >
          <Icon icon={pinned ? "bi:pin-angle-fill" : "bi:pin-angle"} width={14} height={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${note.title || "Untitled spark"}`}
          className="grid size-8 place-items-center text-[#C4473A] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <Icon icon="bi:trash3" width={14} height={14} />
        </button>
      </div>
      <button type="button" onClick={onOpen} className="flex min-h-0 flex-1 flex-col text-left">
        <div className="mb-2 flex items-center gap-2 pr-16">
          <Fish cat={note.cat} id={note.id} scale={0.22} />
          <h3 className="type-card-title min-w-0 flex-1 truncate">
            {note.title || "Untitled spark"}
          </h3>
        </div>
        <p className="type-card-body line-clamp-3 text-ink-soft">
          {note.body.trim() || "Empty water. Add a line."}
        </p>
      </button>
    </article>
  );
}
