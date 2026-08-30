"use client";

import { CatchCard } from "@/components/pond/CatchCard";
import type { Note } from "@/lib/notes";

type CatchOfTheDayProps = {
  notes: Note[];
  recastCount: number;
  query: string;
  onOpen: (id: string) => void;
  onCapture: () => void;
};

export function CatchOfTheDay({
  notes,
  recastCount,
  query,
  onOpen,
  onCapture,
}: CatchOfTheDayProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="type-display">Catch of the day</h2>
        {recastCount > 0 ? (
          <span className="type-label rounded-pill bg-koi-soft px-3 py-1 text-ink">
            recast
          </span>
        ) : null}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-card border border-line bg-surface-2 px-6 py-12 text-center">
          <p className="type-title">Nothing swimming here</p>
          <p className="type-body mt-2 text-ink-soft">
            {query
              ? "Try another word, or throw a new spark in."
              : "The pond is quiet. Capture something before it sinks."}
          </p>
          <button
            type="button"
            onClick={onCapture}
            className="type-label mt-6 rounded-pill bg-koi px-5 py-2 text-white"
          >
            Capture a spark
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {notes.map((note) => (
            <CatchCard key={note.id} note={note} onOpen={() => onOpen(note.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
