import { isEmbeddedImage } from "@/lib/notes/image";
import { applyRemoteNotes, getNotesSnapshot } from "@/lib/notes/store";
import { flushPondSync } from "@/lib/notes/sync";

const HEAVY = 180_000;
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.72;

function idle() {
  return new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 1200 });
      return;
    }
    window.setTimeout(resolve, 60);
  });
}

async function jpegFromDataUrl(src: string) {
  const res = await fetch(src);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return src;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function shrinkPondImages() {
  if (typeof window === "undefined") return;
  const notes = getNotesSnapshot();
  let changed = false;
  const next = [];
  for (const note of notes) {
    const blocks = [];
    for (const block of note.blocks) {
      if (
        block.type !== "image" ||
        !isEmbeddedImage(block.content) ||
        block.content.length < HEAVY
      ) {
        blocks.push(block);
        continue;
      }
      await idle();
      try {
        const smaller = await jpegFromDataUrl(block.content);
        if (smaller.length < block.content.length * 0.85) {
          changed = true;
          blocks.push({ ...block, content: smaller });
          continue;
        }
      } catch {
        // Keep the original if the browser cannot decode it.
      }
      blocks.push(block);
    }
    next.push({ ...note, blocks });
  }
  if (!changed) return;
  applyRemoteNotes(next);
  flushPondSync();
}
