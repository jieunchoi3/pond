"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { LilyTab } from "@/components/pond/LilyPads";
import { NoteEditor } from "@/components/pond/NoteEditor";
import { PondCanvas } from "@/components/pond/PondCanvas";
import {
  SearchAndFilters,
  type FilterTag,
} from "@/components/pond/SearchAndFilters";
import { matchesQuery } from "@/lib/notes/fish";
import {
  addNote,
  deleteNote,
  ensurePond,
  flushOutbox,
  getNotesSnapshot,
  getServerNotesSnapshot,
  markActed,
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
  const [showCatch, setShowCatch] = useState(true);
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

  const visibleNotes = useMemo(() => {
    return notes.filter((note) => {
      if (tag !== "all" && note.cat !== tag) return false;
      return matchesQuery(note.title, note.body, note.cat, query);
    });
  }, [notes, query, tag]);

  const visibleIds = useMemo(
    () => new Set(visibleNotes.map((note) => note.id)),
    [visibleNotes],
  );

  const editing = notes.find((note) => note.id === editingId) ?? null;
  const [narrow, setNarrow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setNarrow(root.offsetWidth < 720);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  function openCapture() {
    sheetRef.current?.open();
  }

  function saveSpark(input: { cat: (typeof notes)[number]["cat"]; text: string }, open: boolean) {
    const note = addNote({ cat: input.cat, text: input.text, userId: null });
    if (open) setEditingId(note.id);
  }

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-water-1">
      <LilyTab open={showCatch} onToggle={() => setShowCatch((value) => !value)} />

      <div className="mx-auto flex min-h-0 w-full max-w-(--page-max) flex-1 flex-col gap-3 overflow-hidden px-6 py-3">
        {isSupabaseConfigured() ? (
          <MagicLinkForm email={email} onSignedOut={() => setEmail(null)} />
        ) : null}

        <SearchAndFilters
          query={query}
          tag={tag}
          notes={notes}
          onQueryChange={setQuery}
          onTagChange={setTag}
          onPickNote={setEditingId}
        />

        {showCatch ? (
          <CatchOfTheDay notes={visibleNotes} onOpen={setEditingId} onRecast={recastNote} />
        ) : null}

        <div className="min-h-0 flex-1">
          <PondCanvas notes={notes} visible={visibleIds} onOpen={setEditingId} onCapture={openCapture} />
        </div>
      </div>

      <CaptureSheet
        ref={sheetRef}
        onRelease={(input) => saveSpark(input, false)}
        onOpenIt={(input) => saveSpark(input, true)}
      />

      {editing ? (
        <NoteEditor
          note={editing}
          narrow={narrow}
          onChange={(next) => patchNote(editing.id, next)}
          onActed={() => {
            markActed(editing.id);
            setEditingId(null);
          }}
          onDelete={() => {
            deleteNote(editing.id);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </div>
  );
}
