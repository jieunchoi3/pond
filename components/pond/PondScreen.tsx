"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { ActedBoard } from "@/components/pond/ActedBoard";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { CategoryBoard } from "@/components/pond/CategoryBoard";
import { CategorySidebar } from "@/components/pond/CategorySidebar";
import { NoteEditor } from "@/components/pond/NoteEditor";
import { PondCanvas } from "@/components/pond/PondCanvas";
import {
  SearchAndFilters,
  type FilterTag,
} from "@/components/pond/SearchAndFilters";
import { CATCH_MIN_DAYS, daysIdle, matchesQuery } from "@/lib/notes/fish";
import { dropPin, togglePin, usePinnedIds } from "@/lib/notes/pins";
import {
  addNote,
  deleteNote,
  getNotesSnapshot,
  getServerNotesSnapshot,
  markActed,
  patchNote,
  restoreNote,
  subscribeNotes,
} from "@/lib/notes/store";
import { hydratePond, installCloudBoot, flushPondSync, restoreLocalPond, refreshPondFromCloud } from "@/lib/notes/sync";
import { flushLocalPond } from "@/lib/notes/cache";
import type { PondCloudPayload } from "@/lib/notes/sync";
import { usePondCategories } from "@/lib/notes/categories";
import { actedNotes, openNotes } from "@/lib/notes/types";

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
  const [catchSkip, setCatchSkip] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedTag =
    tag === "all" || tag === "acted" || categories.some((item) => item.id === tag)
      ? tag
      : "all";
  const sheetOpenRef = useRef(false);
  const editingIdRef = useRef<string | null>(null);
  sheetOpenRef.current = sheetOpen;
  editingIdRef.current = editingId;

  useEffect(() => {
    void (async () => {
      await restoreLocalPond();
      await hydratePond();
    })();
    const onHide = () => {
      void flushLocalPond();
      flushPondSync();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        onHide();
        return;
      }
      if (sheetOpenRef.current || editingIdRef.current) return;
      void refreshPondFromCloud();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  const open = useMemo(() => openNotes(notes), [notes]);
  const acted = useMemo(() => actedNotes(notes), [notes]);

  const visibleNotes = useMemo(() => {
    return open.filter((note) => {
      if (selectedTag !== "all" && selectedTag !== "acted" && note.cat !== selectedTag) {
        return false;
      }
      return matchesQuery(note.title, note.body, note.cat, query);
    });
  }, [open, query, selectedTag]);

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

  function recastCatch(ids: string[]) {
    setCatchSkip((prev) => {
      const next = new Set([...prev, ...ids]);
      const remaining = visibleNotes.filter(
        (note) =>
          daysIdle(note.acted_at) >= CATCH_MIN_DAYS && !next.has(note.id),
      );
      if (remaining.length === 0) return [];
      return [...next];
    });
  }

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

  const browsingActed = selectedTag === "acted";
  const browsing = browsingActed
    ? null
    : (categories.find((item) => item.id === selectedTag) ?? null);
  const defaultCat = browsing?.id ?? categories[0]?.id ?? "ai art";
  const boardOpen = Boolean(editing || browsing || browsingActed);

  return (
    <div
      ref={rootRef}
      className={`relative flex h-dvh overflow-hidden ${
        boardOpen ? "bg-surface-2" : "bg-water-1"
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
        onAddNote={(cat) => {
          setTag(cat);
          const note = addNote({ cat, title: "", userId: null });
          openNote(note.id);
        }}
      />

      <div
        className={`flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden ${
          editing ? "p-3" : browsing || browsingActed ? "" : "gap-3 px-6 py-3"
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
            onRestore={() => {
              restoreNote(editing.id);
              setEditingId(null);
            }}
            onDelete={() => removeNote(editing.id)}
            onClose={() => {
              flushPondSync();
              setEditingId(null);
            }}
          />
        ) : browsing ? (
          <CategoryBoard
            category={browsing}
            notes={open.filter(
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
        ) : browsingActed ? (
          <ActedBoard
            notes={acted.filter((note) =>
              matchesQuery(note.title, note.body, note.cat, query),
            )}
            onOpen={openNote}
            onDelete={removeNote}
          />
        ) : (
          <>
            <SearchAndFilters
              query={query}
              tag={selectedTag}
              notes={open}
              onQueryChange={setQuery}
              onTagChange={selectCategory}
              onPickNote={openNote}
            />

            <CatchOfTheDay
              notes={visibleNotes}
              skippedIds={new Set(catchSkip)}
              onOpen={openNote}
              onRecast={recastCatch}
              onDelete={removeNote}
            />

            <div className="min-h-0 flex-1">
              <PondCanvas
                notes={open}
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
