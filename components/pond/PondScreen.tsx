"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CaptureButton } from "@/components/pond/CaptureButton";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { NoteEditor } from "@/components/pond/NoteEditor";
import { PondCanvas } from "@/components/pond/PondCanvas";
import { SearchAndFilters } from "@/components/pond/SearchAndFilters";
import {
  createNote,
  getNotesSnapshot,
  getServerNotesSnapshot,
  matchesQuery,
  subscribeNotes,
  writeNotes,
  type Note,
  type NoteTag,
  type Tag,
} from "@/lib/notes";

export function PondScreen() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getServerNotesSnapshot,
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<Tag>("all");
  const [canvasMode, setCanvasMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return notes.filter((note) => {
      if (tag !== "all" && note.tag !== tag) return false;
      return matchesQuery(note, query);
    });
  }, [notes, query, tag]);

  const featured = visible.filter((note) => note.featured);
  const recastCount = featured.filter((note) => note.recast).length;
  const editing = notes.find((note) => note.id === editingId) ?? null;

  function openNote(id: string) {
    setEditingId(id);
  }

  function capture(preferredTag?: NoteTag) {
    const nextTag =
      preferredTag ?? (tag === "all" ? "vibe coding" : tag);
    const note = createNote(nextTag, notes);
    writeNotes([note, ...notes]);
    setEditingId(note.id);
  }

  function updateNote(id: string, patch: Partial<Note>) {
    writeNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, ...patch, updatedAt: new Date().toISOString(), daysUntouched: 0 }
          : note,
      ),
    );
  }

  function closeEditor() {
    if (editing && !editing.title.trim() && !editing.body.trim() && !editing.imageDataUrl) {
      writeNotes(notes.filter((note) => note.id !== editing.id));
    }
    setEditingId(null);
  }

  return (
    <div className="relative min-h-screen bg-surface pb-32">
      <div className="mx-auto w-full max-w-[1392px] px-6 py-8">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="type-caption mb-1">ideas, left in the water</p>
            <h1 className="type-display">Pond</h1>
          </div>
          <button
            type="button"
            onClick={() => setCanvasMode((value) => !value)}
            aria-pressed={canvasMode}
            className="type-label rounded-pill border border-line px-4 py-2 text-ink transition-colors hover:bg-surface-2"
          >
            canvas mode
          </button>
        </header>

        <SearchAndFilters
          query={query}
          tag={tag}
          onQueryChange={setQuery}
          onTagChange={setTag}
        />

        {!canvasMode ? (
          <CatchOfTheDay
            notes={featured}
            recastCount={recastCount}
            query={query}
            onOpen={openNote}
            onCapture={() => capture()}
          />
        ) : null}

        <PondCanvas
          notes={visible}
          canvasMode={canvasMode}
          onOpen={openNote}
        />
      </div>

      {editing ? null : <CaptureButton onClick={() => capture()} />}

      {editing ? (
        <NoteEditor
          note={editing}
          onChange={(patch) => updateNote(editing.id, patch)}
          onClose={closeEditor}
        />
      ) : null}
    </div>
  );
}
