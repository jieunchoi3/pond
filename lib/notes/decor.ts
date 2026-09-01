import type { Note } from "@/lib/notes/types";

export type DecorKind = {
  key: string;
  label: string;
  src: string;
  width: number;
  height: number;
};

export const DECOR_SPECIES: DecorKind[] = [
  { key: "lily", label: "Water lily", src: "/decor/lily.webp", width: 168, height: 159 },
  { key: "lotus", label: "Lotus", src: "/decor/lotus.webp", width: 156, height: 165 },
  { key: "waterwheel", label: "Waterwheel", src: "/decor/waterwheel.webp", width: 176, height: 126 },
  { key: "lantern", label: "Stone lantern", src: "/decor/lantern.webp", width: 120, height: 195 },
  { key: "reed", label: "Reeds", src: "/decor/reed.webp", width: 110, height: 176 },
];

export const DECOR_BY_KEY: Record<string, DecorKind> = Object.fromEntries(
  DECOR_SPECIES.map((item) => [item.key, item]),
);

export const ALL_DECOR_SRCS = DECOR_SPECIES.map((item) => item.src);

export function isDecorKey(value: unknown): value is string {
  return typeof value === "string" && Boolean(DECOR_BY_KEY[value]);
}

export function hashDecor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash;
}

export function assignDecorKey(id: string) {
  return DECOR_SPECIES[hashDecor(id) % DECOR_SPECIES.length]!.key;
}

export function decorFor(note: Pick<Note, "id"> & { decorKey?: string | null }) {
  if (isDecorKey(note.decorKey)) return DECOR_BY_KEY[note.decorKey]!;
  return DECOR_BY_KEY[assignDecorKey(note.id)]!;
}

export const DECOR_SCALE = 0.72;
export const DECOR_GAP = 36;
export const DECOR_MIN_GAP = 12;

export type DecorBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

function hashDecorPos(id: string, salt: number) {
  let hash = (salt + 2166136261) >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function visSize(box: Pick<DecorBox, "width" | "height" | "scale">) {
  return { w: box.width * box.scale, h: box.height * box.scale };
}

function padFor(box: Pick<DecorBox, "width" | "height" | "scale">, gap: number) {
  const { w, h } = visSize(box);
  return { hw: w / 2 + gap / 2, hh: h / 2 + gap / 2 };
}

function clampDecor(box: DecorBox, pondW: number, pondH: number) {
  const { w, h } = visSize(box);
  const minX = w * 0.5 + 12;
  const maxX = Math.max(minX, pondW - w * 0.5 - 12);
  const minY = h * 0.5 + 8;
  const maxY = Math.max(minY, pondH - h * 0.5 - 8);
  box.x = Math.min(Math.max(box.x, minX), maxX);
  box.y = Math.min(Math.max(box.y, minY), maxY);
}

export function pairOverlaps(a: DecorBox, b: DecorBox, gap = DECOR_MIN_GAP) {
  const ap = padFor(a, gap);
  const bp = padFor(b, gap);
  return Math.abs(a.x - b.x) < ap.hw + bp.hw && Math.abs(a.y - b.y) < ap.hh + bp.hh;
}

export function decorationsOverlap(boxes: DecorBox[]) {
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (pairOverlaps(boxes[i]!, boxes[j]!)) return true;
    }
  }
  return false;
}

export function preferredDecorPoint(box: DecorBox, pondW: number, pondH: number) {
  const { w, h } = visSize(box);
  const minX = w * 0.5 + 16;
  const maxX = Math.max(minX, pondW - w * 0.5 - 16);
  const minY = pondH * 0.48;
  const maxY = Math.max(minY, pondH - h * 0.5 - 12);
  const spanX = Math.max(1, Math.floor(maxX - minX));
  const spanY = Math.max(1, Math.floor(maxY - minY));
  box.x = minX + (hashDecorPos(box.id, 1) % spanX);
  box.y = minY + (hashDecorPos(box.id, 2) % spanY);
}

function separateDecorBoxes(boxes: DecorBox[], pondW: number, pondH: number) {
  if (boxes.length === 0) return;
  for (const box of boxes) clampDecor(box, pondW, pondH);
  if (boxes.length === 1) return;

  for (let n = 0; n < 80; n += 1) {
    let moved = false;
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const ap = padFor(a, DECOR_GAP);
        const bp = padFor(b, DECOR_GAP);
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const overlapX = ap.hw + bp.hw - Math.abs(dx);
        const overlapY = ap.hh + bp.hh - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX <= overlapY) {
          const push = overlapX / 2 + 0.5;
          const dir = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
          a.x += dir * push;
          b.x -= dir * push;
        } else {
          const push = overlapY / 2 + 0.5;
          const dir = dy === 0 ? 1 : Math.sign(dy);
          a.y += dir * push;
          b.y -= dir * push;
        }
        moved = true;
      }
    }
    for (const box of boxes) clampDecor(box, pondW, pondH);
    if (!moved) break;
  }
}

function packDecorRow(boxes: DecorBox[], pondW: number, pondH: number) {
  if (boxes.length === 0) return;
  const sizes = boxes.map((box) => visSize(box));
  const maxW = Math.max(...sizes.map((size) => size.w));
  const maxH = Math.max(...sizes.map((size) => size.h));
  const innerW = Math.max(maxW, pondW - 24);
  const innerH = Math.max(maxH, pondH - 16);
  let gap = DECOR_GAP;
  let cols = Math.max(1, Math.min(boxes.length, Math.floor((innerW + gap) / (maxW + gap))));
  while (gap > DECOR_MIN_GAP && cols * maxW + (cols - 1) * gap > innerW) {
    gap -= 2;
    cols = Math.max(1, Math.min(boxes.length, Math.floor((innerW + gap) / (maxW + gap))));
  }
  const rows = Math.ceil(boxes.length / cols);
  let vGap = gap;
  while (vGap > DECOR_MIN_GAP && rows * maxH + (rows - 1) * vGap > innerH) {
    vGap -= 2;
  }
  const totalH = rows * maxH + (rows - 1) * vGap;
  const originY = Math.max(8, pondH - 10 - totalH);
  boxes.forEach((box, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const used = Math.min(cols, boxes.length - row * cols);
    const rowWidth = used * maxW + (used - 1) * gap;
    const originX = Math.max(12, (pondW - rowWidth) / 2);
    const { w, h } = visSize(box);
    box.x = originX + col * (maxW + gap) + w / 2;
    box.y = originY + row * (maxH + vGap) + h / 2;
    clampDecor(box, pondW, pondH);
  });
}

export function layoutPondDecorations(
  boxes: Array<DecorBox & { placed?: boolean }>,
  pondW: number,
  pondH: number,
) {
  if (pondW <= 0 || pondH <= 0 || boxes.length === 0) return;
  const ordered = [...boxes].sort((a, b) => a.id.localeCompare(b.id));
  for (const box of ordered) {
    if (!box.placed) preferredDecorPoint(box, pondW, pondH);
  }
  separateDecorBoxes(ordered, pondW, pondH);
  if (decorationsOverlap(ordered)) packDecorRow(ordered, pondW, pondH);
}
