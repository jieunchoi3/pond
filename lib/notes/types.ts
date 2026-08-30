export const CATS = ["ai", "code", "music", "idea"] as const;

export type Cat = (typeof CATS)[number];

export type Species = "koi" | "tang" | "betta" | "goldfish";

export type Category = {
  id: Cat;
  name: string;
  species: Species;
  fill: string;
  mark: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "ai",
    name: "ai art",
    species: "koi",
    fill: "var(--species-koi-fill)",
    mark: "var(--species-koi-mark)",
  },
  {
    id: "code",
    name: "vibe coding",
    species: "tang",
    fill: "var(--species-tang-fill)",
    mark: "var(--species-tang-mark)",
  },
  {
    id: "music",
    name: "music",
    species: "betta",
    fill: "var(--species-betta-fill)",
    mark: "var(--species-betta-mark)",
  },
  {
    id: "idea",
    name: "ideas",
    species: "goldfish",
    fill: "var(--species-goldfish-fill)",
    mark: "var(--species-goldfish-mark)",
  },
];

export function categoryOf(id: string): Category {
  return CATEGORIES.find((item) => item.id === id) ?? CATEGORIES[0]!;
}

export function isCat(value: string): value is Cat {
  return (CATS as readonly string[]).includes(value);
}

export const BLOCK_TYPES = ["colour", "image", "video", "voice"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type NoteBlock = {
  id: string;
  type: BlockType;
  content: string;
  x: number;
  y: number;
  w: number;
};

export type Note = {
  id: string;
  user_id: string | null;
  cat: Cat;
  title: string;
  body: string;
  blocks: NoteBlock[];
  created_at: string;
  acted_at: string;
  pending: boolean;
};

export type Database = {
  public: {
    Tables: {
      ponds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          cat: string;
          title: string;
          body: string;
          blocks: NoteBlock[];
          created_at: string;
          acted_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cat: string;
          title?: string;
          body?: string;
          blocks?: NoteBlock[];
          created_at?: string;
          acted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cat?: string;
          title?: string;
          body?: string;
          blocks?: NoteBlock[];
          created_at?: string;
          acted_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
