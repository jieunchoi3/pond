"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BoardCard } from "@/components/pond/BoardCard";
import { EditorToolbar } from "@/components/pond/EditorToolbar";
import { Fish } from "@/components/pond/Fish";
import { daysIdle, hasBoard } from "@/lib/notes/fish";
import { type BlockType, type Note, type NoteBlock } from "@/lib/notes/types";

type NoteEditorProps = {
  note: Note;
  narrow: boolean;
  onChange: (patch: Partial<Pick<Note, "title" | "body" | "blocks">>) => void;
  onActed: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const DEFAULTS: Record<BlockType, string> = {
  colour: "var(--water-3)",
  image: "",
  video: "",
  voice: "0:08",
};

export function NoteEditor({
  note,
  narrow,
  onChange,
  onActed,
  onDelete,
  onClose,
}: NoteEditorProps) {
  const [split, setSplit] = useState(hasBoard(note) ? 0.42 : 0.76);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function startDivider(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const move = (ev: PointerEvent) => {
      const box = wrapRef.current?.getBoundingClientRect();
      if (!box) return;
      setSplit(Math.max(0.14, Math.min((ev.clientY - box.top) / box.height, 0.86)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function add(type: BlockType) {
    const count = note.blocks.length;
    const next: NoteBlock = {
      id: crypto.randomUUID(),
      type,
      content: DEFAULTS[type],
      x: 24 + (count % 3) * 130,
      y: 24 + Math.floor(count / 3) * 118,
      w: type === "colour" ? 110 : 200,
    };
    onChange({ blocks: [...note.blocks, next] });
    if (split > 0.6) setSplit(0.42);
  }

  function update(block: NoteBlock) {
    onChange({ blocks: note.blocks.map((item) => (item.id === block.id ? block : item)) });
  }

  function drop(id: string) {
    onChange({ blocks: note.blocks.filter((item) => item.id !== id) });
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-water-1 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <Fish cat={note.cat} id={note.id} scale={0.45} />
          <span className="type-caption tracking-[0.08em]">
            {note.cat.toUpperCase()} · {daysIdle(note.acted_at)}d
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onActed}
            className="type-label rounded-pill bg-accent px-4 py-2 text-surface"
          >
            Acted on it
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="type-label rounded-pill border border-line px-4 py-2 text-ink-soft"
          >
            Release
          </button>
          <button type="button" onClick={onClose} className="type-label px-2 py-2 text-ink-soft">
            Done
          </button>
        </div>
      </header>

      <div ref={wrapRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="overflow-auto px-6 pt-5" style={{ height: `${split * 100}%` }}>
          <input
            value={note.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Add your original spark"
            className="type-title w-full bg-transparent text-ink outline-none placeholder:text-ink-soft"
          />
          <textarea
            value={note.body}
            onChange={(event) => onChange({ body: event.target.value })}
            placeholder="add your ideas…"
            className="type-body mt-2.5 h-[78%] w-full resize-none bg-transparent text-ink outline-none placeholder:text-ink-soft"
          />
        </div>

        <div
          onPointerDown={startDivider}
          className="editor-split flex cursor-row-resize select-none items-center gap-2 border-y border-line bg-water-1 px-6 py-2"
        >
          <span className="h-1 w-8 rounded-pill bg-ink/18" />
          <span className="type-caption mr-auto tracking-[0.08em]">
            BOARD{narrow ? "" : " · DRAG TO ARRANGE"}
          </span>
          <EditorToolbar
            onAdd={add}
            onExpand={() => setSplit(split > 0.3 ? 0.14 : 0.5)}
          />
        </div>

        <div
          ref={boardRef}
          className={`relative min-h-0 flex-1 overflow-auto ${
            narrow ? "flex flex-wrap content-start gap-3 p-4" : "pond-board"
          }`}
        >
          {note.blocks.map((block) => (
            <BoardCard
              key={block.id}
              block={block}
              boardRef={boardRef}
              floating={!narrow}
              onChange={update}
              onDelete={drop}
            />
          ))}
          {note.blocks.length === 0 ? (
            <p className={`type-label text-ink-soft ${narrow ? "" : "absolute top-5 left-6"}`}>
              Nothing pinned yet. Add a voice note, a picture, a video, or a colour.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
