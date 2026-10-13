-- Migração 4: pedidos de retoma e fotografias associadas
-- Permite que visitantes solicitem uma avaliação de retoma e enviem fotografias.
-- Administradores gerem os pedidos através da área reservada.

-- ---------------------------------------------------------------------------
-- Tabela de pedidos de retoma
-- ---------------------------------------------------------------------------
create table if not exists public.pedidos_retoma (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (
    char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  telefone text not null check (char_length(telefone) between 6 and 30),
  marca_viatura text not null check (char_length(marca_viatura) between 1 and 60),
  modelo_viatura text not null check (char_length(modelo_viatura) between 1 and 80),
  ano_viatura smallint not null check (ano_viatura between 1950 and 2100),
  quilometragem_viatura integer not null check (quilometragem_viatura >= 0),
  combustivel_viatura text not null check (
    combustivel_viatura in ('gasolina', 'diesel', 'hibrido', 'hibrido_plug_in', 'eletrico', 'gpl', 'outro')
  ),
  descricao text check (descricao is null or char_length(descricao) <= 2000),
  viatura_interesse_id uuid references public.viaturas (id) on delete set null,
  estado text not null default 'pendente'
    check (estado in ('pendente', 'em_avaliacao', 'contactado', 'concluido', 'recusado', 'arquivado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.pedidos_retoma is 'Pedidos de avaliação de viaturas para retoma ou venda.';

create index if not exists pedidos_retoma_estado_idx on public.pedidos_retoma (estado, criado_em desc);
create index if not exists pedidos_retoma_viatura_interesse_idx on public.pedidos_retoma (viatura_interesse_id);

drop trigger if exists pedidos_retoma_definir_atualizado_em on public.pedidos_retoma;
create trigger pedidos_retoma_definir_atualizado_em
  before update on public.pedidos_retoma
  for each row execute function public.definir_atualizada_em_pedido();

-- ---------------------------------------------------------------------------
-- Fotografias dos pedidos de retoma
-- ---------------------------------------------------------------------------
create table if not exists public.retoma_fotografias (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_retoma (id) on delete cascade,
  caminho text not null check (char_length(caminho) between 1 and 300),
  criado_em timestamptz not null default now()
);

comment on table public.retoma_fotografias is 'Fotografias enviadas pelo utilizador para avaliação da sua viatura.';

create index if not exists retoma_fotografias_pedido_idx on public.retoma_fotografias (pedido_id);

-- ---------------------------------------------------------------------------
-- RLS - pedidos_retoma
-- Visitantes apenas criam pedidos com estado "pendente" (sem leitura).
-- Administradores têm acesso total.
-- ---------------------------------------------------------------------------
alter table public.pedidos_retoma enable row level security;

create policy "pedidos_retoma_criar_visitante"
  on public.pedidos_retoma for insert
  to anon, authenticated
  with check (estado = 'pendente');

create policy "pedidos_retoma_ler_admin"
  on public.pedidos_retoma for select
  to authenticated
  using (public.is_admin());

create policy "pedidos_retoma_atualizar_admin"
  on public.pedidos_retoma for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pedidos_retoma_eliminar_admin"
  on public.pedidos_retoma for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RLS - retoma_fotografias
-- Visitantes podem registar fotografias associadas ao pedido.
-- ---------------------------------------------------------------------------
alter table public.retoma_fotografias enable row level security;

create policy "retoma_fotografias_criar_visitante"
  on public.retoma_fotografias for insert
  to anon, authenticated
  with check (true);

create policy "retoma_fotografias_ler_admin"
  on public.retoma_fotografias for select
  to authenticated
  using (public.is_admin());

create policy "retoma_fotografias_eliminar_admin"
  on public.retoma_fotografias for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket retomas (privado, leitura restrita a administradores)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('retomas', 'retomas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "retomas_imagens_enviar_visitante"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'retomas');

create policy "retomas_imagens_listar_admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'retomas' and public.is_admin());

create policy "retomas_imagens_eliminar_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'retomas' and public.is_admin());
