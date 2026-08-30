"use client";

import { useRef, type RefObject } from "react";
import type { NoteBlock } from "@/lib/notes/types";

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

  return (
    <article
      className="overflow-hidden rounded-card border border-line bg-surface shadow-pond-sm"
      style={
        floating
          ? { position: "absolute", left: block.x, top: block.y, width: block.w }
          : { width: block.type === "colour" ? 110 : 200 }
      }
    >
      <div
        onPointerDown={startDrag}
        className={`flex items-center justify-between bg-surface-2 px-2 py-1 ${
          floating ? "cursor-grab touch-none" : ""
        }`}
      >
        <span className="type-caption tracking-[0.08em]">{block.type}</span>
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
            className="type-caption w-full bg-transparent px-2.5 py-1.5 text-ink-soft outline-none"
          />
        </>
      ) : null}
      {block.type === "image" ? (
        <>
          {/^https?:\/\//.test(block.content) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.content} alt="" className="block max-h-40 w-full object-cover" />
          ) : (
            <div className="grid h-[92px] place-items-center bg-water-2 type-caption text-ink">
              paste an image URL
            </div>
          )}
          <input
            value={block.content}
            onChange={(event) => onChange({ ...block, content: event.target.value })}
            placeholder="image URL"
            className="type-caption w-full bg-transparent px-2.5 py-1.5 text-ink-soft outline-none"
          />
        </>
      ) : null}
      {block.type === "video" ? (
        <>
          <div className="grid h-[88px] place-items-center bg-ink">
            <span className="grid size-[34px] place-items-center rounded-pill bg-accent text-[13px] text-surface">
              ▶
            </span>
          </div>
          <input
            value={block.content}
            onChange={(event) => onChange({ ...block, content: event.target.value })}
            placeholder="YouTube URL"
            className="type-caption w-full bg-transparent px-2.5 py-1.5 text-ink-soft outline-none"
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
          <span className="type-caption">{block.content}</span>
        </div>
      ) : null}
    </article>
  );
}
