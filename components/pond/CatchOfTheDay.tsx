"use client";

import { CatchCard } from "@/components/pond/CatchCard";
import { CATCH_LIMIT, CATCH_MIN_DAYS, daysNeglected } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchOfTheDayProps = {
  notes: Note[];
  onOpen: (id: string) => void;
  onRecast: (id: string) => void;
};

export function catchOfTheDay(notes: Note[], now = Date.now()) {
  return [...notes]
    .filter((note) => daysNeglected(note.acted_at, now) >= CATCH_MIN_DAYS)
    .sort((a, b) => daysNeglected(b.acted_at, now) - daysNeglected(a.acted_at, now))
    .slice(0, CATCH_LIMIT);
}

export function CatchOfTheDay({ notes, onOpen, onRecast }: CatchOfTheDayProps) {
  const catches = catchOfTheDay(notes);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="type-display">Catch of the day</h2>
        {catches.length > 0 ? (
          <span className="type-label rounded-pill bg-accent-soft px-3 py-1 text-ink">
            recast
          </span>
        ) : null}
      </div>

      {catches.length === 0 ? (
        <p className="type-body text-ink-soft">
          Nothing older than {CATCH_MIN_DAYS} days. Let a spark sit, then recast it.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {catches.map((note) => (
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
