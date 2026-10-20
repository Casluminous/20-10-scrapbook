-- All identities, wishes and favorites in this test are rolled back.
begin;
select set_config('test.owner_uid', (select user_id::text from public.wish_admins limit 1), true);
insert into auth.users (id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', true),
  ('00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', true);
insert into public.wishes (id, name, text)
values ('00000000-0000-4000-8000-000000000201', 'Test', 'Transaction-only fixture');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;
do $$ declare affected integer; result jsonb;
begin
  if public.is_wishes_admin() then raise exception 'Visitor became admin'; end if;
  update public.wishes set deleted_at=now() where id='00000000-0000-4000-8000-000000000201';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Visitor moderated a wish'; end if;
  begin
    insert into public.wish_admins values (auth.uid());
    raise exception 'Visitor granted own admin access';
  exception when insufficient_privilege then null; end;
  begin
    update public.wishes set favorite_count=100 where id='00000000-0000-4000-8000-000000000201';
    raise exception 'Visitor changed count directly';
  exception when insufficient_privilege then null; end;
  result := public.set_wish_favorite('00000000-0000-4000-8000-000000000201', true);
  result := public.set_wish_favorite('00000000-0000-4000-8000-000000000201', true);
  if (result->>'favorite_count')::integer <> 1 then raise exception 'Duplicate favorite counted'; end if;
  if (select count(*) from public.wish_favorites where wish_id='00000000-0000-4000-8000-000000000201') <> 1 then raise exception 'Own favorite read failed'; end if;
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;
do $$ declare result jsonb;
begin
  if (select count(*) from public.wish_favorites where wish_id='00000000-0000-4000-8000-000000000201') <> 0 then raise exception 'Visitor saw another identity'; end if;
  result := public.set_wish_favorite('00000000-0000-4000-8000-000000000201', false);
  if (result->>'favorite_count')::integer <> 1 then raise exception 'Visitor removed another favorite'; end if;
  result := public.set_wish_favorite('00000000-0000-4000-8000-000000000201', true);
  if (result->>'favorite_count')::integer <> 2 then raise exception 'Second favorite failed'; end if;
end $$;

reset role;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.owner_uid'),'role','authenticated','is_anonymous',false)::text, true);
set local role authenticated;
do $$ declare affected integer;
begin
  if not public.is_wishes_admin() then raise exception 'Owner is not admin'; end if;
  update public.wishes set deleted_at=now() where id='00000000-0000-4000-8000-000000000201';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner could not trash'; end if;
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;
do $$ begin
  if exists (select 1 from public.wishes where id='00000000-0000-4000-8000-000000000201') then raise exception 'Visitor saw trashed wish'; end if;
  begin
    perform public.set_wish_favorite('00000000-0000-4000-8000-000000000201', true);
    raise exception 'Visitor liked a trashed wish';
  exception when no_data_found then null; end;
end $$;

reset role;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.owner_uid'),'role','authenticated','is_anonymous',false)::text, true);
set local role authenticated;
do $$ declare affected integer; counts jsonb;
begin
  update public.wishes set deleted_at=null where id='00000000-0000-4000-8000-000000000201';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner could not restore'; end if;
  counts := public.admin_wish_counts();
  if (counts->>'visible')::integer < 1 then raise exception 'Admin overview failed'; end if;
end $$;

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$ begin
  if not exists (select 1 from public.wishes where id='00000000-0000-4000-8000-000000000201') then raise exception 'Restored wish not public'; end if;
  begin
    perform public.set_wish_favorite('00000000-0000-4000-8000-000000000201', true);
    raise exception 'Unauthenticated RPC call allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: admin isolation, trash/restore, hidden wishes, unique favorites, own identities, protected counts; all test data rolled back' as result;
