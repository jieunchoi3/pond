"use client";

import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  fishFor,
  neglectScale,
  sampleFish,
} from "@/lib/notes/fish";
import type { Note } from "@/lib/notes/types";

type PondCanvasProps = {
  notes: Note[];
  canvasMode: boolean;
  onOpen: (id: string) => void;
};

type FishNode = {
  id: string;
  el: HTMLButtonElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  blur: number;
  bob: number;
  bobSpeed: number;
};

function subscribeMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function motionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PondCanvas({ notes, canvasMode, onOpen }: PondCanvasProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<FishNode[]>([]);
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const shown = useMemo(() => sampleFish(notes), [notes]);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const buttons = [...layer.querySelectorAll<HTMLButtonElement>("[data-fish]")];
    const width = layer.clientWidth;
    const height = layer.clientHeight;

    nodesRef.current = shown.map((note, index) => {
      const depth = index % 3;
      const fish = fishFor(note.cat, note.id);
      const scale =
        neglectScale(note.acted_at) * (depth === 0 ? 0.72 : depth === 1 ? 0.88 : 1);
      const span = Math.max(48, fish.width * scale);
      return {
        id: note.id,
        el: buttons.find((button) => button.dataset.id === note.id) ?? null,
        x: (index * 97) % Math.max(16, width - span),
        y: (index * 53) % Math.max(16, height - span * 0.55),
        vx: (depth === 0 ? 0.12 : depth === 1 ? 0.2 : 0.32) * (index % 2 ? 1 : -1),
        vy: (depth === 0 ? 0.06 : depth === 1 ? 0.1 : 0.16) * (index % 3 === 0 ? 1 : -1),
        scale,
        opacity: depth === 0 ? 0.45 : depth === 1 ? 0.72 : 1,
        blur: depth === 0 ? 2 : depth === 1 ? 0.6 : 0,
        bob: index,
        bobSpeed: 0.015 + depth * 0.008,
      };
    });

    function paint(node: FishNode, y = node.y) {
      if (!node.el) return;
      node.el.style.transform = `translate3d(${node.x}px, ${y}px, 0) scale(${node.scale})`;
      node.el.style.opacity = String(node.opacity);
      node.el.style.zIndex = node.blur === 0 ? "3" : node.blur < 1 ? "2" : "1";
      node.el.style.filter = node.blur
        ? `drop-shadow(var(--shadow-sm)) blur(${node.blur}px)`
        : "drop-shadow(var(--shadow-sm))";
    }

    if (reduced) {
      nodesRef.current.forEach((node) => paint(node));
      return;
    }

    let frame = 0;
    const tick = () => {
      const pondWidth = layer.clientWidth;
      const pondHeight = layer.clientHeight;
      for (const node of nodesRef.current) {
        node.x += node.vx;
        node.y += node.vy;
        const maxX = Math.max(8, pondWidth - 96);
        const maxY = Math.max(8, pondHeight - 64);
        if (node.x > maxX || node.x < 8) node.vx *= -1;
        if (node.y > maxY || node.y < 8) node.vy *= -1;
        node.bob += node.bobSpeed;
        paint(node, node.y + Math.sin(node.bob) * 6);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, reduced]);

  return (
    <section className="mt-8">
      <div
        className={`pond-water relative overflow-hidden rounded-input border border-line ${
          canvasMode ? "h-[min(72vh,720px)]" : "h-[420px]"
        }`}
      >
        <div ref={layerRef} className="absolute inset-0">
          {shown.length === 0 ? (
            <p className="type-label absolute inset-0 grid place-items-center px-6 text-center text-ink-soft">
              Empty pond. Capture a spark and a fish will appear.
            </p>
          ) : (
            shown.map((note) => {
              const fish = fishFor(note.cat, note.id);
              return (
                <button
                  key={note.id}
                  type="button"
                  data-fish
                  data-id={note.id}
                  className="pond-fish"
                  style={{ width: fish.width }}
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
      </div>
    </section>
  );
}
