"use client";

import { forwardRef, useImperativeHandle, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { BoardCard } from "@/components/pond/BoardCard";
import { EditorToolbar } from "@/components/pond/EditorToolbar";
import { defaultBlock } from "@/lib/notes/fish";
import {
  imageFileFromClipboard,
  imageFileFromDrop,
  imageFileToContent,
} from "@/lib/notes/image";
import { usePondCategories } from "@/lib/notes/categories";
import { AddCategoryChip } from "@/components/pond/AddCategoryChip";
import { type BlockType, type Cat, type NoteBlock } from "@/lib/notes/types";

export type CaptureDraft = {
  cat: Cat;
  title: string;
  body: string;
  blocks: NoteBlock[];
};

export type CaptureSheetHandle = {
  open: () => number;
  close: () => void;
};

type CaptureSheetProps = {
  defaultCat: Cat;
  onRelease: (input: CaptureDraft) => void;
  onOpenChange?: (open: boolean) => void;
};

export const CaptureSheet = forwardRef<CaptureSheetHandle, CaptureSheetProps>(
  function CaptureSheet({ defaultCat, onRelease, onOpenChange }, ref) {
    const categories = usePondCategories();
    const rootRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [cat, setCat] = useState<Cat>(defaultCat);
    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [blocks, setBlocks] = useState<NoteBlock[]>([]);

    function show() {
      const root = rootRef.current;
      if (!root) return;
      root.dataset.open = "true";
      root.removeAttribute("aria-hidden");
      onOpenChange?.(true);
    }

    function hide() {
      const root = rootRef.current;
      if (!root) return;
      root.dataset.open = "false";
      root.setAttribute("aria-hidden", "true");
      setExpanded(false);
      setTitle("");
      setBody("");
      setBlocks([]);
      onOpenChange?.(false);
    }

    useImperativeHandle(ref, () => ({
      open() {
        const started = performance.now();
        setCat(defaultCat);
        show();
        titleRef.current?.focus();
        return performance.now() - started;
      },
      close() {
        hide();
      },
    }));

    function commit() {
      const draft: CaptureDraft = {
        cat,
        title: title.trim(),
        body: body.trim(),
        blocks,
      };
      hide();
      if (!draft.title && !draft.body && draft.blocks.length === 0) return;
      onRelease(draft);
    }

    function discard() {
      hide();
    }

    function onSaveKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        commit();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        commit();
      }
    }

    function add(type: BlockType) {
      setBlocks((list) => [...list, defaultBlock(type, list.length)]);
      if (!expanded) setExpanded(true);
    }

    function update(block: NoteBlock) {
      setBlocks((list) => list.map((item) => (item.id === block.id ? block : item)));
    }

    function drop(id: string) {
      setBlocks((list) => list.filter((item) => item.id !== id));
    }

    async function ingestImage(file: File) {
      const content = await imageFileToContent(file);
      setBlocks((list) => {
        const empty = list.find((item) => item.type === "image" && !item.content.trim());
        if (empty) {
          return list.map((item) => (item.id === empty.id ? { ...item, content } : item));
        }
        return [...list, { ...defaultBlock("image", list.length), content }];
      });
      setExpanded(true);
    }

    function takeImagePaste(event: ClipboardEvent) {
      const file = imageFileFromClipboard(event);
      if (!file) return;
      event.preventDefault();
      void ingestImage(file);
    }

    return (
      <div
        ref={rootRef}
        data-open="false"
        aria-hidden="true"
        className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(31,42,40,0.45)] p-6 data-[open=false]:pointer-events-none data-[open=false]:opacity-0"
        onClick={(event) => {
          if (event.target === event.currentTarget) commit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            commit();
          }
        }}
      >
        <article
          role="dialog"
          aria-label="Add your original spark"
          className={`flex flex-col overflow-hidden rounded-input bg-surface shadow-pond-lg transition-[width,height] duration-200 ${
            expanded
              ? "h-[calc(100dvh-48px)] w-[min(1392px,calc(100vw-48px))]"
              : "h-[min(640px,80dvh)] w-[min(920px,92vw)]"
          }`}
          onClick={(event) => event.stopPropagation()}
          onPaste={takeImagePaste}
        >
          <div className={`flex min-h-0 flex-col px-8 pt-8 ${expanded ? "flex-none" : "flex-1"}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((item) => {
                const selected = item.id === cat;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCat(item.id)}
                    aria-pressed={selected}
                    className={`type-label rounded-pill px-3 py-1.5 ${
                      selected ? "bg-accent text-surface" : "bg-surface-2 text-ink"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
              <AddCategoryChip compact onCreated={setCat} />
            </div>
            <input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add your original spark"
              className="type-note-title w-full border-b border-line bg-transparent py-3 pl-6 pr-4 text-ink outline-none placeholder:text-ink-soft"
              onKeyDown={onSaveKey}
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="add your ideas…"
              className={`type-body mt-1 w-full resize-none border-b border-line bg-transparent py-3 pl-6 pr-4 text-ink outline-none placeholder:text-ink-soft ${
                expanded ? "h-28" : "min-h-0 flex-1"
              }`}
              onKeyDown={onSaveKey}
            />
          </div>

          <div className="flex items-center gap-3 border-b border-line px-6 py-3">
            <EditorToolbar
              expanded={expanded}
              onAdd={add}
              onExpand={() => setExpanded((value) => !value)}
              extra={
                <>
                  <button
                    type="button"
                    onClick={discard}
                    className="type-label px-3 py-2 text-ink-soft"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commit}
                    className="type-label rounded-pill bg-accent px-5 py-2 text-surface"
                  >
                    Save
                  </button>
                </>
              }
            />
          </div>

          {expanded || blocks.length > 0 ? (
            <div
              ref={boardRef}
              className={`min-h-0 flex-1 overflow-auto ${
                expanded ? "pond-board relative" : "flex flex-wrap content-start gap-3 p-6"
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
              {blocks.map((block) => (
                <BoardCard
                  key={block.id}
                  block={block}
                  boardRef={boardRef}
                  floating={expanded}
                  onChange={update}
                  onDelete={drop}
                />
              ))}
            </div>
          ) : (
            <div className="h-4" />
          )}
        </article>
      </div>
    );
  },
);
