-- Run in the project's SQL Editor as owner. All test rows are rolled back.
begin;
set local role anon;
insert into public.wishes (id, name, text)
values ('11111111-1111-4111-8111-111111111111', 'Kiểm tra kỹ thuật', 'Dữ liệu tạm, tự hoàn tác.');

do $$ begin
  if not exists (select 1 from public.wishes where id = '11111111-1111-4111-8111-111111111111') then
    raise exception 'Public read failed';
  end if;
  begin
    update public.wishes set text = 'Unexpected update' where id = '11111111-1111-4111-8111-111111111111';
    raise exception 'Public update was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.wishes where id = '11111111-1111-4111-8111-111111111111';
    raise exception 'Public delete was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.wishes (name, text) values ('Test', repeat('a', 141));
    raise exception 'Oversize text was allowed';
  exception when check_violation or insufficient_privilege then null;
  end;
  begin
    insert into public.wishes (name, text, created_at) values ('Test', 'Forged date', now());
    raise exception 'Client timestamp was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
select 'PASS: read, insert, limits, no update/delete, server timestamp; test data rolled back' as result;
