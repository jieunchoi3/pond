"use client";

import { CatchCard } from "@/components/pond/CatchCard";
import { catchOfTheDay } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type CatchOfTheDayProps = {
  notes: Note[];
  visible: Set<string>;
  seed: number;
  narrow: boolean;
  onOpen: (id: string) => void;
  onRecast: () => void;
};

export function CatchOfTheDay({
  notes,
  visible,
  seed,
  narrow,
  onOpen,
  onRecast,
}: CatchOfTheDayProps) {
  const daily = catchOfTheDay(notes, visible, seed, narrow ? 2 : 4);

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-pond-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className={`type-display ${narrow ? "text-[length:var(--text-title)]" : ""}`}>
          Catch of the day
        </h2>
        <button
          type="button"
          onClick={onRecast}
          className="type-label rounded-pill bg-accent-soft px-5 py-2 text-ink"
        >
          recast
        </button>
      </div>
      {daily.length ? (
        <div
          className="grid gap-4 p-4"
          style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))` }}
        >
          {daily.map((note) => (
            <CatchCard key={note.id} note={note} onOpen={() => onOpen(note.id)} />
          ))}
        </div>
      ) : (
        <p className="type-label p-5 text-ink-soft">
          Nothing has been down there long enough. Come back in a week.
        </p>
      )}
    </section>
  );
}
