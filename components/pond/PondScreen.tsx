"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { CaptureButton } from "@/components/capture/CaptureButton";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { NoteEditor } from "@/components/pond/NoteEditor";
import { PondCanvas } from "@/components/pond/PondCanvas";
import {
  SearchAndFilters,
  type FilterTag,
} from "@/components/pond/SearchAndFilters";
import { matchesQuery } from "@/lib/notes/fish";
import {
  addNote,
  ensurePond,
  flushOutbox,
  getNotesSnapshot,
  getServerNotesSnapshot,
  patchNote,
  pullNotes,
  recastNote,
  subscribeNotes,
} from "@/lib/notes/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function PondScreen() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getServerNotesSnapshot,
  );
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<FilterTag>("all");
  const [canvasMode, setCanvasMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    async function hydrate(userId: string | null) {
      if (!userId) {
        setEmail(null);
        return;
      }
      const { data } = await client.auth.getUser();
      if (cancelled) return;
      setEmail(data.user?.email ?? null);
      await ensurePond();
      await flushOutbox();
      await pullNotes();
    }

    client.auth.getSession().then(({ data }) => {
      if (!cancelled) void hydrate(data.session?.user.id ?? null);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void hydrate(session?.user.id ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const visible = useMemo(() => {
    return notes.filter((note) => {
      if (tag !== "all" && note.cat !== tag) return false;
      return matchesQuery(note.title, note.body, note.cat, query);
    });
  }, [notes, query, tag]);

  const editing = notes.find((note) => note.id === editingId) ?? null;

  function openCapture() {
    sheetRef.current?.open();
  }

  return (
    <div className="relative min-h-screen bg-surface pb-32">
      <div className="mx-auto w-full max-w-(--page-max) px-6 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-caption mb-1">ideas, left in the water</p>
            <h1 className="type-display">Pond</h1>
          </div>
          <button
            type="button"
            onClick={() => setCanvasMode((value) => !value)}
            aria-pressed={canvasMode}
            className="type-label rounded-pill border border-line px-4 py-2 text-ink"
          >
            canvas mode
          </button>
        </header>

        <div className="mb-6">
          <MagicLinkForm email={email} onSignedOut={() => setEmail(null)} />
          {isSupabaseConfigured() && !email ? (
            <p className="type-caption mt-2">sign in so a release lands in the notes table</p>
          ) : null}
        </div>

        <SearchAndFilters
          query={query}
          tag={tag}
          onQueryChange={setQuery}
          onTagChange={setTag}
        />

        {canvasMode ? null : (
          <CatchOfTheDay
            notes={visible}
            onOpen={setEditingId}
            onRecast={recastNote}
          />
        )}

        <PondCanvas notes={visible} canvasMode={canvasMode} onOpen={setEditingId} />
      </div>

      {editing ? null : <CaptureButton onClick={openCapture} />}
      <CaptureSheet
        ref={sheetRef}
        onRelease={({ cat, text }) => {
          addNote({ cat, text, userId: null });
        }}
      />
      {editing ? (
        <NoteEditor
          note={editing}
          onChange={(patch) => patchNote(editing.id, patch)}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </div>
  );
}
