import type { Note, PondCategory } from "@/lib/notes/types";

const DB_NAME = "pond-cache";
const STORE = "kv";
const KEY = "pond.snapshot.v1";

export type LocalPondSnapshot = {
  notes: Note[];
  categories: PondCategory[];
  pins: string[];
};

let memory: LocalPondSnapshot | null = null;
let writeTimer: number | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> | null {
  if (typeof indexedDB === "undefined") return null;
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("indexedDB open failed"));
    };
  });
  return dbPromise;
}

export function rememberLocalPond(partial: Partial<LocalPondSnapshot>, immediate = false) {
  memory = {
    notes: partial.notes ?? memory?.notes ?? [],
    categories: partial.categories ?? memory?.categories ?? [],
    pins: partial.pins ?? memory?.pins ?? [],
  };
  if (typeof window === "undefined") return;
  if (immediate) {
    if (writeTimer) {
      window.clearTimeout(writeTimer);
      writeTimer = null;
    }
    void flushLocalPond();
    return;
  }
  if (writeTimer) window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    writeTimer = null;
    void flushLocalPond();
  }, 50);
}

export async function flushLocalPond() {
  if (!memory) return;
  const dbp = openDb();
  if (!dbp) return;
  try {
    const db = await dbp;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(memory, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB write failed"));
    });
  } catch {
    // Private mode can block IndexedDB; memory/cloud still hold the pond.
  }
}

export function pondSnapshotTooHeavy(disk: LocalPondSnapshot, limit = 1_200_000) {
  let chars = 0;
  for (const note of disk.notes) {
    for (const block of note.blocks ?? []) {
      if (typeof block.content !== "string") continue;
      chars += block.content.length;
      if (chars > limit) return true;
    }
  }
  return false;
}

export async function readLocalPond(): Promise<LocalPondSnapshot | null> {
  if (memory?.notes.length) return memory;
  const dbp = openDb();
  if (!dbp) return null;
  try {
    const db = await dbp;
    const row = await new Promise<LocalPondSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => {
        const value = req.result as LocalPondSnapshot | undefined;
        resolve(value && Array.isArray(value.notes) ? value : null);
      };
      req.onerror = () => reject(req.error ?? new Error("indexedDB read failed"));
    });
    if (row) memory = row;
    return row;
  } catch {
    return null;
  }
}
