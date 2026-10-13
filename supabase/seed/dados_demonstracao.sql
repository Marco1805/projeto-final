-- Dados de DEMONSTRAÇÃO para testar o catálogo.
-- Todos os registos ficam marcados com dados_demonstracao = true e aparecem no site com a etiqueta "Demonstração".
-- Preços, quilometragens e especificações são ilustrativos e não correspondem a viaturas reais.
--
-- Para remover todos os dados de demonstração:
--   delete from public.viaturas where dados_demonstracao;

insert into public.viaturas
  (marca, modelo, versao, ano, preco, quilometragem, combustivel, caixa, cor, cilindrada_cc, potencia_cv,
   descricao, equipamento, estado, destaque, segmento, garantia_meses, iva_dedutivel, dados_demonstracao)
values
  ('Audi', 'A4 Avant', '35 TDI S line', 2021, 33900, 58000, 'diesel', 'automatica', 'Cinzento', 1968, 163,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Ar condicionado automático', 'Navegação', 'Sensores de estacionamento', 'Faróis LED'],
   'disponivel', true, 'carrinha', 24, true, true),

  ('BMW', 'Série 3', '320d Pack M', 2020, 36500, 72000, 'diesel', 'automatica', 'Preto', 1995, 190,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Bancos desportivos', 'Cruise control adaptativo', 'Câmara traseira', 'Jantes de liga leve'],
   'disponivel', true, 'sedan', 24, false, true),

  ('Mercedes-Benz', 'Classe C', '220 d AMG Line', 2022, 44900, 41000, 'diesel', 'automatica', 'Prateado', 1950, 194,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Ecrã tátil', 'Teto de abrir', 'Iluminação ambiente', 'Bancos aquecidos'],
   'disponivel', true, 'sedan', 36, true, true),

  ('Volvo', 'XC60', 'Recharge T6 Inscription', 2021, 47500, 49000, 'hibrido_plug_in', 'automatica', 'Branco', 1969, 340,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Suspensão pneumática', 'Sistema de som premium', 'Head-up display', 'Carregador wireless'],
   'reservada', false, 'suv', 24, true, true),

  ('Porsche', 'Macan', null, 2019, 52900, 66000, 'gasolina', 'automatica', 'Azul', 1984, 245,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Pack Sport Chrono', 'Bancos em pele', 'Navegação', 'Câmara 360°'],
   'disponivel', false, 'suv', 12, false, true),

  ('Tesla', 'Model 3', 'Long Range', 2022, 41900, 38000, 'eletrico', 'automatica', 'Vermelho', null, 440,
   'Registo de demonstração para testar o catálogo. Dados ilustrativos.',
   array['Piloto automático', 'Teto panorâmico', 'Ecrã central', 'Bomba de calor'],
   'disponivel', false, 'sedan', 36, true, true);
