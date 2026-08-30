"use client";

import { Icon } from "@iconify/react";
import type { BlockType } from "@/lib/notes/types";

type EditorToolbarProps = {
  onAdd: (type: BlockType) => void;
  onExpand: () => void;
};

const ACTIONS: { type: BlockType; icon: string; label: string }[] = [
  { type: "voice", icon: "fluent:mic-20-regular", label: "Add voice" },
  { type: "image", icon: "clarity:image-gallery-line", label: "Add image" },
  { type: "video", icon: "ant-design:youtube-outlined", label: "Add video" },
  { type: "colour", icon: "fluent:color-24-regular", label: "Add colour" },
];

export function EditorToolbar({ onAdd, onExpand }: EditorToolbarProps) {
  return (
    <>
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onAdd(action.type)}
          aria-label={action.label}
          className="grid size-10 place-items-center rounded-pill bg-accent-soft text-ink"
        >
          <Icon icon={action.icon} width={20} />
        </button>
      ))}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onExpand}
        aria-label="Expand board"
        className="grid size-10 place-items-center rounded-pill bg-surface-2 text-ink-soft"
      >
        <Icon icon="ant-design:expand-alt-outlined" width={18} />
      </button>
    </>
  );
}
