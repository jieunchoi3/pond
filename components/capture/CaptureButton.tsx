"use client";

import { Icon } from "@iconify/react";

type CaptureButtonProps = {
  onClick: () => void;
};

export function CaptureButton({ onClick }: CaptureButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Capture a spark"
      className="fixed right-6 bottom-6 z-20 grid place-items-center rounded-pill bg-accent text-surface shadow-pond-lg"
      style={{ width: "var(--size-fab)", height: "var(--size-fab)" }}
    >
      <Icon icon="ant-design:plus" width={32} />
    </button>
  );
}
