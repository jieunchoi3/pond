"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CATS, type Cat } from "@/lib/notes/types";

export type CaptureSheetHandle = {
  open: () => number;
  close: () => void;
};

type CaptureSheetProps = {
  onRelease: (input: { cat: Cat; text: string }) => void;
  onOpenIt?: (input: { cat: Cat; text: string }) => void;
};

export const CaptureSheet = forwardRef<CaptureSheetHandle, CaptureSheetProps>(
  function CaptureSheet({ onRelease, onOpenIt }, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cat, setCat] = useState<Cat>("vibe coding");
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

    function commit(openEditor: boolean) {
      const text = draft.trim();
      hide();
      if (!text && !openEditor) return;
      const payload = { cat, text };
      if (openEditor && onOpenIt) onOpenIt(payload);
      else if (text) onRelease(payload);
      setDraft("");
    }

    return (
      <div
        ref={rootRef}
        data-open="false"
        aria-hidden="true"
        className="fixed inset-0 z-40 flex flex-col bg-surface p-6 data-[open=false]:pointer-events-none data-[open=false]:opacity-0"
      >
        <div className="mx-auto flex h-full w-full max-w-(--page-max) flex-col">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="type-label text-ink-soft">new spark</p>
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
          </div>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add your original spark"
            className="type-body min-h-0 w-full flex-1 resize-none bg-transparent text-ink outline-none placeholder:text-ink-soft"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {CATS.map((item) => {
              const selected = item === cat;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCat(item)}
                  aria-pressed={selected}
                  className={`type-label rounded-pill px-4 py-2 ${
                    selected ? "bg-accent text-surface" : "bg-surface-2 text-ink"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            {onOpenIt ? (
              <button
                type="button"
                onClick={() => commit(true)}
                className="type-label h-12 flex-1 rounded-pill border border-line text-ink"
              >
                Open it
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => commit(false)}
              className="type-label h-12 flex-1 rounded-pill bg-accent text-surface"
            >
              Release
            </button>
          </div>
        </div>
      </div>
    );
  },
);
