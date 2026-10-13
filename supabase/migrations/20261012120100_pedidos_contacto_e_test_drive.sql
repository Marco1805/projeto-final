-- Migração 2: pedidos dos visitantes
-- Visitantes só podem CRIAR pedidos (sem os poder ler depois); administradores gerem-nos.
-- O estado inicial é imposto pela política RLS, para ninguém criar um pedido já "agendado".

-- Mantém a data de atualização dos pedidos (a coluna chama-se "atualizado_em")
create or replace function public.definir_atualizada_em_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pedidos de contacto
-- ---------------------------------------------------------------------------
create table public.pedidos_contacto (
  id uuid primary key default gen_random_uuid(),
  viatura_id uuid references public.viaturas (id) on delete set null,
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (
    char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  telefone text check (telefone is null or char_length(telefone) between 6 and 30),
  mensagem text not null check (char_length(mensagem) between 5 and 2000),
  estado text not null default 'novo'
    check (estado in ('novo', 'em_tratamento', 'concluido', 'arquivado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_contacto_estado_idx on public.pedidos_contacto (estado, criado_em desc);
create index pedidos_contacto_viatura_idx on public.pedidos_contacto (viatura_id);

create trigger pedidos_contacto_definir_atualizado_em
  before update on public.pedidos_contacto
  for each row execute function public.definir_atualizada_em_pedido();

-- ---------------------------------------------------------------------------
-- Pedidos de test drive
-- Um pedido é apenas um pedido: só passa a "agendado" quando um administrador o confirmar.
-- ---------------------------------------------------------------------------
create table public.pedidos_test_drive (
  id uuid primary key default gen_random_uuid(),
  viatura_id uuid references public.viaturas (id) on delete set null,
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (
    char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  telefone text not null check (char_length(telefone) between 6 and 30),
  data_preferida date,
  periodo_preferido text not null default 'indiferente'
    check (periodo_preferido in ('manha', 'tarde', 'indiferente')),
  mensagem text check (mensagem is null or char_length(mensagem) <= 2000),
  estado text not null default 'pendente'
    check (estado in ('pendente', 'contactado', 'agendado', 'realizado', 'cancelado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_test_drive_estado_idx on public.pedidos_test_drive (estado, criado_em desc);
create index pedidos_test_drive_viatura_idx on public.pedidos_test_drive (viatura_id);

create trigger pedidos_test_drive_definir_atualizado_em
  before update on public.pedidos_test_drive
  for each row execute function public.definir_atualizada_em_pedido();

-- ---------------------------------------------------------------------------
-- RLS
-- Nota para a aplicação: ao inserir como visitante, usar o modo "minimal" (não pedir a linha de volta),
-- porque os visitantes não têm permissão de leitura.
-- ---------------------------------------------------------------------------
alter table public.pedidos_contacto enable row level security;
alter table public.pedidos_test_drive enable row level security;

create policy "pedidos_contacto_criar_visitante"
  on public.pedidos_contacto for insert
  to anon, authenticated
  with check (estado = 'novo');

create policy "pedidos_contacto_ler_admin"
  on public.pedidos_contacto for select
  to authenticated
  using (public.is_admin());

create policy "pedidos_contacto_atualizar_admin"
  on public.pedidos_contacto for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pedidos_contacto_eliminar_admin"
  on public.pedidos_contacto for delete
  to authenticated
  using (public.is_admin());

create policy "pedidos_test_drive_criar_visitante"
  on public.pedidos_test_drive for insert
  to anon, authenticated
  with check (estado = 'pendente');

create policy "pedidos_test_drive_ler_admin"
  on public.pedidos_test_drive for select
  to authenticated
  using (public.is_admin());

create policy "pedidos_test_drive_atualizar_admin"
  on public.pedidos_test_drive for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pedidos_test_drive_eliminar_admin"
  on public.pedidos_test_drive for delete
  to authenticated
  using (public.is_admin());
