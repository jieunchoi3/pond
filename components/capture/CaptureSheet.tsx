"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CATEGORIES, type Cat } from "@/lib/notes/types";

export type CaptureSheetHandle = {
  open: () => number;
  close: () => void;
};

type CaptureSheetProps = {
  onSave: (input: { cat: Cat; text: string; open: boolean }) => void;
};

export const CaptureSheet = forwardRef<CaptureSheetHandle, CaptureSheetProps>(
  function CaptureSheet({ onSave }, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cat, setCat] = useState<Cat>("ai");
    const [draft, setDraft] = useState("");

    function show() {
      const root = rootRef.current;
      if (!root) return;
      root.dataset.open = "true";
      root.removeAttribute("aria-hidden");
    }

    function hide() {
      const root = rootRef.current;
      if (!root) return;
      root.dataset.open = "false";
      root.setAttribute("aria-hidden", "true");
    }

    useImperativeHandle(ref, () => ({
      open() {
        const started = performance.now();
        show();
        textareaRef.current?.focus();
        return performance.now() - started;
      },
      close() {
        hide();
        setDraft("");
      },
    }));

    function save(open: boolean) {
      const text = draft.trim();
      if (!text && !open) return;
      hide();
      onSave({ cat, text, open });
      setDraft("");
    }

    return (
      <div
        ref={rootRef}
        data-open="false"
        aria-hidden="true"
        className="fixed inset-0 z-40 flex flex-col justify-end bg-scrim data-[open=false]:pointer-events-none data-[open=false]:opacity-0"
      >
        <div className="rounded-t-input bg-surface p-6">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="what just popped?"
            className="type-body w-full resize-none bg-transparent text-ink outline-none placeholder:text-ink-soft"
          />
          <div className="flex gap-2 overflow-x-auto py-2.5">
            {CATEGORIES.map((item) => {
              const on = item.id === cat;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCat(item.id)}
                  aria-pressed={on}
                  className={`type-label shrink-0 rounded-pill border border-line px-4 py-2 ${
                    on ? "bg-accent text-surface" : "bg-surface-2 text-ink-soft"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <button
              type="button"
              onClick={() => {
                hide();
                setDraft("");
              }}
              className="type-label text-ink-soft"
            >
              Close
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => save(true)}
                className="type-label rounded-pill border border-line px-[18px] py-2.5 text-ink"
              >
                Open it
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className="type-label rounded-pill bg-accent px-[26px] py-2.5 text-surface"
              >
                Release
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
