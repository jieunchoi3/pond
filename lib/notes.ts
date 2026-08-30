export const TAGS = ["all", "ai art", "vibe coding", "music"] as const;

export type Tag = (typeof TAGS)[number];
export type NoteTag = Exclude<Tag, "all">;

export type FishId =
  | "koi-white"
  | "goldfish-orange"
  | "tang-blue"
  | "betta-lilac"
  | "koi-vermilion"
  | "koi-blush"
  | "koi-calico"
  | "carp-honey";

export type Note = {
  id: string;
  title: string;
  body: string;
  tag: NoteTag;
  recast: boolean;
  daysUntouched: number;
  fish: FishId;
  featured: boolean;
  imageDataUrl?: string;
  youtubeUrl?: string;
  voiceLabel?: string;
  updatedAt: string;
};

export const FISH: Record<
  FishId,
  { src: string; species: string; width: number }
> = {
  "koi-white": {
    src: "/fish/koi-white.png",
    species: "Kohaku koi",
    width: 168,
  },
  "goldfish-orange": {
    src: "/fish/goldfish-orange.png",
    species: "Orange goldfish",
    width: 132,
  },
  "tang-blue": {
    src: "/fish/tang-blue.png",
    species: "Blue tang",
    width: 148,
  },
  "betta-lilac": {
    src: "/fish/betta-lilac.png",
    species: "Lilac betta",
    width: 156,
  },
  "koi-vermilion": {
    src: "/fish/koi-vermilion.png",
    species: "Vermilion koi",
    width: 176,
  },
  "koi-blush": {
    src: "/fish/koi-blush.png",
    species: "Blush koi",
    width: 160,
  },
  "koi-calico": {
    src: "/fish/koi-calico.png",
    species: "Calico koi",
    width: 144,
  },
  "carp-honey": {
    src: "/fish/carp-honey.png",
    species: "Honey carp",
    width: 128,
  },
};

const FISH_ORDER: FishId[] = [
  "koi-white",
  "goldfish-orange",
  "tang-blue",
  "betta-lilac",
  "koi-vermilion",
  "koi-blush",
  "koi-calico",
  "carp-honey",
];

export const SEED_NOTES: Note[] = [
  {
    id: "catch-bubble",
    title: "Bubble dream",
    body: "A girl walking through a city of soap bubbles, wearing a bright white shirt with a dotted collar.",
    tag: "ai art",
    recast: false,
    daysUntouched: 2,
    fish: "koi-white",
    featured: true,
    updatedAt: "2026-08-28T09:00:00.000Z",
  },
  {
    id: "catch-commit",
    title: "First commit of the day",
    body: "Ship the pond layout before noon. Pretendard for Korean, Inria for the titles — no more silent font fallback.",
    tag: "vibe coding",
    recast: false,
    daysUntouched: 1,
    fish: "tang-blue",
    featured: true,
    updatedAt: "2026-08-29T08:12:00.000Z",
  },
  {
    id: "catch-melody",
    title: "새벽 멜로디",
    body: "창문을 열어두면 멀리서 기타가 들린다. 그 음을 메모해 두고 밤에 다시 켠다.",
    tag: "music",
    recast: false,
    daysUntouched: 5,
    fish: "betta-lilac",
    featured: true,
    updatedAt: "2026-08-25T16:40:00.000Z",
  },
  {
    id: "catch-question",
    title: "연못에 던진 질문",
    body: "아이디어가 가라앉기 전에 던져 넣기. 고기가 되면 나중에 건져 올린다.",
    tag: "vibe coding",
    recast: false,
    daysUntouched: 12,
    fish: "goldfish-orange",
    featured: true,
    updatedAt: "2026-08-18T11:22:00.000Z",
  },
  {
    id: "catch-recast",
    title: "Koi sketch, recast",
    body: "Last week’s vermilion koi, redrawn without the sticker shadow. Keep the white body; let it sit in the water.",
    tag: "ai art",
    recast: true,
    daysUntouched: 0,
    fish: "koi-vermilion",
    featured: true,
    updatedAt: "2026-08-30T00:10:00.000Z",
  },
  {
    id: "pond-blush",
    title: "분홍 비늘",
    body: "연못 가장자리에 분홍 잉어가 머문다. 아직 제목도 없는 스케치.",
    tag: "ai art",
    recast: false,
    daysUntouched: 21,
    fish: "koi-blush",
    featured: false,
    updatedAt: "2026-08-09T19:00:00.000Z",
  },
  {
    id: "pond-calico",
    title: "Three-color loop",
    body: "A bass line that never resolves. Leave it swimming until Friday.",
    tag: "music",
    recast: false,
    daysUntouched: 43,
    fish: "koi-calico",
    featured: false,
    updatedAt: "2026-07-18T10:00:00.000Z",
  },
  {
    id: "pond-honey",
    title: "Honey hour",
    body: "Late light on the water. A small carp, a smaller task: write one sentence and stop.",
    tag: "vibe coding",
    recast: false,
    daysUntouched: 8,
    fish: "carp-honey",
    featured: false,
    updatedAt: "2026-08-22T18:30:00.000Z",
  },
];

const STORAGE_KEY = "pond.notes.v1";
const NOTES_EVENT = "pond-notes";

let clientNotes: Note[] | null = null;

function emitNotes() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTES_EVENT));
}

export function subscribeNotes(onStoreChange: () => void) {
  window.addEventListener(NOTES_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(NOTES_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getNotesSnapshot(): Note[] {
  if (clientNotes) return clientNotes;
  clientNotes = loadNotes();
  return clientNotes;
}

export function getServerNotesSnapshot(): Note[] {
  return SEED_NOTES;
}

export function writeNotes(next: Note[]) {
  clientNotes = next;
  saveNotes(next);
  emitNotes();
}

export function clipBody(text: string, max = 88): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let end = max;
  const isLatin = (ch: string | undefined) => Boolean(ch && /[A-Za-z0-9]/.test(ch));
  if (end < t.length && isLatin(t[end]) && isLatin(t[end - 1])) {
    while (end > max - 24 && isLatin(t[end - 1])) end -= 1;
  }
  return `${t.slice(0, end).trimEnd()}…`;
}

export function daysLabel(days: number): string {
  return `${days}d untouched`;
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return SEED_NOTES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_NOTES;
    const parsed = JSON.parse(raw) as Note[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_NOTES;
    return parsed;
  } catch {
    return SEED_NOTES;
  }
}

export function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function nextFish(notes: Note[]): FishId {
  const used = new Set(notes.map((n) => n.fish));
  return FISH_ORDER.find((id) => !used.has(id)) ?? FISH_ORDER[notes.length % FISH_ORDER.length];
}

export function createNote(tag: NoteTag, notes: Note[]): Note {
  const now = new Date().toISOString();
  return {
    id: `note-${crypto.randomUUID()}`,
    title: "",
    body: "",
    tag,
    recast: false,
    daysUntouched: 0,
    fish: nextFish(notes),
    featured: true,
    updatedAt: now,
  };
}

export function matchesQuery(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    note.title.toLowerCase().includes(q) ||
    note.body.toLowerCase().includes(q) ||
    note.tag.toLowerCase().includes(q)
  );
}
