"use client";

import { Icon } from "@iconify/react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

type CaptureButtonProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function CaptureButton({ onClick, className }: CaptureButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Write a note"
      className={cn(
        "grid place-items-center rounded-pill bg-accent text-surface shadow-pond-lg",
        className,
      )}
      style={{ width: "var(--size-fab)", height: "var(--size-fab)" }}
    >
      <Icon icon="ant-design:plus" width={30} />
    </button>
  );
}
