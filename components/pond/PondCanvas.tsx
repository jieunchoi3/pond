"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CaptureButton } from "@/components/capture/CaptureButton";
import { Fish } from "@/components/pond/Fish";
import { LilyPads } from "@/components/pond/LilyPads";
import { catOf, hasBoard, layerOf, sizeOf } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type PondCanvasProps = {
  notes: Note[];
  visible: Set<string>;
  onOpen: (id: string) => void;
  onRecast: () => void;
  onCapture: () => void;
};

type Motion = {
  x: number;
  y: number;
  dir: number;
  speed: number;
  phase: number;
  bob: number;
};

type Ripple = { id: number; x: number; y: number };

export function PondCanvas({ notes, visible, onOpen, onRecast, onCapture }: PondCanvasProps) {
  const pondRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLButtonElement | null>>({});
  const motion = useRef<Record<string, Motion>>({});
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    notes.forEach((note, index) => {
      if (motion.current[note.id]) return;
      const layer = layerOf(note.id);
      motion.current[note.id] = {
        x: (index * 37) % 100,
        y: 12 + ((index * 53) % 74),
        dir: index % 2 ? 1 : -1,
        speed: (0.55 + ((index * 7) % 10) / 22) * layer.speed,
        phase: (index * 1.7) % 6.283,
        bob: 1.2 + ((index * 3) % 5) / 3,
      };
    });

    let raf = 0;
    let last = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (t: number) => {
      const dt = Math.min(t - last, 50) / 1000;
      last = t;
      for (const id of Object.keys(motion.current)) {
        const m = motion.current[id];
        const el = nodes.current[id];
        if (!el) continue;
        if (!reduce) {
          m.x += m.dir * m.speed * dt;
          if (m.x > 114) m.x = -14;
          if (m.x < -14) m.x = 114;
        }
        el.style.left = `${m.x}%`;
        el.style.top = `${m.y + (reduce ? 0 : Math.sin(t / 1500 + m.phase) * m.bob)}%`;
        el.style.transform = `translate(-50%, -50%) scaleX(${m.dir})`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [notes]);

  function tapWater(event: MouseEvent<HTMLDivElement>) {
    const pond = pondRef.current;
    if (!pond) return;
    const box = pond.getBoundingClientRect();
    const id = Math.random();
    setRipples((list) => [...list, { id, x: event.clientX - box.left, y: event.clientY - box.top }]);
    window.setTimeout(() => {
      setRipples((list) => list.filter((ripple) => ripple.id !== id));
    }, 900);
    onRecast();
  }

  return (
    <div
      ref={pondRef}
      onClick={tapWater}
      className="pond-water relative min-h-0 flex-1 overflow-hidden rounded-card"
    >
      <LilyPads />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pond-ripple pointer-events-none absolute size-14 animate-ping rounded-pill"
          style={{ left: ripple.x - 28, top: ripple.y - 28 }}
        />
      ))}
      {notes.map((note) => {
        const cat = catOf(note.cat);
        const dim = !visible.has(note.id);
        return (
          <button
            key={note.id}
            ref={(el) => {
              nodes.current[note.id] = el;
            }}
            type="button"
            className="pond-fish"
            style={{ pointerEvents: dim ? "none" : "auto" }}
            onClick={(event) => {
              event.stopPropagation();
              if (!dim) onOpen(note.id);
            }}
            aria-label={note.title || "Untitled spark"}
          >
            <span className="relative block">
              <Fish
                species={cat.species}
                fill={cat.fill}
                mark={cat.mark}
                scale={sizeOf(note.acted_at)}
                dim={dim}
                layer={layerOf(note.id)}
              />
              {hasBoard(note) && !dim ? (
                <span className="absolute top-[-5px] right-1.5 size-1.5 rounded-pill bg-surface" />
              ) : null}
            </span>
          </button>
        );
      })}
      <CaptureButton
        className="absolute right-6 bottom-6 z-10"
        onClick={(event) => {
          event.stopPropagation();
          onCapture();
        }}
      />
      <p className="type-caption pointer-events-none absolute bottom-8 left-6">
        TAP THE WATER TO RECAST
      </p>
    </div>
  );
}
