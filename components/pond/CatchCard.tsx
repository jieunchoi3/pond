"use client";

import { Fish } from "@/components/pond/Fish";
import { daysLabel } from "@/lib/notes/fish";
import { categoryOf, type Note } from "@/lib/notes/types";

type CatchCardProps = {
  note: Note;
  onOpen: () => void;
};

export function CatchCard({ note, onOpen }: CatchCardProps) {
  const cat = categoryOf(note.cat);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-card border border-line bg-surface-2 p-3.5 text-left"
    >
      <div className="flex items-center gap-2">
        <Fish species={cat.species} fill={cat.fill} mark={cat.mark} scale={0.2} />
        <span className="type-caption !text-accent">{daysLabel(note.acted_at)}</span>
      </div>
      <h3 className="type-title mt-1.5">{note.title || "Untitled spark"}</h3>
      <p className="type-label mt-1 line-clamp-3 text-ink-soft">{note.body}</p>
    </button>
  );
}
