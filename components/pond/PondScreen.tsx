"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
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
import { matchesQuery, NARROW_BREAKPOINT } from "@/lib/notes/fish";
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
  subscribeNotes,
} from "@/lib/notes/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function PondScreen() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getServerNotesSnapshot,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<FilterTag>(null);
  const [seed, setSeed] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setNarrow(root.offsetWidth < NARROW_BREAKPOINT);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

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
    const ids = new Set<string>();
    for (const note of notes) {
      if (tag && note.cat !== tag) continue;
      if (!matchesQuery(note.title, note.body, note.cat, query)) continue;
      ids.add(note.id);
    }
    return ids;
  }, [notes, query, tag]);

  const editing = notes.find((note) => note.id === editingId) ?? null;
  const gutter = narrow ? "px-4 pt-4" : "px-6 pt-6";

  function recast() {
    setSeed((value) => value + 1);
  }

  function openCapture() {
    sheetRef.current?.open();
  }

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-water-1">
      <div className={`mx-auto flex h-full w-full max-w-(--page-max) flex-col ${gutter}`}>
        <SearchAndFilters
          query={query}
          tag={tag}
          onQueryChange={setQuery}
          onTagChange={setTag}
        />

        {isSupabaseConfigured() ? (
          <div className="mt-3">
            <MagicLinkForm email={email} onSignedOut={() => setEmail(null)} />
          </div>
        ) : null}

        <div className="mt-3">
          <CatchOfTheDay
            notes={notes}
            visible={visible}
            seed={seed}
            narrow={narrow}
            onOpen={setEditingId}
            onRecast={recast}
          />
        </div>

        <div className={`mt-3 flex min-h-0 flex-1 flex-col ${narrow ? "pb-4" : "pb-6"}`}>
          <PondCanvas
            notes={notes}
            visible={visible}
            onOpen={setEditingId}
            onRecast={recast}
            onCapture={openCapture}
          />
        </div>
      </div>

      <CaptureSheet
        ref={sheetRef}
        onSave={({ cat, text, open }) => {
          const note = addNote({ cat, text, userId: null });
          if (open) setEditingId(note.id);
        }}
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
