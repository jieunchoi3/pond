# Pond

A koi pond for sparks. This session is the **capture path only** — list + magic-link auth + a full-screen sheet. The pond, fish, catch of the day, and note editor are not built yet.

Tokens live in [`DESIGN.md`](./DESIGN.md). Figma is for layout later; colours, fonts, radii and shadows always come from that file.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

## Supabase (so a note lands in the table)

1. Create a project at [supabase.com](https://supabase.com).
2. Put the URL and publishable (or legacy anon) key in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

3. In the SQL editor, run `supabase/migrations/20260830004342_ponds_and_notes.sql`.
4. Auth → URL configuration: add `http://localhost:43217/auth/callback` (and your Vercel URL) to Redirect URLs. Set Site URL to the same origin.
5. Sign in with the magic link, tap +, type, Release. The row should appear in `public.notes`.

Captures never wait on the network. They write to local state first, then upsert. If you are signed out, they sit in an outbox until the magic link completes.

## Capture speed

The sheet is **always mounted**. The + click focuses the textarea in the same user-gesture turn (required for the iOS keyboard). That is the only way to keep “tap → blinking cursor” under 400ms.

Choices that would break it (and were not used):

- Navigating to `/capture`
- Mounting the sheet on click (`{open && <Sheet />}`)
- Radix/Dialog enter animation
- Focusing in `useEffect` after React commit (also kills the iOS keyboard)
- Awaiting `getSession()` or insert before showing the sheet

`pond-prototype.jsx` is a reference for the later rAF pond. Do not import it.
