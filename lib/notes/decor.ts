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
