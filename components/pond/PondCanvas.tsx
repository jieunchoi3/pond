"use client";

import { FISH, type Note } from "@/lib/notes";

type PondCanvasProps = {
  notes: Note[];
  canvasMode: boolean;
  onOpen: (id: string) => void;
};

const SWIM: Record<
  string,
  { top: string; left: string; dur: string; delay: string; dx: string; dy: string }
> = {
  "koi-white": {
    top: "18%",
    left: "8%",
    dur: "22s",
    delay: "0s",
    dx: "12%",
    dy: "8%",
  },
  "goldfish-orange": {
    top: "58%",
    left: "18%",
    dur: "18s",
    delay: "-4s",
    dx: "10%",
    dy: "6%",
  },
  "tang-blue": {
    top: "28%",
    left: "42%",
    dur: "26s",
    delay: "-8s",
    dx: "14%",
    dy: "5%",
  },
  "betta-lilac": {
    top: "52%",
    left: "62%",
    dur: "20s",
    delay: "-2s",
    dx: "8%",
    dy: "10%",
  },
  "koi-vermilion": {
    top: "12%",
    left: "68%",
    dur: "24s",
    delay: "-6s",
    dx: "9%",
    dy: "7%",
  },
  "koi-blush": {
    top: "64%",
    left: "78%",
    dur: "19s",
    delay: "-11s",
    dx: "7%",
    dy: "8%",
  },
  "koi-calico": {
    top: "38%",
    left: "22%",
    dur: "28s",
    delay: "-9s",
    dx: "16%",
    dy: "4%",
  },
  "carp-honey": {
    top: "16%",
    left: "52%",
    dur: "17s",
    delay: "-3s",
    dx: "11%",
    dy: "9%",
  },
};

export function PondCanvas({ notes, canvasMode, onOpen }: PondCanvasProps) {
  return (
    <section className="mt-8">
      <div
        className={`pond-water relative overflow-hidden rounded-input border border-line ${
          canvasMode ? "h-[min(72vh,720px)]" : "h-[420px]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
          <div className="absolute top-8 left-12 size-40 rounded-full bg-white/50 blur-2xl" />
          <div className="absolute right-16 bottom-10 size-56 rounded-full bg-water-3/80 blur-3xl" />
        </div>

        {notes.length === 0 ? (
          <p className="type-label absolute inset-0 grid place-items-center px-6 text-center text-ink-soft">
            Empty pond. Capture a spark and a fish will appear.
          </p>
        ) : (
          notes.map((note, index) => {
            const fish = FISH[note.fish];
            const swim = SWIM[note.fish] ?? SWIM["koi-white"];
            const nudge = (index % 4) * 4;
            return (
              <button
                key={note.id}
                type="button"
                className="pond-fish cursor-pointer border-0 bg-transparent p-0"
                style={{
                  top: `calc(${swim.top} + ${nudge}%)`,
                  left: `calc(${swim.left} + ${(index % 3) * 2}%)`,
                  width: fish.width,
                  ["--dur" as string]: swim.dur,
                  ["--delay" as string]: swim.delay,
                  ["--dx" as string]: swim.dx,
                  ["--dy" as string]: swim.dy,
                }}
                onClick={() => onOpen(note.id)}
                aria-label={`${fish.species}: ${note.title || "Untitled spark"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fish.src} alt="" width={fish.width} height={Math.round(fish.width * 0.6)} />
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
