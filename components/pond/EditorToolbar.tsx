"use client";

import { Icon } from "@iconify/react";
import type { BlockType } from "@/lib/notes/types";

type EditorToolbarProps = {
  onAdd: (type: BlockType) => void;
  onExpand: () => void;
  expanded?: boolean;
};

const ACTIONS: { type: BlockType; icon: string; label: string }[] = [
  { type: "voice", icon: "fluent:mic-20-regular", label: "Add voice" },
  { type: "image", icon: "clarity:image-gallery-line", label: "Add image" },
  { type: "video", icon: "ant-design:youtube-outlined", label: "Add video" },
];

export function EditorToolbar({ onAdd, onExpand, expanded = false }: EditorToolbarProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="type-label shrink-0 px-2 text-ink">canvas mode</span>
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onAdd(action.type)}
          aria-label={action.label}
          className="grid size-10 shrink-0 place-items-center rounded-pill bg-accent-soft text-ink"
        >
          <Icon icon={action.icon} width={20} height={20} />
        </button>
      ))}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onExpand}
        aria-label={expanded ? "Collapse sheet" : "Expand to full screen"}
        className="ml-auto grid size-10 shrink-0 place-items-center rounded-pill bg-surface-2 text-ink-soft"
      >
        <Icon icon="ant-design:expand-alt-outlined" width={18} height={18} />
      </button>
    </div>
  );
}
