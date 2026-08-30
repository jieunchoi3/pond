import { CATS, type Cat, type Note } from "@/lib/notes/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const NOTES_KEY = "pond.notes.v1";
const OUTBOX_KEY = "pond.outbox.v1";
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

export function getNotesSnapshot(): Note[] {
  if (!hydrated && typeof window !== "undefined") {
    snapshot = readJson<Note[]>(NOTES_KEY, []);
    hydrated = true;
  }
  return snapshot;
}

export function getServerNotesSnapshot(): Note[] {
  return [];
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
        blocks: Array.isArray(row.blocks) ? row.blocks : [],
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
