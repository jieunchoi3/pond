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
import { ALL_DECOR_SRCS, DECOR_SCALE, decorFor, layoutPondDecorations } from "@/lib/notes/decor";
import { usePondCategories } from "@/lib/notes/categories";
import type { Note } from "@/lib/notes/types";

type PondCanvasProps = {
  notes: Note[];
  decorations?: Note[];
  visible: Set<string>;
  paused?: boolean;
  onOpen: (id: string) => void;
  onCapture: () => void;
};

type Swim = {
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  bob: number;
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

type Sit = {
  id: string;
  x: number;
  y: number;
  phase: number;
  bob: number;
  scale: number;
  width: number;
  height: number;
  src: string;
  placed: boolean;
  lastOpacity: string;
};

type Ripple = { id: number; x: number; y: number };

const MAX_DT = 0.048;
const ASPECT = 0.55;

export function PondCanvas({
  notes,
  decorations = [],
  visible,
  paused = false,
  onOpen,
  onCapture,
}: PondCanvasProps) {
  const pondRef = useRef<HTMLDivElement>(null);
  const categories = usePondCategories();
  const fishRev = categories.map((item) => `${item.id}:${item.fishKey}`).join("|");
  const nodes = useRef<Record<string, HTMLButtonElement | null>>({});
  const imgs = useRef<Record<string, HTMLImageElement | null>>({});
  const swim = useRef<Record<string, Swim>>({});
  const sit = useRef<Record<string, Sit>>({});
  const decorNodes = useRef<Record<string, HTMLButtonElement | null>>({});
  const shown = useMemo(() => sampleFish(notes), [notes]);
  const shownRef = useRef(shown);
  const decorRef = useRef(decorations);
  const visibleRef = useRef(visible);
  const bounds = useRef({ w: 0, h: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const hoverId = useRef<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    decorRef.current = decorations;
  }, [decorations]);

  useEffect(() => {
    for (const src of [...ALL_FISH_SRCS, ...ALL_DECOR_SRCS]) {
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
    const decorIds = new Set(decorations.map((note) => note.id));
    for (const id of Object.keys(sit.current)) {
      if (!decorIds.has(id)) delete sit.current[id];
    }

    shown.forEach((note, index) => {
      const layer = layerOf(note.id);
      const fish = fishFor(note.cat, note.id);
      const scale = neglectScale(note.acted_at);
      const speed = (26 + ((index * 13) % 18)) * layer.speed;
      const existing = swim.current[note.id];
      if (existing) {
        existing.scale = scale;
        existing.k = layer.k;
        existing.o = layer.o;
        existing.blur = layer.blur;
        existing.speed = speed;
        existing.width = fish.width;
        existing.left = fish.left;
        existing.right = fish.right;
        if (existing.dir !== 1 && existing.dir !== -1) existing.dir = index % 2 === 0 ? 1 : -1;
        existing.phase ??= (index * 1.7) % (Math.PI * 2);
        existing.bob ??= 5 + ((index * 3) % 5);
        return;
      }
      swim.current[note.id] = {
        x: 0,
        y: 0,
        dir: index % 2 === 0 ? 1 : -1,
        speed,
        phase: (index * 1.7) % (Math.PI * 2),
        bob: 5 + ((index * 3) % 5),
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

    decorations.forEach((note, index) => {
      const kind = decorFor(note);
      const existing = sit.current[note.id];
      if (existing) {
        existing.id = note.id;
        existing.src = kind.src;
        existing.width = kind.width;
        existing.height = kind.height;
        existing.scale = DECOR_SCALE;
        return;
      }
      sit.current[note.id] = {
        id: note.id,
        x: 0,
        y: 0,
        phase: (index * 1.3) % (Math.PI * 2),
        bob: 3 + (index % 4),
        scale: DECOR_SCALE,
        width: kind.width,
        height: kind.height,
        src: kind.src,
        placed: false,
        lastOpacity: "",
      };
    });

    function measure() {
      const box = pondRef.current?.getBoundingClientRect();
      if (!box) return;
      bounds.current = { w: box.width, h: box.height };
    }

    function layoutDecors(w: number, h: number) {
      const boxes = decorRef.current
        .map((note) => sit.current[note.id])
        .filter((m): m is Sit => Boolean(m));
      layoutPondDecorations(boxes, w, h);
      for (const m of boxes) m.placed = true;
    }

    function paintDecor(m: Sit, el: HTMLButtonElement, t: number, reduce: boolean) {
      const bob = reduce ? 0 : Math.sin(t * 0.0004 + m.phase) * m.bob;
      const left = m.x - m.width / 2;
      const top = m.y + bob - m.height / 2;
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${m.scale})`;
      const opacity = visibleRef.current.has(el.dataset.noteId ?? "") ? "1" : "0.1";
      if (m.lastOpacity !== opacity) {
        el.style.opacity = opacity;
        m.lastOpacity = opacity;
      }
      el.style.filter = "drop-shadow(var(--shadow-sm))";
      el.style.zIndex = hoverId.current === (el.dataset.noteId ?? "") ? "5" : "2";
    }

    function seed(m: Swim, index: number, w: number, h: number) {
      const size = m.scale * m.k;
      const visW = m.width * size;
      const visH = m.width * ASPECT * size;
      const padX = Math.max(24, visW * 0.5);
      const padY = Math.max(28, visH * 0.55);
      const spanX = Math.max(1, w - padX * 2);
      const spanY = Math.max(1, h - padY * 2);
      m.x = padX + ((index * 97) % spanX);
      m.y = padY + ((index * 61) % spanY);
      m.placed = true;
    }

    function paint(m: Swim, el: HTMLButtonElement, img: HTMLImageElement | null, t: number, reduce: boolean) {
      const size = m.scale * m.k;
      const layoutW = m.width;
      const layoutH = layoutW * ASPECT;
      const bob = reduce ? 0 : Math.sin(t * 0.00055 + m.phase) * m.bob;
      const left = m.x - layoutW / 2;
      const top = m.y + bob - layoutH / 2;
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${size})`;
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
      const src = m.dir > 0 ? m.right : m.left;
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
    if (bounds.current.w > 0 && bounds.current.h > 0) {
      layoutDecors(bounds.current.w, bounds.current.h);
    }
    shown.forEach((note, index) => {
      const m = swim.current[note.id];
      const el = nodes.current[note.id];
      if (!m || !el) return;
      if (bounds.current.w > 0 && bounds.current.h > 0) {
        if (!m.placed) seed(m, index, bounds.current.w, bounds.current.h);
      }
      paint(m, el, imgs.current[note.id] ?? null, last, reduce);
    });
    decorations.forEach((note) => {
      const m = sit.current[note.id];
      const el = decorNodes.current[note.id];
      if (!m || !el) return;
      paintDecor(m, el, last, reduce);
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
        else {
          const nx = prev.w > 0 ? m.x * (w / prev.w) : m.x;
          const ny = prev.h > 0 ? m.y * (h / prev.h) : m.y;
          m.x = nx;
          m.y = ny;
        }
      });
      decorRef.current.forEach((note) => {
        const m = sit.current[note.id];
        if (!m) return;
        if (m.placed && prev.w > 0 && prev.h > 0) {
          m.x = m.x * (w / prev.w);
          m.y = m.y * (h / prev.h);
        } else {
          m.placed = false;
        }
      });
      layoutDecors(w, h);
    });
    observer.observe(pond);

    const tick = (t: number) => {
      if (pausedRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
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
          m.x += m.dir * m.speed * dt;
          const size = m.scale * m.k;
          const visW = m.width * size;
          if (m.dir > 0 && m.x > w + visW * 0.55) m.x = -visW * 0.55;
          if (m.dir < 0 && m.x < -visW * 0.55) m.x = w + visW * 0.55;
        }

        paint(m, el, imgs.current[note.id] ?? null, t, reduce);
      }
      const decorList = decorRef.current;
      if (decorList.some((note) => sit.current[note.id] && !sit.current[note.id]!.placed)) {
        layoutDecors(w, h);
      }
      for (let i = 0; i < decorList.length; i += 1) {
        const note = decorList[i]!;
        const m = sit.current[note.id];
        const el = decorNodes.current[note.id];
        if (!m || !el || w <= 0 || h <= 0) continue;
        paintDecor(m, el, t, reduce);
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
  }, [shown, decorations, fishRev]);

  function paintTitle() {
    const pop = titleRef.current;
    const pond = pondRef.current;
    const id = hoverId.current;
    if (!pop || !pond) return;
    if (!id) {
      pop.dataset.open = "false";
      return;
    }
    const el = nodes.current[id] ?? decorNodes.current[id];
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
    pop.style.transform = placeBelow
      ? `translate3d(${cx}px, ${below}px, 0) translate(-50%, 0)`
      : `translate3d(${cx}px, ${above}px, 0) translate(-50%, -100%)`;
    pop.dataset.open = "true";
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
      {decorations.map((note) => {
        const kind = decorFor(note);
        const dim = !visible.has(note.id);
        return (
          <button
            key={`decor-${note.id}`}
            ref={(el) => {
              decorNodes.current[note.id] = el;
            }}
            type="button"
            data-note-id={note.id}
            className="pond-fish"
            style={{
              width: kind.width,
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
            aria-label={`${kind.label}: ${note.title || "Untitled spark"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kind.src}
              alt=""
              width={kind.width}
              height={kind.height}
              draggable={false}
            />
          </button>
        );
      })}
      <div
        ref={titleRef}
        className="pond-fish-title type-label shadow-pond-sm"
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
