import { CATS, type Cat, type Note } from "@/lib/notes/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const NOTES_KEY = "pond.notes.v2";
const OUTBOX_KEY = "pond.outbox.v2";
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
    id: "seed-bubble",
    user_id: null,
    cat: "ai art",
    title: "Bubble dream",
    body: "A girl walking through a city of soap bubbles, wearing a bright white shirt with a dotted collar.",
    blocks: [],
    created_at: daysAgo(14),
    acted_at: daysAgo(2),
    pending: false,
  },
  {
    id: "seed-commit",
    user_id: null,
    cat: "vibe coding",
    title: "First commit of the day",
    body: "Ship the pond layout before noon. Pretendard for Korean, Inria for the titles.",
    blocks: [],
    created_at: daysAgo(6),
    acted_at: daysAgo(1),
    pending: false,
  },
  {
    id: "seed-melody",
    user_id: null,
    cat: "music",
    title: "새벽 멜로디",
    body: "창문을 열어두면 멀리서 기타가 들린다. 그 음을 메모해 두고 밤에 다시 켠다.",
    blocks: [],
    created_at: daysAgo(9),
    acted_at: daysAgo(5),
    pending: false,
  },
  {
    id: "seed-question",
    user_id: null,
    cat: "vibe coding",
    title: "연못에 던진 질문",
    body: "아이디어가 가라앉기 전에 던져 넣기. 고기가 되면 나중에 건져 올린다.",
    blocks: [],
    created_at: daysAgo(20),
    acted_at: daysAgo(12),
    pending: false,
  },
  {
    id: "seed-recast",
    user_id: null,
    cat: "ai art",
    title: "Koi sketch, recast",
    body: "Last week’s vermilion koi, redrawn without the sticker shadow. Keep the white body; let it sit in the water.",
    blocks: [],
    created_at: daysAgo(10),
    acted_at: daysAgo(0),
    pending: false,
  },
  {
    id: "seed-blush",
    user_id: null,
    cat: "ai art",
    title: "분홍 비늘",
    body: "연못 가장자리에 분홍 잉어가 머문다. 아직 제목도 없는 스케치.",
    blocks: [],
    created_at: daysAgo(28),
    acted_at: daysAgo(21),
    pending: false,
  },
  {
    id: "seed-loop",
    user_id: null,
    cat: "music",
    title: "Three-color loop",
    body: "A bass line that never resolves. Leave it swimming until Friday.",
    blocks: [],
    created_at: daysAgo(50),
    acted_at: daysAgo(43),
    pending: false,
  },
  {
    id: "seed-honey",
    user_id: null,
    cat: "vibe coding",
    title: "Honey hour",
    body: "Late light on the water. A small carp, a smaller task: write one sentence and stop.",
    blocks: [],
    created_at: daysAgo(16),
    acted_at: daysAgo(8),
    pending: false,
  },
];

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return (
    typeof note.id === "string" &&
    isCat(String(note.cat ?? "")) &&
    typeof note.created_at === "string" &&
    !Number.isNaN(Date.parse(note.created_at))
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

function isBlock(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const block = value as { type?: string };
  return block.type === "image" || block.type === "youtube" || block.type === "audio";
}

export function isCat(value: string): value is Cat {
  return (CATS as readonly string[]).includes(value);
}

export function splitSpark(text: string): { title: string; body: string } {
  const trimmed = text.replace(/\s+$/g, "").replace(/^\s+/, "");
  const newline = trimmed.indexOf("\n");
  if (newline === -1) return { title: "", body: trimmed };
  return {
    title: trimmed.slice(0, newline).trim(),
    body: trimmed.slice(newline + 1).trim(),
  };
}

export function addNote(input: { cat: Cat; text: string; userId: string | null }): Note {
  const now = new Date().toISOString();
  const { title, body } = splitSpark(input.text);
  const note: Note = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    cat: input.cat,
    title,
    body,
    blocks: [],
    created_at: now,
    acted_at: now,
    pending: true,
  };
  persist([note, ...getNotesSnapshot()]);
  queueMicrotask(() => {
    void syncNote(note);
  });
  return note;
}

export function patchNote(id: string, patch: Partial<Pick<Note, "title" | "body" | "cat" | "blocks">>) {
  const now = new Date().toISOString();
  persist(
    getNotesSnapshot().map((note) =>
      note.id === id ? { ...note, ...patch, acted_at: now, pending: true } : note,
    ),
  );
  const next = getNotesSnapshot().find((note) => note.id === id);
  if (next) {
    queueMicrotask(() => {
      void syncNote(next);
    });
  }
}

export function recastNote(id: string) {
  patchNote(id, {});
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
      .filter((row) => isCat(row.cat))
      .map((row) => ({
        ...row,
        cat: row.cat as Cat,
        blocks: Array.isArray(row.blocks) ? row.blocks.filter(isBlock) as Note["blocks"] : [],
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
