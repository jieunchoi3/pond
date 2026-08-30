"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BoardCard } from "@/components/pond/BoardCard";
import { EditorToolbar } from "@/components/pond/EditorToolbar";
import { Fish } from "@/components/pond/Fish";
import { daysIdle, defaultBlock, hasBoard } from "@/lib/notes/fish";
import {
  imageFileFromClipboard,
  imageFileFromDrop,
  imageFileToContent,
} from "@/lib/notes/image";
import { categoryName, usePondCategories } from "@/lib/notes/categories";
import { type BlockType, type Note, type NoteBlock } from "@/lib/notes/types";

type NoteEditorProps = {
  note: Note;
  narrow: boolean;
  onChange: (patch: Partial<Pick<Note, "title" | "body" | "cat" | "blocks">>) => void;
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
  const categories = usePondCategories();

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

  async function ingestImage(file: File) {
    const content = await imageFileToContent(file);
    const empty = note.blocks.find((item) => item.type === "image" && !item.content.trim());
    if (empty) {
      onChange({
        blocks: note.blocks.map((item) => (item.id === empty.id ? { ...item, content } : item)),
      });
    } else {
      onChange({
        blocks: [...note.blocks, { ...defaultBlock("image", note.blocks.length), content }],
      });
    }
    if (split > 0.6) setSplit(0.42);
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-surface"
      onPaste={(event) => {
        const file = imageFileFromClipboard(event);
        if (!file) return;
        event.preventDefault();
        void ingestImage(file);
      }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3.5">
        <div className="flex items-center gap-2">
          <Fish cat={note.cat} id={note.id} scale={0.45} />
          <label className="sr-only" htmlFor="note-cat">
            Category
          </label>
          <select
            id="note-cat"
            value={note.cat}
            onChange={(event) => onChange({ cat: event.target.value })}
            className="type-label bg-transparent tracking-[0.08em] text-ink-soft outline-none"
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            {categories.some((item) => item.id === note.cat) ? null : (
              <option value={note.cat}>{categoryName(note.cat)}</option>
            )}
          </select>
          <span className="type-label tracking-[0.08em] text-ink-soft">
            · {daysIdle(note.acted_at)}d
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
        <div className="flex flex-col overflow-auto px-8 pt-5" style={{ height: `${split * 100}%` }}>
          <input
            value={note.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Add your original spark"
            className="type-note-title w-full border-b border-line bg-transparent py-3 pl-6 pr-4 text-ink outline-none placeholder:text-ink-soft"
          />
          <textarea
            value={note.body}
            onChange={(event) => onChange({ body: event.target.value })}
            placeholder="add your ideas…"
            className="type-body mt-1 min-h-0 w-full flex-1 resize-none border-b border-line bg-transparent py-3 pl-6 pr-4 text-ink outline-none placeholder:text-ink-soft"
          />
        </div>

        <div
          onPointerDown={startDivider}
          className="editor-split flex cursor-row-resize select-none items-center gap-3 border-y border-line bg-surface px-6 py-2"
        >
          <span className="h-1 w-8 shrink-0 rounded-pill bg-ink/18" />
          <EditorToolbar
            expanded={split < 0.3}
            onAdd={add}
            onExpand={() => setSplit(split > 0.3 ? 0.14 : 0.5)}
          />
        </div>

        <div
          ref={boardRef}
          className={`relative min-h-0 flex-1 overflow-auto ${
            narrow ? "flex flex-wrap content-start gap-3 p-4" : "pond-board"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            const file = imageFileFromDrop(event);
            if (!file) return;
            event.preventDefault();
            void ingestImage(file);
          }}
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
