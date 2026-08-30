import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applyRemoteCategories,
  getCategoriesSnapshot,
} from "@/lib/notes/categories";
import { applyRemotePins, getPinsSnapshot } from "@/lib/notes/pins";
import {
  applyRemoteNotes,
  getNotesSnapshot,
  isNoteRecord,
} from "@/lib/notes/store";
import type { Note, PondCategory } from "@/lib/notes/types";

const STATE_ID = "default";

type PondStateRow = {
  id: string;
  notes: unknown;
  categories: unknown;
  pins: unknown;
  ready: boolean;
  updated_at: string;
};

let cloudReady = false;
let applying = false;
let pushTimer: number | null = null;
let lastPushAt = 0;

function isCategory(value: unknown): value is PondCategory {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PondCategory>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    typeof item.fishKey === "string" &&
    item.fishKey.length > 0
  );
}

function parseNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isNoteRecord).map((note) => ({
    ...note,
    title: note.title ?? "",
    body: note.body ?? "",
    blocks: Array.isArray(note.blocks) ? note.blocks : [],
    pending: false,
  }));
}

function parseCategories(value: unknown): PondCategory[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isCategory);
}

function parsePins(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function snapshotPayload() {
  return {
    id: STATE_ID,
    notes: getNotesSnapshot().map((note) => ({ ...note, pending: false })),
    categories: getCategoriesSnapshot(),
    pins: getPinsSnapshot(),
    ready: true,
    updated_at: new Date().toISOString(),
  };
}

export function schedulePondSync() {
  if (applying || !cloudReady || !isSupabaseConfigured()) return;
  if (typeof window === "undefined") return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushPondState();
  }, 450);
}

async function pushPondState() {
  const supabase = createClient();
  if (!supabase) return;
  const payload = snapshotPayload();
  const { error } = await supabase.from("pond_state").upsert(payload);
  if (error) {
    console.warn("pond sync failed", error.message);
    return;
  }
  lastPushAt = Date.parse(payload.updated_at);
}

async function readRemote(): Promise<PondStateRow | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pond_state")
    .select("id, notes, categories, pins, ready, updated_at")
    .eq("id", STATE_ID)
    .maybeSingle();
  if (error || !data) return null;
  return data as PondStateRow;
}

function applyRow(row: PondStateRow) {
  applying = true;
  try {
    applyRemoteNotes(parseNotes(row.notes));
    applyRemoteCategories(parseCategories(row.categories));
    applyRemotePins(parsePins(row.pins));
  } finally {
    applying = false;
  }
}

export async function hydratePond() {
  if (!isSupabaseConfigured()) {
    cloudReady = true;
    return;
  }
  const remote = await readRemote();
  if (remote?.ready) {
    applyRow(remote);
    lastPushAt = Date.parse(remote.updated_at) || Date.now();
    cloudReady = true;
    return;
  }
  cloudReady = true;
  await pushPondState();
}

export async function refreshPondFromCloud() {
  if (!cloudReady || applying) return;
  const remote = await readRemote();
  if (!remote?.ready) return;
  const remoteAt = Date.parse(remote.updated_at) || 0;
  if (remoteAt <= lastPushAt) return;
  applyRow(remote);
  lastPushAt = remoteAt;
}
