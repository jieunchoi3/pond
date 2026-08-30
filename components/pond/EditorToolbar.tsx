"use client";

import { Icon } from "@iconify/react";

type EditorToolbarProps = {
  expanded: boolean;
  onMic: () => void;
  onImage: () => void;
  onYoutube: () => void;
  onExpand: () => void;
};

const ACTIONS = [
  { id: "mic", icon: "fluent:mic-20-regular", label: "Voice note", handler: "onMic" },
  { id: "image", icon: "clarity:image-gallery-line", label: "Attach image", handler: "onImage" },
  { id: "youtube", icon: "ant-design:youtube-outlined", label: "Embed YouTube", handler: "onYoutube" },
] as const;

export function EditorToolbar({
  expanded,
  onMic,
  onImage,
  onYoutube,
  onExpand,
}: EditorToolbarProps) {
  const handlers = { onMic, onImage, onYoutube };

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={handlers[action.handler]}
            aria-label={action.label}
            className="grid size-12 place-items-center rounded-pill bg-koi-soft text-ink transition-transform hover:scale-105"
          >
            <Icon icon={action.icon} width={20} />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onExpand}
        aria-pressed={expanded}
        aria-label={expanded ? "Shrink editor" : "Expand editor"}
        className="grid size-12 place-items-center rounded-pill bg-surface-2 text-ink"
      >
        <Icon icon="ant-design:expand-alt-outlined" width={20} />
      </button>
    </div>
  );
}
