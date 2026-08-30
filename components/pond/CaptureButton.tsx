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
      className="fixed right-6 bottom-6 z-30 grid size-[72px] place-items-center rounded-pill bg-koi text-white shadow-pond-lg transition-transform hover:scale-105 active:scale-95"
    >
      <Icon icon="ant-design:plus" width={32} />
    </button>
  );
}
