export const CATS = ["ai art", "vibe coding", "music"] as const;

export type Cat = (typeof CATS)[number];

export type NoteBlock = Record<string, unknown>;

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
