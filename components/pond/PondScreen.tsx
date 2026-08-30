"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { CatchOfTheDay } from "@/components/pond/CatchOfTheDay";
import { CategorySidebar } from "@/components/pond/CategorySidebar";
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
import { usePondCategories } from "@/lib/notes/categories";

export function PondScreen() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getServerNotesSnapshot,
  );
  const categories = usePondCategories();
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<FilterTag>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const selectedTag =
    tag === "all" || categories.some((item) => item.id === tag) ? tag : "all";

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

  const defaultCat =
    selectedTag !== "all" ? selectedTag : (categories[0]?.id ?? "ai art");

  return (
    <div ref={rootRef} className="relative flex h-dvh overflow-hidden bg-water-1">
      <CategorySidebar
        open={sidebarOpen}
        selected={selectedTag}
        editingId={editingId}
        notes={notes}
        query={query}
        narrow={narrow}
        onToggle={() => setSidebarOpen((value) => !value)}
        onSelect={setTag}
        onOpenNote={setEditingId}
      />

      <div className="mx-auto flex min-h-0 min-w-0 w-full max-w-(--page-max) flex-1 flex-col gap-3 overflow-hidden px-6 py-3">
        {isSupabaseConfigured() ? (
          <MagicLinkForm email={email} onSignedOut={() => setEmail(null)} />
        ) : null}

        <SearchAndFilters
          query={query}
          tag={selectedTag}
          notes={notes}
          onQueryChange={setQuery}
          onTagChange={setTag}
          onPickNote={setEditingId}
        />

        <CatchOfTheDay notes={visibleNotes} onOpen={setEditingId} onRecast={recastNote} />

        <div className="min-h-0 flex-1">
          <PondCanvas notes={notes} visible={visibleIds} onOpen={setEditingId} onCapture={openCapture} />
        </div>
      </div>

      <CaptureSheet
        ref={sheetRef}
        defaultCat={defaultCat}
        onRelease={saveSpark}
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
