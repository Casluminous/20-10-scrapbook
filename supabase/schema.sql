begin;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  created_at timestamptz not null default now(),
  constraint wishes_name_length check (char_length(btrim(name)) between 1 and 24),
  constraint wishes_text_length check (char_length(btrim(text)) between 1 and 140),
  constraint wishes_name_trimmed check (name = btrim(name)),
  constraint wishes_text_trimmed check (text = btrim(text))
);

create index if not exists wishes_newest_idx on public.wishes (created_at desc, id desc);
alter table public.wishes enable row level security;

revoke all on table public.wishes from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.wishes to anon, authenticated;
grant insert (id, name, text) on table public.wishes to anon, authenticated;

create policy "Everyone can read wishes"
  on public.wishes for select to anon, authenticated using (true);
create policy "Everyone can add valid wishes"
  on public.wishes for insert to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 24
    and char_length(btrim(text)) between 1 and 140
    and name = btrim(name) and text = btrim(text)
  );

comment on table public.wishes is 'Public 20/10 wishes. Visitors may read and add, never update or delete.';
notify pgrst, 'reload schema';
commit;
