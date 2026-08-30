"use client";

import { useSyncExternalStore } from "react";

const KEY = "pond.pins.v1";
const EVENT = "pond-pins";
const DEFAULT_PINS = ["n2", "n3", "n7", "n8"];

let snapshot: string[] = DEFAULT_PINS;
let hydrated = false;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PINS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_PINS;
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return DEFAULT_PINS;
  }
}

function persist(next: string[], sync = true) {
  snapshot = next;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
  if (sync) {
    queueMicrotask(() => {
      void import("@/lib/notes/sync").then((mod) => mod.schedulePondSync());
    });
  }
}

export function subscribePins(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getPinsSnapshot(): string[] {
  if (!hydrated && typeof window !== "undefined") {
    snapshot = read();
    if (!window.localStorage.getItem(KEY)) {
      window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    }
    hydrated = true;
  }
  return snapshot;
}

export function getServerPinsSnapshot(): string[] {
  return DEFAULT_PINS;
}

export function usePinnedIds() {
  return useSyncExternalStore(subscribePins, getPinsSnapshot, getServerPinsSnapshot);
}

export function togglePin(id: string) {
  const current = getPinsSnapshot();
  persist(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

export function dropPin(id: string) {
  persist(getPinsSnapshot().filter((item) => item !== id));
}

export function applyRemotePins(next: string[]) {
  persist(next, false);
  hydrated = true;
}
