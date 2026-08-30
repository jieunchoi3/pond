"use client";

import { CatchCard } from "@/components/pond/CatchCard";
import { CATCH_MIN_DAYS, catchOfTheDay } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchOfTheDayProps = {
  notes: Note[];
  onOpen: (id: string) => void;
  onRecast: (id: string) => void;
};

export function CatchOfTheDay({ notes, onOpen, onRecast }: CatchOfTheDayProps) {
  const daily = catchOfTheDay(notes);

  return (
    <section className="w-full overflow-hidden rounded-card bg-surface shadow-pond-sm">
      <div className="flex items-center gap-3 border-b border-line px-5 py-2">
        <h2 className="type-display min-w-0 flex-1">Catch of the day</h2>
        {daily.length > 0 ? (
          <button
            type="button"
            onClick={() => daily.forEach((note) => onRecast(note.id))}
            className="type-label h-8 shrink-0 rounded-pill bg-accent-soft px-4 text-ink"
          >
            recast
          </button>
        ) : null}
      </div>
      {daily.length === 0 ? (
        <p className="type-card-body px-5 py-4 text-ink-soft">
          Nothing older than {CATCH_MIN_DAYS} days. Let a spark sit, then recast it.
        </p>
      ) : (
        <div className="grid w-full gap-3 p-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {daily.map((note) => (
            <CatchCard key={note.id} note={note} onOpen={() => onOpen(note.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
