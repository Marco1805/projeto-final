-- Migração 5: campos adicionais na tabela de viaturas (segmento, garantia e IVA dedutível)
-- Suporta os novos filtros do catálogo e a ficha técnica enriquecida.
-- Executar no Supabase (SQL Editor) ou com a CLI: supabase db push

alter table public.viaturas
  add column if not exists segmento text
    check (segmento is null or segmento in ('citadino', 'sedan', 'carrinha', 'suv', 'coupe', 'cabrio', 'monovolume', 'utilitario', 'outro')),
  add column if not exists garantia_meses smallint
    check (garantia_meses is null or garantia_meses >= 0),
  add column if not exists iva_dedutivel boolean not null default false;

comment on column public.viaturas.segmento is 'Segmento/carroçaria da viatura (citadino, sedan, suv, etc.).';
comment on column public.viaturas.garantia_meses is 'Meses de garantia contratual incluída no preço.';
comment on column public.viaturas.iva_dedutivel is 'Indica se a viatura permite a dedução de IVA para empresas/profissionais.';

-- Índices para suportar os novos filtros
create index if not exists viaturas_segmento_idx on public.viaturas (segmento) where segmento is not null;
create index if not exists viaturas_iva_dedutivel_idx on public.viaturas (iva_dedutivel) where iva_dedutivel = true;
