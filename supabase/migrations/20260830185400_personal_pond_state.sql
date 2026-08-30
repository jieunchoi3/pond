-- Personal pond, no login.
-- One shared row. Anon can read and write so every device sees the same water.
-- Anyone with the site URL can also write — that is intentional for a single-user pond.

create table if not exists public.pond_state (
  id text primary key default 'default',
  notes jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  pins jsonb not null default '[]'::jsonb,
  ready boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.pond_state (id)
values ('default')
on conflict (id) do nothing;

alter table public.pond_state enable row level security;

drop policy if exists "pond_state_personal" on public.pond_state;
create policy "pond_state_personal"
  on public.pond_state
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.pond_state to anon, authenticated;
