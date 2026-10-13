-- Migração 1: modelo de dados do catálogo
-- Cria os administradores, as viaturas, as fotografias, o bucket de imagens e as políticas RLS.
-- Executar no Supabase (SQL Editor) ou com a CLI: supabase db push

-- ---------------------------------------------------------------------------
-- Função auxiliar para manter a data de atualização
-- ---------------------------------------------------------------------------
create or replace function public.definir_atualizada_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administradores
-- Só quem estiver nesta tabela pode gerir o catálogo. Não há políticas de escrita:
-- ninguém se torna administrador através da API, apenas por SQL (ver README).
-- ---------------------------------------------------------------------------
create table public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.administradores enable row level security;

create policy "administradores_ver_proprio_registo"
  on public.administradores
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.administradores a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Viaturas
-- ---------------------------------------------------------------------------
create table public.viaturas (
  id uuid primary key default gen_random_uuid(),
  marca text not null check (char_length(marca) between 1 and 60),
  modelo text not null check (char_length(modelo) between 1 and 80),
  versao text check (versao is null or char_length(versao) <= 120),
  ano smallint not null check (ano between 1950 and 2100),
  preco numeric(10, 2) not null check (preco >= 0),
  quilometragem integer not null default 0 check (quilometragem >= 0),
  combustivel text not null
    check (combustivel in ('gasolina', 'diesel', 'hibrido', 'hibrido_plug_in', 'eletrico', 'gpl', 'outro')),
  caixa text check (caixa is null or caixa in ('manual', 'automatica')),
  cor text check (cor is null or char_length(cor) <= 40),
  cilindrada_cc integer check (cilindrada_cc is null or cilindrada_cc > 0),
  potencia_cv integer check (potencia_cv is null or potencia_cv > 0),
  descricao text check (descricao is null or char_length(descricao) <= 5000),
  equipamento text[] not null default '{}',
  estado text not null default 'disponivel' check (estado in ('disponivel', 'reservada', 'vendida')),
  destaque boolean not null default false,
  dados_demonstracao boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

comment on table public.viaturas is 'Catálogo de viaturas do stand. A matrícula não é guardada nesta tabela pública.';
comment on column public.viaturas.dados_demonstracao is 'true = registo de teste, removível com: delete from public.viaturas where dados_demonstracao;';

create trigger viaturas_definir_atualizada_em
  before update on public.viaturas
  for each row execute function public.definir_atualizada_em();

-- Índices para os filtros e ordenações do catálogo
create index viaturas_estado_preco_idx on public.viaturas (estado, preco);
create index viaturas_marca_idx on public.viaturas (lower(marca));
create index viaturas_ano_idx on public.viaturas (ano);
create index viaturas_combustivel_idx on public.viaturas (combustivel);
create index viaturas_criada_em_idx on public.viaturas (criada_em desc);

alter table public.viaturas enable row level security;

-- Visitantes veem apenas viaturas disponíveis ou reservadas; administradores veem tudo
create policy "viaturas_leitura_publica"
  on public.viaturas for select
  to anon, authenticated
  using (estado in ('disponivel', 'reservada'));

create policy "viaturas_leitura_admin"
  on public.viaturas for select
  to authenticated
  using (public.is_admin());

create policy "viaturas_inserir_admin"
  on public.viaturas for insert
  to authenticated
  with check (public.is_admin());

create policy "viaturas_atualizar_admin"
  on public.viaturas for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "viaturas_eliminar_admin"
  on public.viaturas for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Fotografias das viaturas
-- "caminho" é o caminho do ficheiro dentro do bucket "viaturas" (por exemplo: <id-da-viatura>/frente.jpg)
-- ---------------------------------------------------------------------------
create table public.viatura_fotografias (
  id uuid primary key default gen_random_uuid(),
  viatura_id uuid not null references public.viaturas (id) on delete cascade,
  caminho text not null check (char_length(caminho) between 1 and 300),
  legenda text check (legenda is null or char_length(legenda) <= 160),
  ordem smallint not null default 0,
  principal boolean not null default false,
  criada_em timestamptz not null default now()
);

create index viatura_fotografias_viatura_idx on public.viatura_fotografias (viatura_id, ordem);

-- No máximo uma fotografia principal por viatura
create unique index viatura_fotografias_uma_principal_idx
  on public.viatura_fotografias (viatura_id)
  where principal;

alter table public.viatura_fotografias enable row level security;

-- A subconsulta respeita as políticas da tabela viaturas: só se veem fotografias de viaturas visíveis
create policy "fotografias_leitura_publica"
  on public.viatura_fotografias for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.viaturas v
      where v.id = viatura_id and v.estado in ('disponivel', 'reservada')
    )
  );

create policy "fotografias_leitura_admin"
  on public.viatura_fotografias for select
  to authenticated
  using (public.is_admin());

create policy "fotografias_inserir_admin"
  on public.viatura_fotografias for insert
  to authenticated
  with check (public.is_admin());

create policy "fotografias_atualizar_admin"
  on public.viatura_fotografias for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "fotografias_eliminar_admin"
  on public.viatura_fotografias for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket público de leitura (URL direto das imagens), escrita só para administradores
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('viaturas', 'viaturas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "viaturas_imagens_listar_admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'viaturas' and public.is_admin());

create policy "viaturas_imagens_enviar_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'viaturas' and public.is_admin());

create policy "viaturas_imagens_atualizar_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'viaturas' and public.is_admin())
  with check (bucket_id = 'viaturas' and public.is_admin());

create policy "viaturas_imagens_eliminar_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'viaturas' and public.is_admin());
