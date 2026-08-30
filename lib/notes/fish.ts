import { isCat, type BlockType, type Cat, type Note } from "@/lib/notes/types";
import { getCategoriesSnapshot } from "@/lib/notes/categories";

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

export type FishKind = {
  key: string;
  species: string;
  width: number;
  left: string;
  right: string;
};

function directional(key: string, species: string, width: number): FishKind {
  return {
    key,
    species,
    width,
    left: `/fish/${key}-left.webp`,
    right: `/fish/${key}-right.webp`,
  };
}

function still(key: string, species: string, width: number): FishKind {
  const src = `/fish/${key}.webp`;
  return { key, species, width, left: src, right: src };
}

export const FISH_SPECIES: FishKind[] = [
  directional("goldfish-yellow", "Yellow goldfish", 148),
  directional("goldfish-red", "Red goldfish", 140),
  directional("fish-green", "Green carp", 152),
  directional("fish-blue", "Blue tang", 160),
  directional("fish-pink", "Pink koi", 168),
  directional("fish-purple", "Purple koi", 176),
  still("goldfish-orange", "Orange goldfish", 150),
  still("koi-white", "White koi", 168),
  still("koi-calico", "Calico koi", 170),
  still("koi-vermilion", "Vermilion koi", 168),
  still("koi-blush", "Blush koi", 166),
  still("betta-lilac", "Lilac betta", 156),
  still("carp-honey", "Honey carp", 158),
  still("tang-blue", "Blue tang", 160),
];

export const FISH_BY_KEY: Record<string, FishKind> = Object.fromEntries(
  FISH_SPECIES.map((fish) => [fish.key, fish]),
);

export const ALL_FISH_SRCS = [
  ...new Set(FISH_SPECIES.flatMap((fish) => [fish.left, fish.right])),
];

export function speciesOf(key: string) {
  return FISH_BY_KEY[key] ?? FISH_SPECIES[0]!;
}

const ASSIGN_FIRST = [
  "fish-pink",
  "fish-blue",
  "fish-green",
  "fish-purple",
];

export function unusedFishKey(used: string[]) {
  const order = [...ASSIGN_FIRST, ...FISH_SPECIES.map((fish) => fish.key)];
  const next = order.find((key) => FISH_BY_KEY[key] && !used.includes(key));
  return next ?? FISH_SPECIES[used.length % FISH_SPECIES.length]!.key;
}

export function fishFor(cat: Cat, id: string) {
  const match = getCategoriesSnapshot().find((item) => item.id === cat);
  if (match) return speciesOf(match.fishKey);
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return FISH_SPECIES[hash % FISH_SPECIES.length]!;
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

export function snippetAround(text: string, query: string, max = 72) {
  const t = text.replace(/\s+/g, " ").trim();
  const q = query.trim();
  if (!q) return clipBody(t, max);
  const at = t.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return clipBody(t, max);
  const start = Math.max(0, at - 16);
  const chunk = `${start > 0 ? "…" : ""}${t.slice(start)}`;
  return clipBody(chunk, max);
}

export type SearchHit = {
  note: Note;
  score: number;
  inTitle: boolean;
};

export function searchNotes(notes: Note[], query: string, limit = 8): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const note of notes) {
    const title = note.title.toLowerCase();
    const body = note.body.toLowerCase();
    const cat = note.cat.toLowerCase();
    const inTitle = title.includes(q);
    const inBody = body.includes(q);
    const inCat = cat.includes(q);
    if (!inTitle && !inBody && !inCat) continue;
    let score = 0;
    if (title === q) score += 120;
    else if (title.startsWith(q)) score += 90;
    else if (inTitle) score += 70;
    if (inBody) score += 24;
    if (inCat) score += 8;
    hits.push({ note, score, inTitle });
  }
  hits.sort((a, b) => b.score - a.score || b.note.acted_at.localeCompare(a.note.acted_at));
  return hits.slice(0, limit);
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
  if (type === "colour") return 110;
  if (type === "video") return 280;
  return 200;
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
