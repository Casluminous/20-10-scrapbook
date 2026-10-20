begin;
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index chat_messages_newest_idx on public.chat_messages (created_at desc, id desc) where deleted_at is null;
create index chat_messages_author_idx on public.chat_messages (author_id, created_at desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from public, anon, authenticated;
grant select (id, display_name, body, created_at, deleted_at) on public.chat_messages to anon, authenticated;
grant update (deleted_at) on public.chat_messages to authenticated;
create policy "Read visible chat" on public.chat_messages
  for select to anon, authenticated using (deleted_at is null);
create policy "Admins read all chat" on public.chat_messages
  for select to authenticated using ((select public.is_wishes_admin()));
create policy "Admins moderate chat" on public.chat_messages
  for update to authenticated using ((select public.is_wishes_admin())) with check ((select public.is_wishes_admin()));

create function public.send_chat_message(p_id uuid, p_name text, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(p_name, E' \t\n\r');
  v_body text := btrim(p_body, E' \t\n\r');
  v_row public.chat_messages%rowtype;
begin
  if v_uid is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_id is null or v_name is null or v_body is null
     or char_length(v_name) not between 1 and 24
     or char_length(v_body) not between 1 and 500 then
    raise exception 'Tên tối đa 24 ký tự, tin nhắn từ 1 đến 500 ký tự.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 2010));
  select * into v_row from public.chat_messages where id=p_id;
  if found then
    if v_row.author_id <> v_uid or v_row.display_name <> v_name or v_row.body <> v_body then
      raise exception 'Message ID unavailable' using errcode='23505';
    end if;
  else
    if exists (select 1 from public.chat_messages where author_id=v_uid and created_at>clock_timestamp()-interval '3 seconds') then
      raise exception 'Bạn đợi khoảng 3 giây giữa hai tin nhắn nhé.' using errcode='P0001';
    end if;
    insert into public.chat_messages(id,author_id,display_name,body,created_at)
      values(p_id,v_uid,v_name,v_body,clock_timestamp()) returning * into v_row;
  end if;
  return jsonb_build_object('id',v_row.id,'display_name',v_row.display_name,'body',v_row.body,'created_at',v_row.created_at,'deleted_at',v_row.deleted_at);
end $$;
revoke all on function public.send_chat_message(uuid,text,text) from public, anon;
grant execute on function public.send_chat_message(uuid,text,text) to authenticated;

create function public.admin_chat_counts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_wishes_admin() then raise exception 'Admin only' using errcode='42501'; end if;
  return (select jsonb_build_object('visible',count(*) filter(where deleted_at is null),
    'trash',count(*) filter(where deleted_at is not null),'favorites',0) from public.chat_messages);
end $$;
revoke all on function public.admin_chat_counts() from public, anon;
grant execute on function public.admin_chat_counts() to authenticated;
notify pgrst,'reload schema';
commit;
