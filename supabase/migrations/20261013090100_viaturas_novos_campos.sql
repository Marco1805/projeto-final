-- Migração 5: novos campos na tabela de viaturas (segmento, IVA dedutível e garantia)
-- Permite categorizar as viaturas por segmento/carroçaria, destacar IVA dedutível para empresas e indicar garantia contratual.

alter table public.viaturas
  add column segmento text
    check (segmento is null or segmento in ('citadino', 'sedan', 'carrinha', 'suv', 'coupe', 'cabrio', 'monovolume', 'utilitario', 'outro')),
  add column iva_dedutivel boolean not null default false,
  add column garantia_meses smallint
    check (garantia_meses is null or garantia_meses > 0);

comment on column public.viaturas.segmento is 'Segmento ou tipo de carroçaria da viatura.';
comment on column public.viaturas.iva_dedutivel is 'Indica se o IVA da viatura é dedutível para empresas e profissionais.';
comment on column public.viaturas.garantia_meses is 'Número de meses de garantia incluídos na viatura (opcional).';

create index viaturas_segmento_idx on public.viaturas (segmento);
