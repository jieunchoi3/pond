"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { CategoryBoard } from "@/components/pond/CategoryBoard";
import { CategorySidebar } from "@/components/pond/CategorySidebar";
import { NoteEditor } from "@/components/pond/NoteEditor";
import { PondCanvas } from "@/components/pond/PondCanvas";
import {
  SearchAndFilters,
  type FilterTag,
} from "@/components/pond/SearchAndFilters";
import { matchesQuery } from "@/lib/notes/fish";
import { dropPin, togglePin, usePinnedIds } from "@/lib/notes/pins";
import {
  addNote,
  deleteNote,
  getNotesSnapshot,
  getServerNotesSnapshot,
  markActed,
  patchNote,
  recastNote,
  subscribeNotes,
} from "@/lib/notes/store";
import { hydratePond, installCloudBoot, refreshPondFromCloud } from "@/lib/notes/sync";
import type { PondCloudPayload } from "@/lib/notes/sync";
import { usePondCategories } from "@/lib/notes/categories";

export function PondScreen({ initial }: { initial: PondCloudPayload | null }) {
  installCloudBoot(initial);
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    () => initial?.notes ?? getServerNotesSnapshot(),
  );
  const categories = usePondCategories();
  const pinnedIds = usePinnedIds();
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<FilterTag>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedTag =
    tag === "all" || categories.some((item) => item.id === tag) ? tag : "all";
  const sheetOpenRef = useRef(false);
  const editingIdRef = useRef<string | null>(null);
  sheetOpenRef.current = sheetOpen;
  editingIdRef.current = editingId;

  useEffect(() => {
    void hydratePond();
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (sheetOpenRef.current || editingIdRef.current) return;
      void refreshPondFromCloud();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  const visibleNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedTag !== "all" && note.cat !== selectedTag) return false;
      return matchesQuery(note.title, note.body, note.cat, query);
    });
  }, [notes, query, selectedTag]);

  const visibleIds = useMemo(
    () => new Set(visibleNotes.map((note) => note.id)),
    [visibleNotes],
  );

  const editing = notes.find((note) => note.id === editingId) ?? null;
  const [narrow, setNarrow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wasNarrow = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const isNarrow = root.offsetWidth < 720;
      setNarrow(isNarrow);
      if (isNarrow && !wasNarrow.current) setSidebarOpen(false);
      wasNarrow.current = isNarrow;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  function openCapture() {
    sheetRef.current?.open();
  }

  function saveSpark(input: {
    cat: (typeof notes)[number]["cat"];
    title: string;
    body: string;
    blocks: (typeof notes)[number]["blocks"];
  }) {
    addNote({
      cat: input.cat,
      title: input.title,
      body: input.body,
      blocks: input.blocks,
      userId: null,
    });
  }

  function openNote(id: string) {
    setEditingId(id);
    if (narrow) setSidebarOpen(false);
  }

  function selectCategory(next: FilterTag) {
    setTag(next);
    setEditingId(null);
    if (narrow) setSidebarOpen(false);
  }

  function removeNote(id: string) {
    dropPin(id);
    deleteNote(id);
    if (editingId === id) setEditingId(null);
  }

  const browsing = categories.find((item) => item.id === selectedTag) ?? null;
  const defaultCat = browsing?.id ?? categories[0]?.id ?? "ai art";

  return (
    <div
      ref={rootRef}
      className={`relative flex h-dvh overflow-hidden ${
        editing || browsing ? "bg-surface-2" : "bg-water-1"
      }`}
    >
      <CategorySidebar
        open={sidebarOpen}
        selected={selectedTag}
        editingId={editingId}
        notes={notes}
        query={query}
        narrow={narrow}
        onToggle={() => setSidebarOpen((value) => !value)}
        onSelect={(id) => selectCategory(selectedTag === id ? "all" : id)}
        onOpenNote={openNote}
        onDeleteNote={removeNote}
        onAddNote={(cat, title) => {
          const note = addNote({ cat, title, userId: null });
          setTag(cat);
          openNote(note.id);
        }}
      />

      <div
        className={`flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden ${
          editing ? "p-3" : browsing ? "" : "gap-3 px-6 py-3"
        }`}
      >
        {editing ? (
          <NoteEditor
            key={editing.id}
            note={editing}
            narrow={narrow}
            onChange={(next) => patchNote(editing.id, next)}
            onActed={() => {
              markActed(editing.id);
              setEditingId(null);
            }}
            onDelete={() => removeNote(editing.id)}
            onClose={() => setEditingId(null)}
          />
        ) : browsing ? (
          <CategoryBoard
            category={browsing}
            notes={notes.filter(
              (note) =>
                note.cat === browsing.id &&
                matchesQuery(note.title, note.body, note.cat, query),
            )}
            pinnedIds={pinnedIds}
            onOpen={openNote}
            onDelete={removeNote}
            onTogglePin={togglePin}
            onCapture={openCapture}
          />
        ) : (
          <>
            <SearchAndFilters
              query={query}
              tag={selectedTag}
              notes={notes}
              onQueryChange={setQuery}
              onTagChange={selectCategory}
              onPickNote={openNote}
            />

            <CatchOfTheDay
              notes={visibleNotes}
              onOpen={openNote}
              onRecast={recastNote}
              onDelete={removeNote}
            />

            <div className="min-h-0 flex-1">
              <PondCanvas
                notes={notes}
                visible={visibleIds}
                paused={sheetOpen}
                onOpen={openNote}
                onCapture={openCapture}
              />
            </div>
          </>
        )}
      </div>

      <CaptureSheet
        ref={sheetRef}
        defaultCat={defaultCat}
        onOpenChange={setSheetOpen}
        onRelease={saveSpark}
      />
    </div>
  );
}
