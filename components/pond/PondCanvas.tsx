"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { CaptureButton } from "@/components/capture/CaptureButton";
import {
  ALL_FISH_SRCS,
  fishFor,
  hasBoard,
  layerOf,
  neglectScale,
  sampleFish,
} from "@/lib/notes/fish";
import { usePondCategories } from "@/lib/notes/categories";
import type { Note } from "@/lib/notes/types";

type PondCanvasProps = {
  notes: Note[];
  visible: Set<string>;
  onOpen: (id: string) => void;
  onCapture: () => void;
};

type Facing = "left" | "right";

type Swim = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  cruiseSpeed: number;
  wanderPhase: number;
  facing: Facing;
  scale: number;
  k: number;
  o: number;
  blur: number;
  nextBurst: number;
  width: number;
  left: string;
  right: string;
  placed: boolean;
};

type Ripple = { id: number; x: number; y: number };

const MAX_DT = 0.05;
const TURN_RATE = 1.8;
const FACE_HYSTERESIS = 0.08;
const BURST_MULT = 1.7;
const GLIDE = 1.5;
const BASE_MARGIN = 120;
const MARGIN_REF_WIDTH = 160;
const ASPECT = 0.55;

function shortestDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function lerpAngle(from: number, to: number, t: number) {
  return from + shortestDelta(from, to) * t;
}

