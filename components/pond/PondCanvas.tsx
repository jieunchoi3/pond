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
  turn: number;
  speed: number;
  cruiseSpeed: number;
  wanderPhase: number;
  wanderTheta: number;
  wanderGoal: number;
  nextWander: number;
  facing: Facing;
  scale: number;
  k: number;
  o: number;
  blur: number;
  width: number;
  left: string;
  right: string;
  placed: boolean;
  lastSrc: string;
  lastOpacity: string;
  lastFilter: string;
};

type Ripple = { id: number; x: number; y: number };

const MAX_DT = 0.032;
const STEER_OMEGA = 5.4;
const MAX_TURN = 3.4;
const FACE_HYSTERESIS = 0.12;
const BASE_MARGIN = 110;
const MARGIN_REF_WIDTH = 160;
const ASPECT = 0.55;
const LOOK_AHEAD = 1;
const WANDER_RADIUS = 0.72;

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
  const hoverId = useRef<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);

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
    paintTitle();
  }, [hoverTitle]);

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
      const cruiseSpeed = (62 + ((index * 17) % 34)) * layer.speed;
      const existing = swim.current[note.id];
      if (existing) {
        existing.scale = scale;
        existing.k = layer.k;
        existing.o = layer.o;
        existing.blur = layer.blur;
        existing.cruiseSpeed = cruiseSpeed;
        existing.speed = cruiseSpeed;
        existing.width = fish.width;
        existing.left = fish.left;
        existing.right = fish.right;
        existing.turn ??= 0;
        existing.wanderTheta ??= 0;
        existing.wanderGoal ??= 0;
        existing.nextWander ??= performance.now() + 400;
        existing.lastSrc ??= "";
        existing.lastOpacity ??= "";
        existing.lastFilter ??= "";
        return;
      }
      const heading = ((index * 2.399) % (Math.PI * 2)) - Math.PI;
      const wanderGoal = ((index * 1.13) % 2) - 1;
      swim.current[note.id] = {
        x: 0,
        y: 0,
        heading,
        turn: 0,
        speed: cruiseSpeed,
        cruiseSpeed,
        wanderPhase: (index * 1.7) % (Math.PI * 2),
        wanderTheta: wanderGoal * 0.4,
        wanderGoal,
        nextWander: performance.now() + 400 + index * 180,
        facing: Math.cos(heading) >= 0 ? "right" : "left",
        scale,
        k: layer.k,
        o: layer.o,
        blur: layer.blur,
        width: fish.width,
        left: fish.left,
        right: fish.right,
        placed: false,
        lastSrc: "",
        lastOpacity: "",
        lastFilter: "",
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
      const foreshorten = 0.72 + 0.28 * Math.abs(Math.cos(m.heading));
      const bank = clamp(-m.turn * 9, -14, 14);
      const tail = reduce ? 0 : Math.sin(t * 0.016 * (m.speed / 50) + m.wanderPhase) * 3.2;
      el.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${bank + tail}deg) scale(${size}) scaleX(${foreshorten})`;
      const opacity = visibleRef.current.has(el.dataset.noteId ?? "") ? String(m.o) : "0.1";
      if (m.lastOpacity !== opacity) {
        el.style.opacity = opacity;
        m.lastOpacity = opacity;
      }
      const filter = m.blur
        ? `drop-shadow(var(--shadow-sm)) blur(${m.blur}px)`
        : "drop-shadow(var(--shadow-sm))";
      if (m.lastFilter !== filter) {
        el.style.filter = filter;
        m.lastFilter = filter;
      }
      el.style.zIndex = hoverId.current === (el.dataset.noteId ?? "") ? "5" : String(Math.round(m.k * 3));
      const src = m.facing === "left" ? m.left : m.right;
      if (img && m.lastSrc !== src) {
        img.src = src;
        m.lastSrc = src;
      }
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
    paintTitle();

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
          if (t >= m.nextWander) {
            m.wanderGoal = (Math.random() * 2 - 1) * 1.15;
            m.nextWander = t + 1400 + Math.random() * 2600;
          }
          const meander = Math.sin(t * 0.00055 + m.wanderPhase) * 0.28;
          m.wanderTheta += (m.wanderGoal + meander - m.wanderTheta) * Math.min(1, dt * 1.8);

          const desiredX =
            Math.cos(m.heading) * LOOK_AHEAD + Math.cos(m.heading + m.wanderTheta) * WANDER_RADIUS;
          const desiredY =
            Math.sin(m.heading) * LOOK_AHEAD + Math.sin(m.heading + m.wanderTheta) * WANDER_RADIUS;
          let desired = Math.atan2(desiredY, desiredX);

          const size = m.scale * m.k;
          const visW = m.width * size;
          const visH = m.width * ASPECT * size;
          const margin = BASE_MARGIN * Math.max(0.4, visW / MARGIN_REF_WIDTH);
          const hw = visW / 2;
          const hh = visH / 2;
          const fx = edgeForce(m.x - hw, margin) - edgeForce(w - (m.x + hw), margin);
          const fy = edgeForce(m.y - hh, margin) - edgeForce(h - (m.y + hh), margin);
          const force = Math.hypot(fx, fy);
          if (force > 0.001) {
            const urgency = Math.min(1, force);
            desired = lerpAngle(desired, Math.atan2(fy, fx), urgency * urgency);
          }

          const err = shortestDelta(m.heading, desired);
          const omega = STEER_OMEGA + force * 3.2;
          m.turn += (omega * omega * err - 2 * omega * m.turn) * dt;
          m.turn = clamp(m.turn, -MAX_TURN, MAX_TURN);
          m.heading = wrapAngle(m.heading + m.turn * dt);

          const pulse = 1 + 0.1 * Math.sin(t * 0.0014 + m.wanderPhase);
          m.speed += (m.cruiseSpeed * pulse - m.speed) * Math.min(1, dt * 3.2);
          const step = m.speed * dt;
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
      paintTitle();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      motionQuery.removeEventListener("change", onMotion);
    };
  }, [shown, fishRev]);

  function paintTitle() {
    const pop = titleRef.current;
    const pond = pondRef.current;
    const id = hoverId.current;
    if (!pop || !pond) return;
    if (!id) {
      pop.dataset.open = "false";
      return;
    }
    const el = nodes.current[id];
    if (!el) {
      pop.dataset.open = "false";
      return;
    }
    const pondBox = pond.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const cx = box.left - pondBox.left + box.width / 2;
    const gap = 10;
    const popH = pop.offsetHeight || 40;
    const above = box.top - pondBox.top - gap;
    const below = box.bottom - pondBox.top + gap;
    const placeBelow = above - popH < 8;
    pop.dataset.open = "true";
    pop.style.transform = placeBelow
      ? `translate3d(${cx}px, ${below}px, 0) translate(-50%, 0)`
      : `translate3d(${cx}px, ${above}px, 0) translate(-50%, -100%)`;
  }

  function showTitle(note: Note) {
    hoverId.current = note.id;
    setHoverTitle(note.title.trim() || "Untitled spark");
  }

  function hideTitle(id: string) {
    if (hoverId.current !== id) return;
    hoverId.current = null;
    setHoverTitle(null);
    paintTitle();
  }

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
            onPointerEnter={() => {
              if (!dim) showTitle(note);
            }}
            onPointerLeave={() => hideTitle(note.id)}
            onFocus={() => {
              if (!dim) showTitle(note);
            }}
            onBlur={() => hideTitle(note.id)}
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
      <div
        ref={titleRef}
        className="pond-fish-title type-note-title shadow-pond-sm"
        data-open="false"
        aria-hidden={hoverTitle ? undefined : true}
      >
        {hoverTitle}
      </div>
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
