-- All messages and identities created here are rolled back.
begin;
select set_config('test.owner_uid',(select user_id::text from public.wish_admins limit 1),true);
insert into auth.users(id,aud,role,is_anonymous) values
 ('00000000-0000-4000-8000-000000000301','authenticated','authenticated',true),
 ('00000000-0000-4000-8000-000000000302','authenticated','authenticated',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000301","role":"authenticated","is_anonymous":true}',true);
set local role authenticated;
do $$ declare first jsonb; repeated jsonb; affected integer;
begin
  first:=public.send_chat_message('00000000-0000-4000-8000-000000000401','Khách thử','Tin trong giao dịch hoàn tác');
  repeated:=public.send_chat_message('00000000-0000-4000-8000-000000000401','Khách thử','Tin trong giao dịch hoàn tác');
  if first <> repeated then raise exception 'Idempotent retry failed'; end if;
  if first ? 'author_id' then raise exception 'Private identity leaked'; end if;
  begin
    perform public.send_chat_message('00000000-0000-4000-8000-000000000402','Khách thử','Too fast');
    raise exception 'Rate limit failed' using errcode='22023';
  exception when raise_exception then null; end;
  begin
    perform public.send_chat_message('00000000-0000-4000-8000-000000000403','Khách thử',repeat('x',501));
    raise exception 'Length limit failed';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.send_chat_message('00000000-0000-4000-8000-000000000404',E'\t',E'\n');
    raise exception 'Whitespace validation failed';
  exception when invalid_parameter_value then null; end;
  begin
    insert into public.chat_messages(author_id,display_name,body) values(auth.uid(),'Fake','Bypassed RPC');
    raise exception 'Direct insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform author_id from public.chat_messages;
    raise exception 'Author identifiers were public';
  exception when insufficient_privilege then null; end;
  update public.chat_messages set deleted_at=now() where id='00000000-0000-4000-8000-000000000401';
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Visitor could moderate chat'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000302","role":"authenticated","is_anonymous":true}',true);
set local role authenticated;
do $$ begin
  begin
    perform public.send_chat_message('00000000-0000-4000-8000-000000000401','Khách thử','Tin trong giao dịch hoàn tác');
    raise exception 'Another visitor reused a message ID';
  exception when unique_violation then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.owner_uid'),'role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
do $$ declare affected integer; begin
  update public.chat_messages set deleted_at=now() where id='00000000-0000-4000-8000-000000000401';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin could not trash chat'; end if;
  if (public.admin_chat_counts()->>'trash')::integer <1 then raise exception 'Admin chat counts failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
  if exists(select id from public.chat_messages where id='00000000-0000-4000-8000-000000000401') then raise exception 'Hidden message was public'; end if;
  begin
    perform public.send_chat_message('00000000-0000-4000-8000-000000000405','Guest','Not signed in');
    raise exception 'Unauthenticated send allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.owner_uid'),'role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
do $$ declare affected integer; begin
  update public.chat_messages set deleted_at=null where id='00000000-0000-4000-8000-000000000401';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin could not restore chat'; end if;
end $$;
rollback;
select 'PASS: send, idempotent retry, rate limit, validation, private author, moderation, restore; all test data rolled back' as result;
