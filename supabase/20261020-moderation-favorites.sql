begin;

alter table public.wishes add column if not exists deleted_at timestamptz;
alter table public.wishes add column if not exists favorite_count integer not null default 0 check (favorite_count >= 0);
create index if not exists wishes_public_newest_idx on public.wishes (created_at desc, id desc) where deleted_at is null;

create table public.wish_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.wish_admins enable row level security;
revoke all on public.wish_admins from public, anon, authenticated;

create function public.is_wishes_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.wish_admins where user_id = (select auth.uid())) $$;
revoke all on function public.is_wishes_admin() from public, anon;
grant execute on function public.is_wishes_admin() to authenticated;

drop policy "Everyone can read wishes" on public.wishes;
create policy "Read visible wishes" on public.wishes
  for select to anon, authenticated using (deleted_at is null);
create policy "Admins read all wishes" on public.wishes
  for select to authenticated using ((select public.is_wishes_admin()));
grant update (deleted_at) on public.wishes to authenticated;
create policy "Admins moderate wishes" on public.wishes
  for update to authenticated
  using ((select public.is_wishes_admin())) with check ((select public.is_wishes_admin()));

create table public.wish_favorites (
  wish_id uuid not null references public.wishes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wish_id, user_id)
);
alter table public.wish_favorites enable row level security;
revoke all on public.wish_favorites from public, anon, authenticated;
grant select (wish_id, user_id) on public.wish_favorites to authenticated;
create policy "Read own favorites" on public.wish_favorites
  for select to authenticated using (user_id = (select auth.uid()));

create function public.update_wish_favorite_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.wishes set favorite_count = favorite_count + 1 where id = new.wish_id;
    return new;
  else
    update public.wishes set favorite_count = greatest(0, favorite_count - 1) where id = old.wish_id;
    return old;
  end if;
end $$;
revoke all on function public.update_wish_favorite_count() from public, anon, authenticated;
create trigger wish_favorites_count after insert or delete on public.wish_favorites
  for each row execute function public.update_wish_favorite_count();

create function public.set_wish_favorite(p_wish_id uuid, p_liked boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_count integer;
begin
  if v_uid is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_liked is null then raise exception 'State required' using errcode = '22023'; end if;
  select favorite_count into v_count from public.wishes
    where id = p_wish_id and deleted_at is null for update;
  if not found then raise exception 'Wish unavailable' using errcode = 'P0002'; end if;
  if p_liked then
    insert into public.wish_favorites (wish_id, user_id) values (p_wish_id, v_uid) on conflict do nothing;
  else
    delete from public.wish_favorites where wish_id = p_wish_id and user_id = v_uid;
  end if;
  select favorite_count into v_count from public.wishes where id = p_wish_id;
  return jsonb_build_object('liked', p_liked, 'favorite_count', v_count);
end $$;
revoke all on function public.set_wish_favorite(uuid, boolean) from public, anon;
grant execute on function public.set_wish_favorite(uuid, boolean) to authenticated;

create function public.admin_wish_counts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_wishes_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
  return (select jsonb_build_object(
    'visible', count(*) filter (where deleted_at is null),
    'trash', count(*) filter (where deleted_at is not null),
    'favorites', coalesce(sum(favorite_count) filter (where deleted_at is null), 0)
  ) from public.wishes);
end $$;
revoke all on function public.admin_wish_counts() from public, anon;
grant execute on function public.admin_wish_counts() to authenticated;

notify pgrst, 'reload schema';
commit;
