import { CAIXAS, COMBUSTIVEIS } from "../ui/format.js";

export const ORDENACOES = {
  recentes: { coluna: "criada_em", ascendente: false, rotulo: "Mais recentes" },
  marca_asc: { coluna: "marca", ascendente: true, rotulo: "Marca: A-Z" },
  preco_asc: { coluna: "preco", ascendente: true, rotulo: "Preço: do mais baixo" },
  preco_desc: { coluna: "preco", ascendente: false, rotulo: "Preço: do mais alto" },
  ano_desc: { coluna: "ano", ascendente: false, rotulo: "Ano: do mais recente" },
  km_asc: { coluna: "quilometragem", ascendente: true, rotulo: "Quilometragem: da mais baixa" },
};

export const SEGMENTOS = {
  suv: 'SUV',
  sedan: 'Sedan / Berlina',
  berlina: 'Sedan / Berlina',
  carrinha: 'Carrinha',
  citadino: 'Citadino',
  coupe: 'Coupé',
  cabrio: 'Cabriolet',
  monovolume: 'Monovolume',
  utilitario: 'Utilitário',
  outro: 'Outro',
};

/**
 * Deixa só letras, números, espaços, pontos e hífenes.
 * Remove os carateres com significado especial nos filtros do PostgREST (vírgulas, parênteses, %, *, :).
 */
export function limparTextoPesquisa(texto = "") {
  return String(texto)
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Lê os filtros a partir dos parâmetros do URL (ou de um FormData convertido) e valida-os. */
export function lerFiltros(parametros) {
  const p = parametros instanceof URLSearchParams ? parametros : new URLSearchParams(parametros);
  const combustivel = p.get("combustivel") ?? "";
  const caixa = p.get("caixa") ?? "";
  const ordenar = p.get("ordenar") ?? "";
  return {
    q: limparTextoPesquisa(p.get("q") ?? ""),
    marca: limparTextoPesquisa(p.get("marca") ?? ""),
    segmento: Object.hasOwn(SEGMENTOS, p.get("segmento") ?? "") ? p.get("segmento") : "",
    combustivel: Object.hasOwn(COMBUSTIVEIS, combustivel) ? combustivel : "",
    caixa: Object.hasOwn(CAIXAS, caixa) ? caixa : "",
    precoMin: numeroOuNulo(p.get("preco_min")),
    precoMax: numeroOuNulo(p.get("preco_max")),
    anoMin: numeroOuNulo(p.get("ano_min")),
    anoMax: numeroOuNulo(p.get("ano_max")),
    kmMin: numeroOuNulo(p.get("km_min")),
    kmMax: numeroOuNulo(p.get("km_max")),
    ivaDedutivel: p.get("iva_dedutivel") === "true",
    estado: p.get("estado") ?? "",
    ordenar: Object.hasOwn(ORDENACOES, ordenar) ? ordenar : "recentes",
  };
}

/** Operação inversa de lerFiltros: só inclui os filtros que estão ativos. */
export function filtrosParaParametros(f) {
  const p = new URLSearchParams();
  if (f?.q) p.set("q", f.q);
  if (f?.marca) p.set("marca", f.marca);
  if (f?.segmento) p.set("segmento", f.segmento);
  if (f?.combustivel) p.set("combustivel", f.combustivel);
  if (f?.caixa) p.set("caixa", f.caixa);
  if (f?.precoMin !== null && f?.precoMin !== undefined) p.set("preco_min", String(f.precoMin));
  if (f?.precoMax !== null && f?.precoMax !== undefined) p.set("preco_max", String(f.precoMax));
  if (f?.anoMin !== null && f?.anoMin !== undefined) p.set("ano_min", String(f.anoMin));
  if (f?.anoMax !== null && f?.anoMax !== undefined) p.set("ano_max", String(f.anoMax));
  if (f?.kmMin !== null && f?.kmMin !== undefined) p.set("km_min", String(f.kmMin));
  if (f?.kmMax !== null && f?.kmMax !== undefined) p.set("km_max", String(f.kmMax));
  if (f?.ivaDedutivel) p.set("iva_dedutivel", "true");
  if (f?.estado) p.set("estado", f.estado);
  if (f?.ordenar && f.ordenar !== "recentes") p.set("ordenar", f.ordenar);
  return p;
}

/**
 * Aplica os filtros a uma consulta do Supabase (query builder).
 * Cada palavra da pesquisa tem de aparecer na marca, modelo, versão ou descrição.
 */
export function aplicarFiltros(consulta, f = {}) {
  let c = consulta;
  const textoQ = f?.q ? String(f.q).trim() : "";
  if (textoQ) {
    for (const palavra of textoQ.split(" ").filter(Boolean).slice(0, 5)) {
      c = c.or(
        ["marca", "modelo", "versao", "descricao"].map((col) => `${col}.ilike.%${palavra}%`).join(",")
      );
    }
  }
  if (f?.marca) c = c.ilike("marca", f.marca);
  if (f?.segmento) {
    if (f.segmento === 'sedan' || f.segmento === 'berlina') {
      c = c.in('segmento', ['sedan', 'berlina']);
    } else {
      c = c.eq("segmento", f.segmento);
    }
  }
  if (f?.combustivel) c = c.eq("combustivel", f.combustivel);
  if (f?.caixa) c = c.eq("caixa", f.caixa);
  if (f?.precoMin != null) c = c.gte("preco", f.precoMin);
  if (f?.precoMax != null) c = c.lte("preco", f.precoMax);
  if (f?.anoMin != null) c = c.gte("ano", f.anoMin);
  if (f?.anoMax != null) c = c.lte("ano", f.anoMax);
  if (f?.kmMin != null) c = c.gte("quilometragem", f.kmMin);
  if (f?.kmMax != null) c = c.lte("quilometragem", f.kmMax);
  if (f?.ivaDedutivel) c = c.eq("iva_dedutivel", true);
  if (f?.estado) {
    if (f.estado === "vendida") {
      c = c.eq("estado", "vendida");
    } else if (f.estado === "disponivel") {
      c = c.in("estado", ["disponivel", "reservada"]);
    } else if (f.estado !== "todos") {
      c = c.eq("estado", f.estado);
    }
  }
  const ordem = ORDENACOES[f?.ordenar] ?? ORDENACOES.recentes;
  return c.order(ordem.coluna, { ascending: ordem.ascendente }).order("id");
}
