import test from "node:test";
import assert from "node:assert/strict";
import {
  aplicarFiltros,
  filtrosParaParametros,
  lerFiltros,
  limparTextoPesquisa,
} from "../js/services/filtros.js";
import { esc, formatarKm } from "../js/ui/format.js";

/** Consulta falsa que regista os métodos chamados, para testar aplicarFiltros sem Supabase. */
function consultaFalsa() {
  const chamadas = [];
  const proxy = new Proxy(
    {},
    {
      get:
        (_, nome) =>
        (...args) => {
          chamadas.push([nome, ...args]);
          return proxy;
        },
    }
  );
  return { proxy, chamadas };
}

test("limparTextoPesquisa remove carateres especiais do PostgREST", () => {
  assert.equal(limparTextoPesquisa("bmw,(serie)%*:3"), "bmw serie 3");
  assert.equal(limparTextoPesquisa("  Mercedes-Benz  C.220 "), "Mercedes-Benz C.220");
  assert.equal(limparTextoPesquisa("Citroën Ácore"), "Citroën Ácore");
  assert.equal(limparTextoPesquisa("a".repeat(100)).length, 60);
});

test("lerFiltros valida os valores do URL", () => {
  const f = lerFiltros("q=audi&combustivel=diesel&preco_max=40000&ano_min=2020&km_max=-5&ordenar=preco_asc");
  assert.equal(f.q, "audi");
  assert.equal(f.combustivel, "diesel");
  assert.equal(f.precoMax, 40000);
  assert.equal(f.anoMin, 2020);
  assert.equal(f.kmMax, null, "valores negativos são ignorados");
  assert.equal(f.ordenar, "preco_asc");
});

test("lerFiltros ignora valores inválidos e usa predefinições", () => {
  const f = lerFiltros("combustivel=nuclear&ordenar=hack&preco_min=abc&ano_min=");
  assert.equal(f.combustivel, "");
  assert.equal(f.ordenar, "recentes");
  assert.equal(f.precoMin, null);
  assert.equal(f.anoMin, null);
});

test("filtrosParaParametros só inclui filtros ativos e é inverso de lerFiltros", () => {
  const original = lerFiltros("marca=BMW&segmento=suv&iva_dedutivel=true&preco_max=50000&ordenar=km_asc");
  const parametros = filtrosParaParametros(original);
  assert.equal(parametros.toString(), "marca=BMW&segmento=suv&preco_max=50000&iva_dedutivel=true&ordenar=km_asc");
  assert.deepEqual(lerFiltros(parametros), original);
  assert.equal(filtrosParaParametros(lerFiltros("")).toString(), "");
});

test("aplicarFiltros cria um filtro por palavra e aplica os restantes filtros", () => {
  const { proxy, chamadas } = consultaFalsa();
  aplicarFiltros(proxy, lerFiltros("q=audi a4&marca=Audi&segmento=suv&combustivel=diesel&preco_min=10000&preco_max=40000&ano_min=2019&km_max=90000&iva_dedutivel=true&ordenar=preco_desc"));
  const nomes = chamadas.map((c) => c[0]);
  assert.equal(nomes.filter((n) => n === "or").length, 2, "uma chamada or() por palavra");
  assert.ok(chamadas.some((c) => c[0] === "ilike" && c[1] === "marca" && c[2] === "Audi"));
  assert.ok(chamadas.some((c) => c[0] === "eq" && c[1] === "segmento" && c[2] === "suv"));
  assert.ok(chamadas.some((c) => c[0] === "eq" && c[1] === "combustivel" && c[2] === "diesel"));
  assert.ok(chamadas.some((c) => c[0] === "gte" && c[1] === "preco" && c[2] === 10000));
  assert.ok(chamadas.some((c) => c[0] === "lte" && c[1] === "preco" && c[2] === 40000));
  assert.ok(chamadas.some((c) => c[0] === "gte" && c[1] === "ano" && c[2] === 2019));
  assert.ok(chamadas.some((c) => c[0] === "lte" && c[1] === "quilometragem" && c[2] === 90000));
  assert.ok(chamadas.some((c) => c[0] === "eq" && c[1] === "iva_dedutivel" && c[2] === true));
  const ordem = chamadas.find((c) => c[0] === "order");
  assert.deepEqual(ordem.slice(1), ["preco", { ascending: false }]);
});

test("esc escapa HTML para evitar XSS", () => {
  assert.equal(esc('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(esc(null), "");
});

test("formatarKm devolve texto vazio quando não há valor", () => {
  assert.equal(formatarKm(null), "");
  assert.match(formatarKm(58000), /58\s?000 km/);
});
