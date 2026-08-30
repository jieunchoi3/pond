-- ponds + notes
-- RLS: a user only sees their own rows.

create table public.ponds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'Pond',
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cat text not null,
  title text not null default '',
  body text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  acted_at timestamptz not null default now()
);

create index notes_user_created_at_idx on public.notes (user_id, created_at desc);
create index ponds_user_id_idx on public.ponds (user_id);

alter table public.ponds enable row level security;
alter table public.notes enable row level security;

create policy "ponds_select_own" on public.ponds
  for select to authenticated using (auth.uid() = user_id);
create policy "ponds_insert_own" on public.ponds
  for insert to authenticated with check (auth.uid() = user_id);
create policy "ponds_update_own" on public.ponds
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ponds_delete_own" on public.ponds
  for delete to authenticated using (auth.uid() = user_id);

create policy "notes_select_own" on public.notes
  for select to authenticated using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.ponds to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
