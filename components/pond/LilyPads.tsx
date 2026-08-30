"use client";

import { Icon } from "@iconify/react";

type LilyTabProps = {
  open: boolean;
  onToggle: () => void;
};

export function LilyTab({ open, onToggle }: LilyTabProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      aria-label={open ? "Hide catch of the day" : "Show catch of the day"}
      className="absolute top-1/2 left-0 z-20 flex h-[72px] w-10 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-r-pill bg-surface text-ink-soft shadow-pond-sm"
    >
      <Icon
        icon="bi:chevron-left"
        width={18}
        height={18}
        className={open ? "" : "rotate-180"}
      />
    </button>
  );
}
