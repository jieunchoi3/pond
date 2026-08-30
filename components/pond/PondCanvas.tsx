"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { CaptureButton } from "@/components/capture/CaptureButton";
import { Fish } from "@/components/pond/Fish";
import { LilyPads } from "@/components/pond/LilyPads";
import { fishFor, hasBoard, layerOf, neglectScale, sampleFish } from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type PondCanvasProps = {
  notes: Note[];
  visible: Set<string>;
  canvasMode: boolean;
  onOpen: (id: string) => void;
  onRecast: () => void;
  onCapture: () => void;
};

type Motion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  blur: number;
  bob: number;
};

type Ripple = { id: number; x: number; y: number };

export function PondCanvas({
  notes,
  visible,
  canvasMode,
  onOpen,
  onRecast,
  onCapture,
}: PondCanvasProps) {
  const pondRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLButtonElement | null>>({});
  const motion = useRef<Record<string, Motion>>({});
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const shown = useMemo(() => sampleFish(notes), [notes]);

  useEffect(() => {
    shown.forEach((note, index) => {
      const layer = layerOf(note.id);
      const scale = neglectScale(note.acted_at) * layer.k;
      motion.current[note.id] = {
        x: (index * 37) % 100,
        y: 12 + ((index * 53) % 74),
        vx: (0.012 + ((index * 7) % 10) / 400) * layer.speed * (index % 2 ? 1 : -1),
        vy: (0.006 + ((index * 3) % 7) / 500) * layer.speed * (index % 3 === 0 ? 1 : -1),
        scale,
        opacity: layer.o,
        blur: layer.blur,
        bob: 0,
      };
    });

    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paint(id: string, y: number) {
      const m = motion.current[id];
      const el = nodes.current[id];
      if (!m || !el) return;
      el.style.transform = `translate3d(${m.x}%, ${y}%, 0) scale(${m.scale})`;
      el.style.opacity = String(m.opacity);
      el.style.filter = m.blur
        ? `drop-shadow(var(--shadow-sm)) blur(${m.blur}px)`
        : "drop-shadow(var(--shadow-sm))";
    }

    if (reduce) {
      for (const note of shown) {
        const m = motion.current[note.id];
        if (m) paint(note.id, m.y);
      }
      return;
    }

    const tick = () => {
      for (const note of shown) {
        const m = motion.current[note.id];
        if (!m) continue;
        m.x += m.vx;
        m.y += m.vy;
        if (m.x > 88 || m.x < 2) m.vx *= -1;
        if (m.y > 82 || m.y < 4) m.vy *= -1;
        m.bob += 0.02;
        paint(note.id, m.y + Math.sin(m.bob) * 1.2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown]);

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
      className={`pond-water relative overflow-hidden rounded-card ${
        canvasMode ? "min-h-[min(72vh,720px)] flex-1" : "min-h-[280px] flex-1"
      }`}
    >
      <LilyPads />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute size-14 animate-ping rounded-pill border border-surface/90"
          style={{ left: ripple.x - 28, top: ripple.y - 28 }}
        />
      ))}
      {shown.map((note) => {
        const fish = fishFor(note.cat, note.id);
        const dim = !visible.has(note.id);
        return (
          <button
            key={note.id}
            ref={(el) => {
              nodes.current[note.id] = el;
            }}
            type="button"
            className="pond-fish"
            style={{ width: fish.width, pointerEvents: dim ? "none" : "auto" }}
            onClick={(event) => {
              event.stopPropagation();
              if (!dim) onOpen(note.id);
            }}
            aria-label={`${fish.species}: ${note.title || "Untitled spark"}`}
          >
            <span className="relative block">
              <Fish cat={note.cat} id={note.id} dim={dim} layer={layerOf(note.id)} />
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
    </div>
  );
}
