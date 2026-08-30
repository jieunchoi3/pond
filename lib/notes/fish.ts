import { isCat, type BlockType, type Cat, type Note } from "@/lib/notes/types";

export { isCat };

export const MS_DAY = 86_400_000;
export const MAX_NEGLECT_DAYS = 90;
export const MAX_NEGLECT_SCALE = 1.2;
export const CATCH_MIN_DAYS = 7;
export const CATCH_LIMIT = 3;
export const MAX_FISH_ON_SCREEN = 40;
export const NARROW_BREAKPOINT = 720;

export type DepthLayer = {
  k: number;
  o: number;
  blur: number;
  speed: number;
};

export type Layer = DepthLayer;

export const LAYERS: DepthLayer[] = [
  { k: 1, o: 1, blur: 0, speed: 1 },
  { k: 0.74, o: 0.68, blur: 1.4, speed: 0.66 },
  { k: 0.5, o: 0.4, blur: 3, speed: 0.42 },
];

export function layerOf(id: string): DepthLayer {
  return LAYERS[(id.charCodeAt(id.length - 1) + id.length) % 3]!;
}

export const FISH_BY_CAT: Record<Cat, { src: string; species: string; width: number }[]> = {
  "ai art": [
    { src: "/fish/koi-white.png", species: "Kohaku koi", width: 168 },
    { src: "/fish/koi-vermilion.png", species: "Vermilion koi", width: 176 },
    { src: "/fish/koi-blush.png", species: "Blush koi", width: 160 },
    { src: "/fish/koi-calico.png", species: "Calico koi", width: 144 },
  ],
  "vibe coding": [
    { src: "/fish/tang-blue.png", species: "Blue tang", width: 148 },
    { src: "/fish/carp-honey.png", species: "Honey carp", width: 128 },
  ],
  music: [
    { src: "/fish/betta-lilac.png", species: "Lilac betta", width: 156 },
    { src: "/fish/goldfish-orange.png", species: "Orange goldfish", width: 132 },
  ],
};

export function fishFor(cat: Cat, id: string) {
  const list = FISH_BY_CAT[cat];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return list[hash % list.length]!;
}

export function daysNeglected(actedAt: string, now = Date.now()) {
  const stamp = Date.parse(actedAt);
  if (Number.isNaN(stamp)) return 0;
  return Math.max(0, (now - stamp) / MS_DAY);
}

export function daysIdle(actedAt: string, now = Date.now()) {
  return Math.floor(daysNeglected(actedAt, now));
}

export function neglectScale(actedAt: string, now = Date.now()) {
  const days = Math.min(MAX_NEGLECT_DAYS, daysNeglected(actedAt, now));
  return 1 + (days / MAX_NEGLECT_DAYS) * (MAX_NEGLECT_SCALE - 1);
}

export function daysLabel(actedAt: string) {
  return `${daysIdle(actedAt)}d untouched`;
}

export function hasBoard(note: Note) {
  return note.blocks.length > 0;
}

export function clipBody(text: string, max = 88): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let end = max;
  const isLatin = (ch: string | undefined) => Boolean(ch && /[A-Za-z0-9]/.test(ch));
  if (end < t.length && isLatin(t[end]) && isLatin(t[end - 1])) {
    while (end > max - 24 && isLatin(t[end - 1])) end -= 1;
  }
  return `${t.slice(0, end).trimEnd()}…`;
}

export function matchesQuery(title: string, body: string, cat: string, query: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    title.toLowerCase().includes(q) ||
    body.toLowerCase().includes(q) ||
    cat.toLowerCase().includes(q)
  );
}

export function catchOfTheDay(notes: Note[], now = Date.now()) {
  return [...notes]
    .filter((note) => daysIdle(note.acted_at, now) >= CATCH_MIN_DAYS)
    .sort((a, b) => daysIdle(b.acted_at, now) - daysIdle(a.acted_at, now))
    .slice(0, CATCH_LIMIT);
}

export function sampleFish<T>(items: T[], cap = MAX_FISH_ON_SCREEN): T[] {
  if (items.length <= cap) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy.slice(0, cap);
}

export function defaultBlockContent(type: BlockType) {
  if (type === "colour") return "var(--water-3)";
  if (type === "voice") return "0:08";
  return "";
}

export function defaultBlockWidth(type: BlockType) {
  return type === "colour" ? 110 : 200;
}

export function defaultBlock(type: BlockType, index: number) {
  return {
    id: crypto.randomUUID(),
    type,
    content: defaultBlockContent(type),
    x: 24 + (index % 3) * 130,
    y: 24 + Math.floor(index / 3) * 118,
    w: defaultBlockWidth(type),
  };
}