function edgeForce(dist: number, margin: number) {
  if (dist >= margin) return 0;
  return (margin - Math.max(dist, 0)) / margin;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

function wrapAngle(theta: number) {
  return Math.atan2(Math.sin(theta), Math.cos(theta));
}

export function PondCanvas({ notes, visible, onOpen, onCapture }: PondCanvasProps) {
  const pondRef = useRef<HTMLDivElement>(null);
  const categories = usePondCategories();
  const fishRev = categories.map((item) => `${item.id}:${item.fishKey}`).join("|");
  const nodes = useRef<Record<string, HTMLButtonElement | null>>({});
  const imgs = useRef<Record<string, HTMLImageElement | null>>({});
  const swim = useRef<Record<string, Swim>>({});
  const shown = useMemo(() => sampleFish(notes), [notes]);
  const shownRef = useRef(shown);
  const visibleRef = useRef(visible);
  const bounds = useRef({ w: 0, h: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    for (const src of ALL_FISH_SRCS) {
      const image = new Image();
      image.src = src;
    }
  }, []);

  useLayoutEffect(() => {
    const pond = pondRef.current;
    if (!pond) return;

    const ids = new Set(shown.map((note) => note.id));
    for (const id of Object.keys(swim.current)) {
      if (!ids.has(id)) delete swim.current[id];
    }

    shown.forEach((note, index) => {
      const layer = layerOf(note.id);
      const fish = fishFor(note.cat, note.id);
      const scale = neglectScale(note.acted_at);
      const cruiseSpeed = ((36 + (index * 13) % 28) * layer.speed) / scale;
      const existing = swim.current[note.id];
      if (existing) {
        existing.scale = scale;
        existing.k = layer.k;
        existing.o = layer.o;
        existing.blur = layer.blur;
        existing.cruiseSpeed = cruiseSpeed;
        existing.width = fish.width;
        existing.left = fish.left;
        existing.right = fish.right;
        return;
      }
      const heading = ((index * 2.399) % (Math.PI * 2)) - Math.PI;
      swim.current[note.id] = {
        x: 0,
        y: 0,
        heading,
        speed: cruiseSpeed,
        cruiseSpeed,
        wanderPhase: (index * 1.7) % (Math.PI * 2),
        facing: Math.cos(heading) >= 0 ? "right" : "left",
        scale,
        k: layer.k,
        o: layer.o,
        blur: layer.blur,
        nextBurst: performance.now() + 2000 + Math.random() * 3000,
        width: fish.width,
        left: fish.left,
        right: fish.right,
        placed: false,
      };
    });

    function measure() {
      const box = pondRef.current?.getBoundingClientRect();
      if (!box) return;
      bounds.current = { w: box.width, h: box.height };
    }

    function seed(m: Swim, index: number, w: number, h: number) {
      const size = m.scale * m.k;
      const visW = m.width * size;
      const visH = m.width * ASPECT * size;
      const padX = Math.max(24, visW * 0.6);
      const padY = Math.max(24, visH * 0.6);
      const spanX = Math.max(1, w - padX * 2);
      const spanY = Math.max(1, h - padY * 2);
      m.x = padX + ((index * 97) % spanX);
      m.y = padY + ((index * 61) % spanY);
      m.placed = true;
    }

    function clampToPond(m: Swim, w: number, h: number) {
      const size = m.scale * m.k;
      const hw = (m.width * size) / 2;
      const hh = (m.width * ASPECT * size) / 2;
      m.x = clamp(m.x, hw + 2, w - hw - 2);
      m.y = clamp(m.y, hh + 2, h - hh - 2);
    }

    function paint(m: Swim, el: HTMLButtonElement, img: HTMLImageElement | null, t: number, reduce: boolean) {
      const size = m.scale * m.k;
      const layoutW = m.width;
      const layoutH = img?.offsetHeight || layoutW * ASPECT;
      const left = m.x - layoutW / 2;
      const top = m.y - layoutH / 2;
      const foreshorten = Math.max(0.15, Math.abs(Math.cos(m.heading)));
      const bank = Math.sin(m.heading) * 12;
      const tail = reduce ? 0 : Math.sin(t * 0.012 * (m.speed / 45) + m.wanderPhase) * 2;
      el.style.transform = `translate(${left}px, ${top}px) rotate(${bank + tail}deg) scaleX(${foreshorten}) scale(${size})`;
      el.style.opacity = visibleRef.current.has(el.dataset.noteId ?? "") ? String(m.o) : "0.1";
      el.style.filter = m.blur
        ? `drop-shadow(var(--shadow-sm)) blur(${m.blur}px)`
        : "drop-shadow(var(--shadow-sm))";
      el.style.zIndex = String(Math.round(m.k * 3));
      const src = m.facing === "left" ? m.left : m.right;
      if (img && img.getAttribute("src") !== src) img.src = src;
    }

    let raf = 0;
    let last = performance.now();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motionQuery.matches;
    const onMotion = () => {
      reduce = motionQuery.matches;
    };
    motionQuery.addEventListener("change", onMotion);

    measure();
    shown.forEach((note, index) => {
      const m = swim.current[note.id];
      const el = nodes.current[note.id];
      if (!m || !el) return;
      if (bounds.current.w > 0 && bounds.current.h > 0) {
        if (!m.placed) seed(m, index, bounds.current.w, bounds.current.h);
        else clampToPond(m, bounds.current.w, bounds.current.h);
      }
      paint(m, el, imgs.current[note.id] ?? null, last, reduce);
    });

    const observer = new ResizeObserver(() => {
      const prev = bounds.current;
      measure();
      const { w, h } = bounds.current;
      if (w <= 0 || h <= 0) return;
      shownRef.current.forEach((note, index) => {
        const m = swim.current[note.id];
        if (!m) return;
        if (!m.placed || prev.w <= 0 || prev.h <= 0) seed(m, index, w, h);
        else clampToPond(m, w, h);
      });
    });
    observer.observe(pond);

    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, MAX_DT);
      last = t;
      const { w, h } = bounds.current;
      const list = shownRef.current;
      for (let i = 0; i < list.length; i += 1) {
        const note = list[i]!;
        const m = swim.current[note.id];
        const el = nodes.current[note.id];
        if (!m || !el || w <= 0 || h <= 0) continue;
        if (!m.placed) seed(m, i, w, h);

        if (!reduce) {
          const wander =
            Math.sin(t * 0.0003 + m.wanderPhase) * 0.6 +
            Math.sin(t * 0.0011 + m.wanderPhase * 2) * 0.25;
          let desired = m.heading + wander;

          const size = m.scale * m.k;
          const visW = m.width * size;
          const visH = m.width * ASPECT * size;
          const margin = BASE_MARGIN * Math.max(0.35, visW / MARGIN_REF_WIDTH);
          const hw = visW / 2;
          const hh = visH / 2;
          const fx = edgeForce(m.x - hw, margin) - edgeForce(w - (m.x + hw), margin);
          const fy = edgeForce(m.y - hh, margin) - edgeForce(h - (m.y + hh), margin);
          const force = Math.hypot(fx, fy);
          if (force > 0.001) {
            desired = lerpAngle(desired, Math.atan2(fy, fx), Math.min(1, force));
          }

          const delta = shortestDelta(m.heading, desired);
          const maxTurn = TURN_RATE * dt;
          const turned = clamp(delta, -maxTurn, maxTurn);
          m.heading = wrapAngle(m.heading + turned);

          if (t >= m.nextBurst) {
            m.speed = m.cruiseSpeed * BURST_MULT;
            m.nextBurst = t + 2000 + Math.random() * 3000;
          }
          m.speed += (m.cruiseSpeed - m.speed) * dt * GLIDE;
          const turnHard = Math.min(1, Math.abs(turned) / (maxTurn + 1e-6));
          const step = m.speed * (1 + 0.18 * turnHard) * dt;
          m.x += Math.cos(m.heading) * step;
          m.y += Math.sin(m.heading) * step;
          clampToPond(m, w, h);

          const c = Math.cos(m.heading);
          if (Math.abs(c) > FACE_HYSTERESIS) {
            m.facing = c > 0 ? "right" : "left";
          }
        }

        paint(m, el, imgs.current[note.id] ?? null, t, reduce);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      motionQuery.removeEventListener("change", onMotion);
    };
  }, [shown, fishRev]);

  function tapWater(event: MouseEvent<HTMLDivElement>) {
    const pond = pondRef.current;
    if (!pond) return;
    const box = pond.getBoundingClientRect();
    const id = Math.random();
    setRipples((list) => [...list, { id, x: event.clientX - box.left, y: event.clientY - box.top }]);
    window.setTimeout(() => {
      setRipples((list) => list.filter((ripple) => ripple.id !== id));
    }, 900);
  }

  return (
    <div
      ref={pondRef}
      onClick={tapWater}
      className="pond-water relative h-full min-h-[280px] overflow-hidden rounded-card"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pond-ripple pointer-events-none absolute size-14 animate-ping rounded-pill"
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
            data-note-id={note.id}
            className="pond-fish"
            style={{
              width: fish.width,
              pointerEvents: dim ? "none" : "auto",
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!dim) onOpen(note.id);
            }}
            aria-label={`${fish.species}: ${note.title || "Untitled spark"}`}
          >
            <span className="relative block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  imgs.current[note.id] = el;
                }}
                src={fish.left}
                alt=""
                width={fish.width}
                height={Math.round(fish.width * ASPECT)}
                draggable={false}
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
    </div>
  );
}
