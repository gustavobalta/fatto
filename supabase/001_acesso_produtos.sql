-- fatto-lab: só usuários logados e cadastrados em public.membros acessam public.produtos.
-- Rodar inteiro no SQL Editor do Supabase. Pode ser rodado de novo sem problema.

-- 1. Lista de quem tem acesso
create table if not exists public.membros (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.membros enable row level security;
-- Sem políticas: a API (anon/authenticated) não lê nem altera esta tabela.
revoke all on public.membros from anon, authenticated;

-- 2. Checagem usada pelas políticas
create or replace function public.is_membro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.membros where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_membro() from public, anon;
grant execute on function public.is_membro() to authenticated;

-- 3. Liga RLS em produtos e apaga as políticas antigas (as que hoje liberam o anônimo)
alter table public.produtos enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'produtos' loop
    execute format('drop policy %I on public.produtos', p.policyname);
  end loop;
end $$;

create policy "membros leem"      on public.produtos for select to authenticated using (public.is_membro());
create policy "membros inserem"   on public.produtos for insert to authenticated with check (public.is_membro());
create policy "membros atualizam" on public.produtos for update to authenticated using (public.is_membro()) with check (public.is_membro());
create policy "membros apagam"    on public.produtos for delete to authenticated using (public.is_membro());

-- Defesa extra: o anônimo não tem nenhum privilégio na tabela
revoke all on public.produtos from anon;

-- 4. Cadastrar quem tem acesso (depois de criar os usuários em Authentication > Users).
-- Troque pelos e-mails reais e rode:
-- insert into public.membros (user_id)
-- select id from auth.users where email in ('voce@exemplo.com', 'socia@exemplo.com')
-- on conflict do nothing;
