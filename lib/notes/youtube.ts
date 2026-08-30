const ID = /^[\w-]{11}$/;

function asUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function isVideoId(value: string | undefined): value is string {
  return Boolean(value && ID.test(value));
}

export function youtubeId(raw: string) {
  const url = asUrl(raw);
  if (!url) {
    const token = raw.trim();
    return isVideoId(token) ? token : null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return isVideoId(id) ? id : null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const v = url.searchParams.get("v");
    if (v && isVideoId(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    const id = parts[1];
    if (kind && ["embed", "shorts", "live", "v"].includes(kind) && isVideoId(id)) {
      return id;
    }
  }
  return null;
}

function parseStamp(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function youtubeStart(raw: string) {
  const url = asUrl(raw);
  if (!url) return null;
  const stamp = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (!stamp) return null;
  return parseStamp(stamp);
}

export function youtubeEmbedSrc(raw: string) {
  const id = youtubeId(raw);
  if (!id) return null;
  const start = youtubeStart(raw);
  const params = new URLSearchParams({ rel: "0" });
  if (start) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
