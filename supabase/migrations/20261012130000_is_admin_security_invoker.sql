-- Migração 3: is_admin() passa a SECURITY INVOKER
-- O verificador de segurança do Supabase avisa que funções SECURITY DEFINER em "public" ficam
-- acessíveis a qualquer pessoa pela API. Esta função não precisa desse privilégio: cada utilizador
-- autenticado já consegue ler o seu próprio registo em public.administradores (política RLS), e os
-- visitantes (anon) não veem nenhum registo, por isso obtêm sempre "false".

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.administradores a where a.user_id = auth.uid());
$$;
