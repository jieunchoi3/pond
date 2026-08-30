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
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="type-display">Catch of the day</h2>
        {daily.length > 0 ? (
          <button
            type="button"
            onClick={() => daily.forEach((note) => onRecast(note.id))}
            className="type-label rounded-pill bg-accent-soft px-4 py-2 text-ink"
          >
            recast
          </button>
        ) : null}
      </div>
      {daily.length === 0 ? (
        <p className="type-body text-ink-soft">
          Nothing older than {CATCH_MIN_DAYS} days. Let a spark sit, then recast it.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {daily.map((note) => (
            <CatchCard
              key={note.id}
              note={note}
              onOpen={() => onOpen(note.id)}
              onRecast={() => onRecast(note.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
