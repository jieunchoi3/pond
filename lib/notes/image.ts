export function isShownImage(value: string) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(value.trim());
}

export function isEmbeddedImage(value: string) {
  return /^data:image\//i.test(value.trim());
}

type ClipboardLike = {
  clipboardData?: DataTransfer | null;
};

type DropLike = {
  dataTransfer: DataTransfer;
};

export function imageFileFromClipboard(event: ClipboardLike) {
  const data = event.clipboardData;
  if (!data) return null;
  for (const item of data.items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  for (const file of data.files) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}

export function imageFileFromDrop(event: DropLike) {
  for (const file of event.dataTransfer.files) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that image."));
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export async function imageFileToContent(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("That image is too large (12 MB max).");
  }
  if (
    file.size < 350_000 ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return readAsDataUrl(file);
  }

  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return readAsDataUrl(file);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  return canvas.toDataURL(keepAlpha ? "image/png" : "image/jpeg", 0.84);
}
