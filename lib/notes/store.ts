import { type Cat, type Note, type NoteBlock } from "@/lib/notes/types";

const NOTES_KEY = "pond.notes.v5";
const EVENT = "pond-notes";

function requestSync(immediate = false) {
  queueMicrotask(() => {
    void import("@/lib/notes/sync").then((mod) =>
      immediate ? mod.flushPondSync() : mod.schedulePondSync(),
    );
  });
}

let snapshot: Note[] = [];
let hydrated = false;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persist(notes: Note[], sync = true, immediate = false) {
  snapshot = notes;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Private mode can block storage; the in-memory snapshot still works.
  }
  emit();
  if (sync) requestSync(immediate);
}

export function subscribeNotes(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const SEED: Note[] = [
  {
    id: "n1",
    user_id: null,
    cat: "ai art",
    title: "fruit as makeup",
    body: "banana mascara, grape shadow. shoot the purple one first.",
    blocks: [],
    created_at: daysAgo(0),
    acted_at: daysAgo(0),
    pending: false,
  },
  {
    id: "n2",
    user_id: null,
    cat: "ai art",
    title: "bubble dream",
    body: "a girl dreaming with a bubble floating above her head, bright white shirt, soft chrome light.",
    blocks: [],
    created_at: daysAgo(47),
    acted_at: daysAgo(47),
    pending: false,
  },
  {
    id: "n3",
    user_id: null,
    cat: "ai art",
    title: "ink in water",
    body: "filmed from directly above, very slow. 120fps cut to half speed. the bloom is the whole shot.",
    blocks: [
      { id: "n3-c1", type: "colour", content: "#1B2A33", x: 30, y: 26, w: 110 },
      { id: "n3-c2", type: "colour", content: "#C6D8CE", x: 156, y: 26, w: 110 },
      { id: "n3-v1", type: "video", content: "https://youtube.com/watch?v=ink-reference", x: 30, y: 150, w: 210 },
      { id: "n3-a1", type: "voice", content: "0:14", x: 290, y: 26, w: 190 },
    ],
    created_at: daysAgo(96),
    acted_at: daysAgo(96),
    pending: false,
  },
  {
    id: "n4",
    user_id: null,
    cat: "vibe coding",
    title: "capture speed",
    body: "under 400ms to first keystroke. nothing else matters if that's slow.",
    blocks: [],
    created_at: daysAgo(2),
    acted_at: daysAgo(2),
    pending: false,
  },
  {
    id: "n5",
    user_id: null,
    cat: "vibe coding",
    title: "one note type",
    body: "title + body + board. never build two kinds of note.",
    blocks: [],
    created_at: daysAgo(29),
    acted_at: daysAgo(29),
    pending: false,
  },
  {
    id: "n6",
    user_id: null,
    cat: "vibe coding",
    title: "hold to record",
    body: "tap + to type, hold + to record a voice note.",
    blocks: [],
    created_at: daysAgo(71),
    acted_at: daysAgo(71),
    pending: false,
  },
  {
    id: "n7",
    user_id: null,
    cat: "vibe coding",
    title: "pigeon app",
    body: "people can take a picture of pigeons and adopt them.",
    blocks: [],
    created_at: daysAgo(38),
    acted_at: daysAgo(38),
    pending: false,
  },
  {
    id: "n8",
    user_id: null,
    cat: "music",
    title: "video moodboard",
    body: "pale mint, wet stone, one orange accident. reference cut pinned below.",
    blocks: [
      { id: "n8-c1", type: "colour", content: "var(--water-1)", x: 28, y: 24, w: 100 },
      { id: "n8-c2", type: "colour", content: "var(--water-3)", x: 142, y: 24, w: 100 },
      { id: "n8-c3", type: "colour", content: "var(--accent)", x: 256, y: 24, w: 100 },
      { id: "n8-v1", type: "video", content: "https://youtube.com/watch?v=reference-cut", x: 28, y: 148, w: 210 },
      { id: "n8-i1", type: "image", content: "", x: 262, y: 148, w: 200 },
    ],
    created_at: daysAgo(58),
    acted_at: daysAgo(58),
    pending: false,
  },
  {
    id: "n9",
    user_id: null,
    cat: "music",
    title: "field recording",
    body: "rain on the studio window. keep the traffic in.",
    blocks: [],
    created_at: daysAgo(103),
    acted_at: daysAgo(103),
    pending: false,
  },
  {
    id: "n10",
    user_id: null,
    cat: "vibe coding",
    title: "one-thing shop",
    body: "sells a single product. it changes every month.",
    blocks: [],
    created_at: daysAgo(6),
    acted_at: daysAgo(6),
    pending: false,
  },
  {
    id: "n11",
    user_id: null,
    cat: "vibe coding",
    title: "three-number report",
    body: "a weekly report that is three numbers and no commentary.",
    blocks: [],
    created_at: daysAgo(132),
    acted_at: daysAgo(132),
    pending: false,
  },
  {
    id: "n12",
    user_id: null,
    cat: "music",
    title: "no drums until chorus two",
    body: "downtempo. let it feel unfinished for 90 seconds.",
    blocks: [],
    created_at: daysAgo(11),
    acted_at: daysAgo(11),
    pending: false,
  },
  {
    id: "n13",
    user_id: null,
    cat: "vibe coding",
    title: "the net tool",
    body: "drag a net over fish to batch-move them to another pond.",
    blocks: [],
    created_at: daysAgo(84),
    acted_at: daysAgo(84),
    pending: false,
  },
  {
    id: "n14",
    user_id: null,
    cat: "ai art",
    title: "bubble warrior",
    body: "there is a girl watching the water from inside a soap bubble.",
    blocks: [],
    created_at: daysAgo(21),
    acted_at: daysAgo(21),
    pending: false,
  },
];

const SEED_IDS = new Set(SEED.map((note) => note.id));

export function isDemoNoteId(id: string): boolean {
  return SEED_IDS.has(id) || /^n\d+$/.test(id);
}

export function looksLikeDemoNotes(notes: Note[]): boolean {
  return notes.length > 0 && notes.every((note) => isDemoNoteId(note.id));
}

export function isNoteRecord(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return (
    typeof note.id === "string" &&
    typeof note.cat === "string" &&
    note.cat.trim().length > 0 &&
    typeof note.acted_at === "string" &&
    !Number.isNaN(Date.parse(note.acted_at))
  );
}

export function getNotesSnapshot(): Note[] {
  if (!hydrated && typeof window !== "undefined") {
    const stored = readJson<unknown>(NOTES_KEY, []);
    const valid = Array.isArray(stored) ? stored.filter(isNoteRecord) : [];
    const legacySeed = looksLikeDemoNotes(valid);
    snapshot = !legacySeed && valid.length > 0 ? valid : [];
    hydrated = true;
  }
  return snapshot;
}

export function getServerNotesSnapshot(): Note[] {
  return SEED;
}

export function addNote(input: {
  cat: Cat;
  title?: string;
  body?: string;
  text?: string;
  blocks?: NoteBlock[];
  userId: string | null;
}): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    cat: input.cat,
    title: (input.title ?? input.text ?? "").trim(),
    body: (input.body ?? "").trim(),
    blocks: input.blocks ?? [],
    created_at: now,
    acted_at: now,
    pending: true,
  };
  persist([...getNotesSnapshot(), note], true, true);
  return note;
}

function writeNote(next: Note) {
  persist(getNotesSnapshot().map((note) => (note.id === next.id ? next : note)));
}

export function patchNote(id: string, patch: Partial<Pick<Note, "title" | "body" | "cat" | "blocks">>) {
  const current = getNotesSnapshot().find((note) => note.id === id);
  if (!current) return;
  writeNote({ ...current, ...patch, pending: true });
}

export function markActed(id: string) {
  const current = getNotesSnapshot().find((note) => note.id === id);
  if (!current) return;
  writeNote({ ...current, acted_at: new Date().toISOString(), pending: true });
}

export function recastNote(id: string) {
  markActed(id);
}

export function patchNotesCat(from: string, to: string) {
  const next = getNotesSnapshot().map((note) =>
    note.cat === from ? { ...note, cat: to, pending: true } : note,
  );
  persist(next, true, true);
}

export function deleteNote(id: string) {
  persist(getNotesSnapshot().filter((note) => note.id !== id), true, true);
}

export function applyRemoteNotes(notes: Note[]) {
  persist(notes, false);
  hydrated = true;
}
