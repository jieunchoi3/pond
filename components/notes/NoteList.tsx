"use client";

import type { Note } from "@/lib/notes/types";

type NoteListProps = {
  notes: Note[];
};

function formatWhen(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "";
  return new Date(time).toLocaleString();
}

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="type-body text-ink-soft">
        Nothing in the pond yet. Capture a spark.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {notes.map((note) => (
        <li key={note.id} className="rounded-card bg-surface-2 p-4">
          <p className="type-title">{note.title || "Untitled spark"}</p>
          {note.body ? (
            <p className="type-body mt-2 text-ink-soft">{note.body}</p>
          ) : null}
          <p className="type-caption mt-3">
            {note.cat}
            {" · "}
            {formatWhen(note.created_at)}
            {note.pending ? " · syncing" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
