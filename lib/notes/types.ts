export type Cat = string;

export type PondCategory = {
  id: string;
  name: string;
  fishKey: string;
};

export const DEFAULT_CATEGORIES: PondCategory[] = [
  { id: "ai art", name: "ai art", fishKey: "goldfish-yellow" },
  { id: "vibe coding", name: "vibe coding", fishKey: "goldfish-red" },
  { id: "music", name: "music", fishKey: "fish-green" },
];

export const CATS = DEFAULT_CATEGORIES.map((item) => item.id);

export function isCat(value: string): value is Cat {
  return value.trim().length > 0;
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
