"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { CaptureButton } from "@/components/capture/CaptureButton";
import {
  CaptureSheet,
  type CaptureSheetHandle,
} from "@/components/capture/CaptureSheet";
import { NoteList } from "@/components/notes/NoteList";
import {
  addNote,
  ensurePond,
  flushOutbox,
  getNotesSnapshot,
  getServerNotesSnapshot,
  pullNotes,
  subscribeNotes,
} from "@/lib/notes/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function HomeScreen() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getServerNotesSnapshot,
  );
  const sheetRef = useRef<CaptureSheetHandle>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [openMs, setOpenMs] = useState<number | null>(null);

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

  function openCapture() {
    const ms = sheetRef.current?.open() ?? 0;
    setOpenMs(ms);
  }

  return (
    <div className="relative min-h-screen bg-surface pb-32">
      <div className="mx-auto w-full max-w-(--page-max) px-6 py-8">
        <header className="mb-8 flex flex-col gap-4">
          <div>
            <p className="type-caption mb-1">ideas, left in the water</p>
            <h1 className="type-display">Pond</h1>
          </div>
          <MagicLinkForm email={email} onSignedOut={() => setEmail(null)} />
          {openMs !== null ? (
            <p className="type-caption">capture → cursor {openMs.toFixed(1)}ms</p>
          ) : null}
          {!isSupabaseConfigured() ? null : email ? (
            <p className="type-caption">signed in — notes sync after Release</p>
          ) : (
            <p className="type-caption">
              sign in so a release lands in the notes table
            </p>
          )}
        </header>

        <NoteList notes={notes} />
      </div>

      <CaptureButton onClick={openCapture} />
      <CaptureSheet
        ref={sheetRef}
        onRelease={({ cat, text }) => {
          addNote({ cat, text, userId: null });
        }}
      />
    </div>
  );
}
