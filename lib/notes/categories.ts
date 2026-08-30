"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CATEGORIES, type PondCategory } from "@/lib/notes/types";

const KEY = "pond.categories.v1";
const EVENT = "pond-categories";

let snapshot: PondCategory[] = DEFAULT_CATEGORIES;
let hydrated = false;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function read(): PondCategory[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    const valid = parsed.filter(isPondCategory);
    return valid.length > 0 ? valid : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function isPondCategory(value: unknown): value is PondCategory {
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

function persist(next: PondCategory[]) {
  snapshot = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function subscribeCategories(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getCategoriesSnapshot(): PondCategory[] {
  if (!hydrated && typeof window !== "undefined") {
    snapshot = read();
    if (!window.localStorage.getItem(KEY)) {
      window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    }
    hydrated = true;
  }
  return snapshot;
}

export function getServerCategoriesSnapshot(): PondCategory[] {
  return DEFAULT_CATEGORIES;
}

export function usePondCategories() {
  return useSyncExternalStore(
    subscribeCategories,
    getCategoriesSnapshot,
    getServerCategoriesSnapshot,
  );
}

export function categoryById(id: string): PondCategory | undefined {
  return getCategoriesSnapshot().find((item) => item.id === id);
}

export function categoryName(id: string): string {
  return categoryById(id)?.name ?? id;
}

function takenNames(exceptId?: string) {
  return new Set(
    getCategoriesSnapshot()
      .filter((item) => item.id !== exceptId)
      .map((item) => item.name.trim().toLowerCase()),
  );
}

export function addCategory(name: string, fishKey: string): PondCategory | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (takenNames().has(trimmed.toLowerCase())) return null;
  const next: PondCategory = {
    id: crypto.randomUUID(),
    name: trimmed,
    fishKey: fishKey ?? "goldfish-yellow",
  };
  persist([...getCategoriesSnapshot(), next]);
  return next;
}

export function renameCategory(id: string, name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (takenNames(id).has(trimmed.toLowerCase())) return false;
  persist(
    getCategoriesSnapshot().map((item) => (item.id === id ? { ...item, name: trimmed } : item)),
  );
  return true;
}

export function setCategoryFish(id: string, fishKey: string) {
  persist(
    getCategoriesSnapshot().map((item) => (item.id === id ? { ...item, fishKey } : item)),
  );
}

export function deleteCategory(id: string): PondCategory | null {
  const list = getCategoriesSnapshot();
  if (list.length <= 1) return null;
  const fallback = list.find((item) => item.id !== id);
  if (!fallback) return null;
  persist(list.filter((item) => item.id !== id));
  return fallback;
}
