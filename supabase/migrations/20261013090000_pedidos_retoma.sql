-- Migração 4: pedidos de avaliação de retoma e fotografias associadas
-- Permite que visitantes solicitem avaliação do seu veículo para retoma e anexem fotografias.
-- Administradores gerem os pedidos e analisam as propostas na área reservada.

-- ---------------------------------------------------------------------------
-- Tabela de pedidos de retoma
-- ---------------------------------------------------------------------------
create table public.pedidos_retoma (
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
  combustivel_viatura text not null
    check (combustivel_viatura in ('gasolina', 'diesel', 'hibrido', 'hibrido_plug_in', 'eletrico', 'gpl', 'outro')),
  descricao text check (descricao is null or char_length(descricao) <= 2000),
  viatura_interesse_id uuid references public.viaturas (id) on delete set null,
  estado text not null default 'novo'
    check (estado in ('novo', 'em_analise', 'proposta_enviada', 'aceite', 'recusado', 'arquivado')),
  notas_admin text check (notas_admin is null or char_length(notas_admin) <= 2000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.pedidos_retoma is 'Pedidos de avaliação de retoma submetidos por visitantes.';
comment on column public.pedidos_retoma.viatura_interesse_id is 'Viatura do catálogo que o visitante tem interesse em adquirir.';
comment on column public.pedidos_retoma.notas_admin is 'Notas internas da equipa de administração e vendas sobre a retoma.';

create index pedidos_retoma_estado_idx on public.pedidos_retoma (estado, criado_em desc);
create index pedidos_retoma_criado_em_idx on public.pedidos_retoma (criado_em desc);
create index pedidos_retoma_viatura_interesse_idx on public.pedidos_retoma (viatura_interesse_id);

create trigger pedidos_retoma_definir_atualizado_em
  before update on public.pedidos_retoma
  for each row execute function public.definir_atualizada_em_pedido();

-- ---------------------------------------------------------------------------
-- Tabela de fotografias de retoma
-- Fotografias anexadas pelo visitante para apoiar a avaliação do veículo.
-- ---------------------------------------------------------------------------
create table public.retoma_fotografias (
  id uuid primary key default gen_random_uuid(),
  pedido_retoma_id uuid not null references public.pedidos_retoma (id) on delete cascade,
  caminho text not null check (char_length(caminho) between 1 and 300),
  criada_em timestamptz not null default now()
);

comment on table public.retoma_fotografias is 'Fotografias anexadas aos pedidos de avaliação de retoma.';

create index retoma_fotografias_pedido_idx on public.retoma_fotografias (pedido_retoma_id);

-- ---------------------------------------------------------------------------
-- Storage: bucket retomas (leitura pública, escrita restrita a administradores)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('retomas', 'retomas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "retomas_imagens_listar_admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'retomas' and public.is_admin());

create policy "retomas_imagens_enviar_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'retomas' and public.is_admin());

create policy "retomas_imagens_atualizar_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'retomas' and public.is_admin())
  with check (bucket_id = 'retomas' and public.is_admin());

create policy "retomas_imagens_eliminar_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'retomas' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Visitantes podem apenas criar pedidos (estado='novo') e anexar fotografias.
-- Apenas administradores podem consultar, alterar ou eliminar pedidos e fotografias.
-- ---------------------------------------------------------------------------
alter table public.pedidos_retoma enable row level security;
alter table public.retoma_fotografias enable row level security;

create policy "pedidos_retoma_criar_visitante"
  on public.pedidos_retoma for insert
  to anon, authenticated
  with check (estado = 'novo');

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

create policy "retoma_fotografias_criar_visitante"
  on public.retoma_fotografias for insert
  to anon, authenticated
  with check (true);

create policy "retoma_fotografias_ler_admin"
  on public.retoma_fotografias for select
  to authenticated
  using (public.is_admin());

create policy "retoma_fotografias_atualizar_admin"
  on public.retoma_fotografias for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "retoma_fotografias_eliminar_admin"
  on public.retoma_fotografias for delete
  to authenticated
  using (public.is_admin());
