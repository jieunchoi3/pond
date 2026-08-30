"use client";

import { useEffect, useRef, useState } from "react";
import { EditorToolbar } from "@/components/pond/EditorToolbar";
import { FISH, type Note, type NoteTag, TAGS } from "@/lib/notes";

type NoteEditorProps = {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  onClose: () => void;
};

export function NoteEditor({ note, onChange, onClose }: NoteEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeDraft, setYoutubeDraft] = useState(note.youtubeUrl ?? "");
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fish = FISH[note.fish];
  const embedId = youtubeId(note.youtubeUrl);

  return (
    <div className="fixed inset-0 z-40 bg-surface">
      <div
        className={`mx-auto flex h-full w-full max-w-[1392px] flex-col px-6 ${
          expanded ? "py-6" : "py-8"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="type-label text-ink-soft hover:text-ink"
          >
            Back to pond
          </button>
          <p className="type-caption">{fish.species}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <input
            ref={titleRef}
            value={note.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Add your original spark"
            className="type-title w-full border-0 bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft"
          />
          <div className="h-px w-full bg-line" />

          <textarea
            value={note.body}
            onChange={(event) => onChange({ body: event.target.value })}
            placeholder="던져 넣은 생각이 여기서 헤엄칩니다."
            className={`type-body mt-4 w-full flex-1 resize-none border-0 bg-transparent text-ink outline-none placeholder:text-ink-soft ${
              expanded ? "min-h-0" : "min-h-[240px]"
            }`}
          />

          {note.imageDataUrl ? (
            <div className="mt-4 overflow-hidden rounded-card border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={note.imageDataUrl}
                alt="Attached to this spark"
                className="max-h-56 w-full object-cover"
              />
            </div>
          ) : null}

          {embedId ? (
            <div className="mt-4 aspect-video overflow-hidden rounded-card border border-line">
              <iframe
                title="YouTube"
                src={`https://www.youtube.com/embed/${embedId}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {note.voiceLabel ? (
            <p className="type-caption mt-4">{note.voiceLabel}</p>
          ) : null}

          {youtubeOpen ? (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                onChange({ youtubeUrl: youtubeDraft.trim() || undefined });
                setYoutubeOpen(false);
              }}
            >
              <input
                value={youtubeDraft}
                onChange={(event) => setYoutubeDraft(event.target.value)}
                placeholder="Paste a YouTube URL"
                className="type-label h-12 flex-1 rounded-input border border-line bg-surface-2 px-4 text-ink outline-none"
              />
              <button
                type="submit"
                className="type-label h-12 rounded-pill bg-ink px-5 text-surface"
              >
                Embed
              </button>
            </form>
          ) : null}

          <div className="mt-auto">
            <div className="mt-6 mb-4 flex flex-wrap gap-2">
              {(TAGS.filter((tag) => tag !== "all") as NoteTag[]).map((item) => {
                const selected = note.tag === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChange({ tag: item })}
                    className={`type-label rounded-pill px-4 py-2 capitalize ${
                      selected ? "bg-ink text-surface" : "bg-surface-2 text-ink"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="h-px w-full bg-line" />

            <EditorToolbar
              expanded={expanded}
              onMic={() =>
                onChange({
                  voiceLabel: note.voiceLabel
                    ? undefined
                    : `Voice note · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                })
              }
              onImage={() => fileRef.current?.click()}
              onYoutube={() => setYoutubeOpen((value) => !value)}
              onExpand={() => setExpanded((value) => !value)}
            />
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              onChange({ imageDataUrl: reader.result });
            }
          };
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}

function youtubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embed = parts.indexOf("embed");
    if (embed >= 0) return parts[embed + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}
