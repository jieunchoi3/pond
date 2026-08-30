"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { EditorToolbar } from "@/components/pond/EditorToolbar";
import { fishFor } from "@/lib/notes/fish";
import { CATS, type Note, type NoteBlock } from "@/lib/notes/types";

type NoteEditorProps = {
  note: Note;
  onChange: (patch: Partial<Pick<Note, "title" | "body" | "cat" | "blocks">>) => void;
  onClose: () => void;
};

export function NoteEditor({ note, onChange, onClose }: NoteEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [split, setSplit] = useState(56);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeDraft, setYoutubeDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [note.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fish = fishFor(note.cat, note.id);
  const embedId = youtubeId(
    note.blocks.find((block) => block.type === "youtube")?.url,
  );

  function addBlock(block: NoteBlock) {
    onChange({ blocks: [...note.blocks, block] });
  }

  function removeBlock(id: string) {
    onChange({ blocks: note.blocks.filter((block) => block.id !== id) });
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = frame.getBoundingClientRect();
    const move = (clientY: number) => {
      const next = ((clientY - box.top) / box.height) * 100;
      setSplit(Math.min(78, Math.max(28, next)));
    };
    move(event.clientY);
    const onMove = (ev: PointerEvent) => move(ev.clientY);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface">
      <div className="mx-auto flex h-full w-full max-w-(--page-max) flex-col px-6 py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button type="button" onClick={onClose} className="type-label text-ink-soft">
            Back to pond
          </button>
          <p className="type-caption">{fish.species}</p>
        </div>

        <div ref={frameRef} className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex min-h-0 flex-col"
            style={{ flexBasis: expanded ? "100%" : `${split}%` }}
          >
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
              className="type-body mt-4 min-h-0 w-full flex-1 resize-none bg-transparent text-ink outline-none placeholder:text-ink-soft"
            />
          </div>

          {expanded ? null : (
            <>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize board"
                onPointerDown={startDrag}
                className="editor-split my-2 h-4 cursor-row-resize"
              >
                <div className="mx-auto h-px w-16 bg-line" />
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-card border border-line bg-surface-2 p-4">
                <p className="type-caption mb-3">board</p>
                {note.blocks.length === 0 && !youtubeOpen ? (
                  <p className="type-body text-ink-soft">
                    Images, YouTube, and voice land here. One note type — title, body, board.
                  </p>
                ) : null}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                  {note.blocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="overflow-hidden rounded-card border border-line bg-surface text-left"
                    >
                      {block.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={block.src} alt="" className="h-32 w-full object-cover" />
                      ) : null}
                      {block.type === "youtube" ? (
                        <p className="type-label p-3">{block.url}</p>
                      ) : null}
                      {block.type === "audio" ? (
                        <p className="type-caption p-3">{block.label}</p>
                      ) : null}
                    </button>
                  ))}
                </div>

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

                {youtubeOpen ? (
                  <form
                    className="mt-4 flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const url = youtubeDraft.trim();
                      if (url) {
                        addBlock({ id: crypto.randomUUID(), type: "youtube", url });
                      }
                      setYoutubeDraft("");
                      setYoutubeOpen(false);
                    }}
                  >
                    <input
                      value={youtubeDraft}
                      onChange={(event) => setYoutubeDraft(event.target.value)}
                      placeholder="Paste a YouTube URL"
                      className="type-label h-12 flex-1 rounded-input border border-line bg-surface px-4 text-ink outline-none"
                    />
                    <button type="submit" className="type-label h-12 rounded-pill bg-ink px-5 text-surface">
                      Embed
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATS.map((item) => {
            const selected = note.cat === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange({ cat: item })}
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
            addBlock({
              id: crypto.randomUUID(),
              type: "audio",
              label: `Voice note · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            })
          }
          onImage={() => fileRef.current?.click()}
          onYoutube={() => setYoutubeOpen((value) => !value)}
          onExpand={() => setExpanded((value) => !value)}
        />
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
              addBlock({ id: crypto.randomUUID(), type: "image", src: reader.result });
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
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1) || null;
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embed = parts.indexOf("embed");
    if (embed >= 0) return parts[embed + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}
