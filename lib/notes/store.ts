import {
  BLOCK_TYPES,
  type Cat,
  type Note,
  type NoteBlock,
} from "@/lib/notes/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const NOTES_KEY = "pond.notes.v4";
const OUTBOX_KEY = "pond.outbox.v4";
const EVENT = "pond-notes";

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

function persist(notes: Note[]) {
  snapshot = notes;
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  emit();
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

function isNote(value: unknown): value is Note {
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
    const valid = Array.isArray(stored) ? stored.filter(isNote) : [];
    snapshot = valid.length > 0 ? valid : SEED;
    if (valid.length === 0) {
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(SEED));
    }
    hydrated = true;
  }
  return snapshot;
}

export function getServerNotesSnapshot(): Note[] {
  return SEED;
}

function isBlock(value: unknown): value is NoteBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<NoteBlock>;
  return (
    typeof block.id === "string" &&
    BLOCK_TYPES.includes(block.type as NoteBlock["type"]) &&
    typeof block.content === "string" &&
    typeof block.x === "number" &&
    typeof block.y === "number" &&
    typeof block.w === "number"
  );
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
  persist([...getNotesSnapshot(), note]);
  queueMicrotask(() => {
    void syncNote(note);
  });
  return note;
}

function writeNote(next: Note) {
  persist(getNotesSnapshot().map((note) => (note.id === next.id ? next : note)));
  queueMicrotask(() => {
    void syncNote(next);
  });
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
  persist(next);
  for (const note of next) {
    if (note.cat === to && note.pending) {
      queueMicrotask(() => {
        void syncNote(note);
      });
    }
  }
}

export function deleteNote(id: string) {
  persist(getNotesSnapshot().filter((note) => note.id !== id));
  queueMicrotask(() => {
    void removeRemote(id);
  });
}

export function mergeRemote(rows: Note[]) {
  const local = getNotesSnapshot();
  const byId = new Map(local.map((note) => [note.id, note]));
  for (const row of rows) {
    const existing = byId.get(row.id);
    if (!existing || existing.created_at <= row.created_at) {
      byId.set(row.id, { ...row, pending: false });
    }
  }
  const merged = [...byId.values()].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
  persist(merged);
}

function queueOutbox(note: Note) {
  const box = readJson<Note[]>(OUTBOX_KEY, []);
  if (!box.some((item) => item.id === note.id)) {
    box.push(note);
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
  }
}

function clearOutboxItem(id: string) {
  const box = readJson<Note[]>(OUTBOX_KEY, []).filter((item) => item.id !== id);
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
}

export async function syncNote(note: Note): Promise<"synced" | "queued" | "skipped"> {
  if (!isSupabaseConfigured()) {
    queueOutbox(note);
    return "queued";
  }
  const supabase = createClient();
  if (!supabase) {
    queueOutbox(note);
    return "queued";
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    queueOutbox(note);
    return "queued";
  }

  const { error } = await supabase.from("notes").upsert({
    id: note.id,
    user_id: user.id,
    cat: note.cat,
    title: note.title,
    body: note.body,
    blocks: note.blocks,
    created_at: note.created_at,
    acted_at: note.acted_at,
  });

  if (error) {
    queueOutbox(note);
    return "queued";
  }

  clearOutboxItem(note.id);
  persist(
    getNotesSnapshot().map((item) =>
      item.id === note.id ? { ...item, user_id: user.id, pending: false } : item,
    ),
  );
  return "synced";
}

async function removeRemote(id: string) {
  const supabase = createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notes").delete().eq("id", id);
}

export async function ensurePond() {
  const supabase = createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from("ponds").select("id").limit(1);
  if (!data?.length) {
    await supabase.from("ponds").insert({ name: "Pond", user_id: user.id });
  }
}

export async function pullNotes() {
  const supabase = createClient();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("notes")
    .select("id, user_id, cat, title, body, blocks, created_at, acted_at")
    .order("created_at", { ascending: false });
  if (error || !data) return;
  mergeRemote(
    data
      .filter((row) => typeof row.cat === "string" && row.cat.trim().length > 0)
      .map((row) => ({
        ...row,
        cat: row.cat,
        blocks: Array.isArray(row.blocks) ? row.blocks.filter(isBlock) : [],
        pending: false,
      })),
  );
}

export async function flushOutbox() {
  const box = readJson<Note[]>(OUTBOX_KEY, []);
  for (const note of box) {
    await syncNote(note);
  }
}
