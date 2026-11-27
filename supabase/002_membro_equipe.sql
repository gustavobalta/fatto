-- fatto-lab: login só com senha. O usuário único equipe@fattolab3d.web.app vira membro sozinho ao ser criado.
create or replace function public.membro_equipe()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email = 'equipe@fattolab3d.web.app' then
    insert into public.membros (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.membro_equipe() from public, anon, authenticated;

drop trigger if exists membro_equipe on auth.users;
create trigger membro_equipe after insert on auth.users for each row execute function public.membro_equipe();

-- Caso o usuário já exista:
insert into public.membros (user_id) select id from auth.users where email = 'equipe@fattolab3d.web.app' on conflict do nothing;
