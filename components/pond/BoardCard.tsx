"use client";

import { useRef, useState, type RefObject } from "react";
import type { NoteBlock } from "@/lib/notes/types";
import {
  imageFileFromClipboard,
  imageFileFromDrop,
  imageFileToContent,
  isEmbeddedImage,
  isShownImage,
} from "@/lib/notes/image";
import { youtubeEmbedSrc, youtubeId } from "@/lib/notes/youtube";

type BoardCardProps = {
  block: NoteBlock;
  floating: boolean;
  boardRef: RefObject<HTMLDivElement | null>;
  onChange: (block: NoteBlock) => void;
  onDelete: (id: string) => void;
};

export function BoardCard({
  block,
  floating,
  boardRef,
  onChange,
  onDelete,
}: BoardCardProps) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const embedSrc = block.type === "video" ? youtubeEmbedSrc(block.content) : null;

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!floating) return;
    const board = boardRef.current;
    if (!board) return;
    event.preventDefault();
    const box = board.getBoundingClientRect();
    drag.current = { dx: event.clientX - box.left - block.x, dy: event.clientY - box.top - block.y };
    const move = (ev: PointerEvent) => {
      const current = drag.current;
      const nextBox = board.getBoundingClientRect();
      if (!current) return;
      onChange({
        ...block,
        x: Math.max(0, Math.min(ev.clientX - nextBox.left - current.dx, nextBox.width - 80)),
        y: Math.max(0, Math.min(ev.clientY - nextBox.top - current.dy, nextBox.height - 40)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function applyFile(file: File | null) {
    if (!file) return;
    try {
      setError("");
      const content = await imageFileToContent(file);
      onChange({ ...block, content });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add that image.");
    }
  }

  return (
    <article
      className="overflow-hidden rounded-card border border-line bg-surface shadow-pond-sm"
      style={
        floating
          ? {
              position: "absolute",
              left: block.x,
              top: block.y,
              width: embedSrc ? Math.max(block.w, 280) : block.w,
            }
          : { width: block.type === "colour" ? 110 : block.type === "video" ? 280 : 200 }
      }
      onPaste={
        block.type === "image"
          ? (event) => {
              const file = imageFileFromClipboard(event);
              if (!file) return;
              event.preventDefault();
              event.stopPropagation();
              void applyFile(file);
            }
          : undefined
      }
      onDragOver={
        block.type === "image"
          ? (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }
          : undefined
      }
      onDrop={
        block.type === "image"
          ? (event) => {
              const file = imageFileFromDrop(event);
              if (!file) return;
              event.preventDefault();
              event.stopPropagation();
              void applyFile(file);
            }
          : undefined
      }
    >
      <div
        onPointerDown={startDrag}
        className={`flex items-center justify-between bg-surface-2 px-2 py-1 ${
          floating ? "cursor-grab touch-none" : ""
        }`}
      >
        <span className="type-label tracking-[0.08em] text-ink-soft">{block.type}</span>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          className="type-label leading-none text-ink-soft"
          aria-label="Remove"
        >
          ×
        </button>
      </div>
      {block.type === "colour" ? (
        <>
          <div className="h-[68px]" style={{ background: block.content }} />
          <input
            value={block.content}
            onChange={(event) => onChange({ ...block, content: event.target.value })}
            className="type-label w-full bg-transparent px-2.5 py-1.5 text-ink-soft outline-none"
          />
        </>
      ) : null}
      {block.type === "image" ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              void applyFile(file);
            }}
          />
          {isShownImage(block.content) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.content} alt="" className="block max-h-40 w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid h-[92px] w-full place-items-center bg-water-2 px-3 type-label text-ink"
            >
              paste, drop, or upload
            </button>
          )}
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            {isEmbeddedImage(block.content) ? (
              <span className="type-label min-w-0 flex-1 truncate text-ink-soft">from this device</span>
            ) : (
              <input
                value={block.content}
                onChange={(event) => onChange({ ...block, content: event.target.value })}
                placeholder="or an image URL"
                className="type-label min-w-0 flex-1 bg-transparent text-ink-soft outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="type-label shrink-0 text-ink"
            >
              upload
            </button>
          </div>
          {error ? <p className="type-label px-2.5 pb-2 text-ink-soft">{error}</p> : null}
        </>
      ) : null}
      {block.type === "video" ? (
        <>
          {embedSrc ? (
            <div className="aspect-video w-full bg-ink">
              <iframe
                src={embedSrc}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="grid h-[88px] place-items-center bg-ink">
              <span className="grid size-[34px] place-items-center rounded-pill bg-accent text-[13px] text-surface">
                ▶
              </span>
            </div>
          )}
          <input
            value={block.content}
            onChange={(event) => {
              const content = event.target.value;
              const wide = youtubeId(content) ? Math.max(block.w, 280) : block.w;
              onChange({ ...block, content, w: wide });
            }}
            placeholder="YouTube URL"
            className="type-label w-full bg-transparent px-2.5 py-1.5 text-ink-soft outline-none"
          />
        </>
      ) : null}
      {block.type === "voice" ? (
        <div className="flex items-center gap-2 p-3">
          <span className="grid size-[26px] place-items-center rounded-pill bg-accent text-[11px] text-surface">
            ▶
          </span>
          <svg width="86" height="18" viewBox="0 0 86 18" aria-hidden>
            {Array.from({ length: 21 }).map((_, index) => (
              <rect
                key={index}
                x={index * 4}
                y={9 - (2 + Math.abs(Math.sin(index * 1.3)) * 7)}
                width="2"
                height={4 + Math.abs(Math.sin(index * 1.3)) * 14}
                rx="1"
                className="fill-ink-soft opacity-55"
              />
            ))}
          </svg>
          <span className="type-label text-ink-soft">{block.content}</span>
        </div>
      ) : null}
    </article>
  );
}
