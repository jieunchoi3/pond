import type { Cat } from "@/lib/notes/types";

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
  return list[hash % list.length];
}

export const MS_DAY = 86_400_000;
export const MAX_NEGLECT_DAYS = 90;
export const MAX_NEGLECT_SCALE = 1.2;
export const CATCH_MIN_DAYS = 7;
export const CATCH_LIMIT = 3;
export const MAX_FISH_ON_SCREEN = 40;

export function daysNeglected(actedAt: string, now = Date.now()) {
  const stamp = Date.parse(actedAt);
  if (Number.isNaN(stamp)) return 0;
  return Math.max(0, (now - stamp) / MS_DAY);
}

export function neglectScale(actedAt: string, now = Date.now()) {
  const days = Math.min(MAX_NEGLECT_DAYS, daysNeglected(actedAt, now));
  return 1 + (days / MAX_NEGLECT_DAYS) * (MAX_NEGLECT_SCALE - 1);
}

export function daysLabel(actedAt: string) {
  return `${Math.floor(daysNeglected(actedAt))}d untouched`;
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

export function sampleFish<T>(items: T[], cap = MAX_FISH_ON_SCREEN): T[] {
  if (items.length <= cap) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, cap);
}
