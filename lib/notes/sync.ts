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
  looksLikeDemoNotes,
} from "@/lib/notes/store";
import type { Note, PondCategory } from "@/lib/notes/types";

const STATE_ID = "default";

export type PondCloudPayload = {
  notes: Note[];
  categories: PondCategory[];
  pins: string[];
  ready: boolean;
  updated_at: string;
};

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
let booted = false;
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

export function payloadFromRow(row: PondStateRow): PondCloudPayload {
  return {
    notes: parseNotes(row.notes),
    categories: parseCategories(row.categories),
    pins: parsePins(row.pins),
    ready: row.ready,
    updated_at: row.updated_at,
  };
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

function applyPayload(payload: PondCloudPayload) {
  applying = true;
  try {
    applyRemoteNotes(payload.notes);
    applyRemoteCategories(payload.categories);
    applyRemotePins(payload.pins);
  } finally {
    applying = false;
  }
}

export function installCloudBoot(payload: PondCloudPayload | null) {
  if (booted) return;
  if (!payload) return;
  if (!payload.ready && payload.notes.length === 0) return;
  booted = true;
  applyPayload(payload);
  lastPushAt = Date.parse(payload.updated_at) || Date.now();
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
  const payload = snapshotPayload();

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/pond", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: payload.notes,
          categories: payload.categories,
          pins: payload.pins,
        }),
      });
      if (!res.ok) {
        console.warn("pond sync failed", res.status);
        return;
      }
      lastPushAt = Date.parse(payload.updated_at);
    } catch (error) {
      console.warn("pond sync failed", error);
    }
    return;
  }

  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("pond_state").upsert(payload, { onConflict: "id" });
  if (error) {
    console.warn("pond sync failed", error.message);
    return;
  }
  lastPushAt = Date.parse(payload.updated_at);
}

async function readRemote(): Promise<PondStateRow | null | "error"> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/pond", { cache: "no-store" });
      if (!res.ok) return "error";
      const data = (await res.json()) as PondStateRow;
      if (!data || typeof data !== "object") return "error";
      return data;
    } catch {
      return "error";
    }
  }

  const supabase = createClient();
  if (!supabase) return "error";
  const { data, error } = await supabase
    .from("pond_state")
    .select("id, notes, categories, pins, ready, updated_at")
    .eq("id", STATE_ID)
    .maybeSingle();
  if (error) return "error";
  return (data as PondStateRow | null) ?? null;
}

export async function loadPondState(): Promise<PondCloudPayload | null> {
  const row = await readRemote();
  if (!row || row === "error") return null;
  const payload = payloadFromRow(row);
  if (!payload.ready && payload.notes.length === 0) return null;
  return payload;
}

export async function hydratePond() {
  if (!isSupabaseConfigured()) {
    cloudReady = true;
    return;
  }
  const remote = await readRemote();
  if (remote === "error") {
    // Keep SSR/local notes. A failed read must never push and wipe the cloud.
    cloudReady = true;
    return;
  }
  const local = getNotesSnapshot();
  if (remote) {
    const payload = payloadFromRow(remote);
    if (payload.notes.length > 0) {
      applyPayload(payload);
      lastPushAt = Date.parse(payload.updated_at) || Date.now();
      cloudReady = true;
      return;
    }
    if (payload.ready) {
      cloudReady = true;
      if (local.length > 0 && !looksLikeDemoNotes(local)) {
        await pushPondState();
      }
      return;
    }
  }
  cloudReady = true;
  if (local.length > 0 && !looksLikeDemoNotes(local)) {
    await pushPondState();
  }
}

export async function refreshPondFromCloud() {
  if (!cloudReady || applying) return;
  const remote = await readRemote();
  if (!remote || remote === "error") return;
  const payload = payloadFromRow(remote);
  if (payload.notes.length === 0) return;
  const remoteAt = Date.parse(payload.updated_at) || 0;
  if (remoteAt <= lastPushAt) return;
  applyPayload(payload);
  lastPushAt = remoteAt;
}
