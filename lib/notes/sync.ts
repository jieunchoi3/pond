import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applyRemoteCategories,
  getCategoriesSnapshot,
} from "@/lib/notes/categories";
import { applyRemotePins, getPinsSnapshot } from "@/lib/notes/pins";
import {
  applyRemoteNotes,
  getNotesSnapshot,
  isDemoNoteId,
  isNoteRecord,
  looksLikeDemoNotes,
} from "@/lib/notes/store";
import { readLocalPond } from "@/lib/notes/cache";
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
let dirty = false;
let pushTimer: number | null = null;
let lastPushAt = 0;
let pushing = false;

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

function noteTime(note: Note) {
  return Math.max(Date.parse(note.acted_at) || 0, Date.parse(note.created_at) || 0);
}

function mergeNotes(remote: Note[], local: Note[]): { notes: Note[]; localAhead: boolean } {
  const map = new Map<string, Note>();
  for (const note of remote) map.set(note.id, { ...note, pending: false });
  let localAhead = false;
  for (const note of local) {
    if (isDemoNoteId(note.id) && !map.has(note.id)) continue;
    const current = map.get(note.id);
    if (!current) {
      map.set(note.id, { ...note, pending: false });
      localAhead = true;
      continue;
    }
    if (note.pending || noteTime(note) > noteTime(current)) {
      map.set(note.id, { ...note, pending: false });
      localAhead = true;
    }
  }
  return { notes: [...map.values()], localAhead };
}

function mergeCategories(
  remote: PondCategory[],
  local: PondCategory[],
): { categories: PondCategory[]; localAhead: boolean } {
  if (remote.length === 0) return { categories: local, localAhead: local.length > 0 };
  const map = new Map(remote.map((item) => [item.id, item]));
  let localAhead = false;
  for (const item of local) {
    if (map.has(item.id)) continue;
    map.set(item.id, item);
    localAhead = true;
  }
  return { categories: [...map.values()], localAhead };
}

function mergePins(remote: string[], local: string[], noteIds: Set<string>) {
  return [...new Set([...remote, ...local])].filter((id) => noteIds.has(id));
}

function reconcile(payload: PondCloudPayload, localNotes: Note[]) {
  const notes = mergeNotes(payload.notes, localNotes);
  const categories = mergeCategories(payload.categories, getCategoriesSnapshot());
  const pins = mergePins(
    payload.pins,
    getPinsSnapshot(),
    new Set(notes.notes.map((note) => note.id)),
  );
  return {
    payload: {
      notes: notes.notes,
      categories: categories.categories,
      pins,
      ready: true,
      updated_at: payload.updated_at,
    } satisfies PondCloudPayload,
    localAhead: notes.localAhead || categories.localAhead,
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
  booted = true;
  if (typeof window !== "undefined") {
    const local = getNotesSnapshot();
    if (local.length > 0) {
      if (payload && (payload.ready || payload.notes.length > 0)) {
        const next = reconcile(payload, local);
        applyPayload(next.payload);
        lastPushAt = Date.parse(payload.updated_at) || Date.now();
        if (next.localAhead) dirty = true;
        return;
      }
      dirty = !looksLikeDemoNotes(local);
      return;
    }
  }
  if (!payload) return;
  if (!payload.ready && payload.notes.length === 0) return;
  applyPayload(payload);
  lastPushAt = Date.parse(payload.updated_at) || Date.now();
}

export function schedulePondSync() {
  if (!isSupabaseConfigured()) return;
  if (typeof window === "undefined") return;
  dirty = true;
  if (applying || !cloudReady) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushPondState();
  }, 450);
}

export function flushPondSync() {
  if (!isSupabaseConfigured()) return;
  if (typeof window === "undefined") return;
  dirty = true;
  if (applying || !cloudReady) return;
  if (pushTimer) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
  void pushPondState();
}

async function pushPondState() {
  if (pushing) {
    dirty = true;
    return;
  }
  pushing = true;
  dirty = false;
  const payload = snapshotPayload();
  const hiding =
    typeof document !== "undefined" && document.visibilityState !== "visible";
  let failed = false;

  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/pond", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: payload.notes,
          categories: payload.categories,
          pins: payload.pins,
        }),
        keepalive: hiding,
      });
      if (!res.ok) {
        failed = true;
        dirty = true;
        console.warn("pond sync failed", res.status);
        return;
      }
      lastPushAt = Date.parse(payload.updated_at);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("pond_state").upsert(payload, { onConflict: "id" });
    if (error) {
      failed = true;
      dirty = true;
      console.warn("pond sync failed", error.message);
      return;
    }
    lastPushAt = Date.parse(payload.updated_at);
  } catch (error) {
    failed = true;
    dirty = true;
    console.warn("pond sync failed", error);
  } finally {
    pushing = false;
    if (failed) {
      if (typeof window !== "undefined") {
        if (pushTimer) window.clearTimeout(pushTimer);
        pushTimer = window.setTimeout(() => {
          pushTimer = null;
          void pushPondState();
        }, 1500);
      }
    } else if (dirty && cloudReady) {
      void pushPondState();
    }
  }
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

export async function restoreLocalPond() {
  if (typeof window === "undefined") return;
  const disk = await readLocalPond();
  if (!disk || disk.notes.length === 0) return;
  const next = reconcile(
    {
      notes: disk.notes,
      categories: disk.categories,
      pins: disk.pins,
      ready: true,
      updated_at: new Date().toISOString(),
    },
    getNotesSnapshot(),
  );
  applyPayload(next.payload);
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
  cloudReady = true;
  if (dirty) void pushPondState();
  const remote = await readRemote();
  const local = getNotesSnapshot();
  if (remote === "error") {
    if (dirty) await pushPondState();
    return;
  }
  if (remote) {
    const payload = payloadFromRow(remote);
    if (payload.notes.length > 0 || payload.ready) {
      const next = reconcile(payload, local);
      applyPayload(next.payload);
      lastPushAt = Date.parse(payload.updated_at) || Date.now();
      if (next.localAhead || dirty) await pushPondState();
      return;
    }
  }
  if (dirty || (local.length > 0 && !looksLikeDemoNotes(local))) {
    await pushPondState();
  }
}

export async function refreshPondFromCloud() {
  if (!cloudReady || applying || dirty) return;
  const remote = await readRemote();
  if (!remote || remote === "error") return;
  const payload = payloadFromRow(remote);
  if (payload.notes.length === 0) return;
  const remoteAt = Date.parse(payload.updated_at) || 0;
  if (remoteAt <= lastPushAt) return;
  const next = reconcile(payload, getNotesSnapshot());
  applyPayload(next.payload);
  lastPushAt = remoteAt;
  if (next.localAhead) void pushPondState();
}
