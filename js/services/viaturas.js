import { obterSupabase } from "../supabase-client.js";
import { aplicarFiltros } from "./filtros.js";

export const TAMANHO_PAGINA = 12;

const FOTOS = "viatura_fotografias(caminho, ordem, principal)";
const COLUNAS_CARTAO = `id, marca, modelo, versao, ano, preco, quilometragem, combustivel, caixa, estado, destaque, dados_demonstracao, ${FOTOS}`;
const COLUNAS_DETALHE = `*, ${FOTOS}`;
const ID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ordena as fotografias (principal primeiro) e acrescenta fotoPrincipal e fotografias à viatura. */
function normalizar(viatura) {
  const fotografias = [...(viatura.viatura_fotografias ?? [])].sort(
    (a, b) => Number(b.principal) - Number(a.principal) || a.ordem - b.ordem
  );
  return { ...viatura, fotografias, fotoPrincipal: fotografias[0] ?? null };
}

export async function listarViaturas(filtros, pagina = 0) {
  const supabase = await obterSupabase();
  const de = pagina * TAMANHO_PAGINA;
  const consulta = aplicarFiltros(
    supabase.from("viaturas").select(COLUNAS_CARTAO, { count: "exact" }),
    filtros
  ).range(de, de + TAMANHO_PAGINA - 1);

  const { data, error, count } = await consulta;
  if (error) throw error;
  return { viaturas: (data ?? []).map(normalizar), total: count ?? 0 };
}

/** Viaturas marcadas como destaque primeiro; se faltarem, completa com as mais recentes. */
export async function listarDestaques(quantidade = 12) {
  const supabase = await obterSupabase();
  const { data: destaques, error: erroDestaques } = await supabase
    .from("viaturas")
    .select(COLUNAS_CARTAO)
    .eq("destaque", true)
    .order("criada_em", { ascending: false })
    .limit(quantidade);

  if (!erroDestaques && destaques && destaques.length > 0) {
    if (destaques.length < quantidade) {
      const idsJaIncluidos = destaques.map((v) => v.id);
      const { data: maisRecentes } = await supabase
        .from("viaturas")
        .select(COLUNAS_CARTAO)
        .order("criada_em", { ascending: false })
        .limit(quantidade);
      const restantes = (maisRecentes ?? []).filter((v) => !idsJaIncluidos.includes(v.id));
      return [...destaques, ...restantes.slice(0, quantidade - destaques.length)].map(normalizar);
    }
    return destaques.map(normalizar);
  }

  const { data, error } = await supabase
    .from("viaturas")
    .select(COLUNAS_CARTAO)
    .order("criada_em", { ascending: false })
    .limit(quantidade);
  if (error) throw error;
  return (data ?? []).map(normalizar);
}

/** Contagem total de viaturas registadas no stand. */
export async function contarViaturas() {
  try {
    const supabase = await obterSupabase();
    const { count, error } = await supabase
      .from("viaturas")
      .select("id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Marcas com viaturas visíveis, com o número de viaturas de cada uma. */
export async function listarMarcas() {
  const supabase = await obterSupabase();
  const { data, error } = await supabase.from("viaturas").select("marca").limit(1000);
  if (error) throw error;
  const contagem = new Map();
  for (const { marca } of data ?? []) {
    contagem.set(marca, (contagem.get(marca) ?? 0) + 1);
  }
  return [...contagem]
    .map(([marca, total]) => ({ marca, total }))
    .sort((a, b) => a.marca.localeCompare(b.marca, "pt"));
}

/** Devolve a viatura ou null se não existir (ou não for pública). */
export async function obterViatura(id) {
  const limpo = String(id ?? "").trim().replace(/[/?#].*$/, "");
  const supabase = await obterSupabase();

  if (limpo && ID_VALIDO.test(limpo)) {
    try {
      const { data, error } = await supabase
        .from("viaturas")
        .select(COLUNAS_DETALHE)
        .eq("id", limpo)
        .maybeSingle();
      if (!error && data) return normalizar(data);
      
      const resBasico = await supabase
        .from("viaturas")
        .select("*")
        .eq("id", limpo)
        .maybeSingle();
      if (resBasico?.data) return normalizar(resBasico.data);
    } catch (erro) {
      console.warn("Erro ao obter viatura por ID:", erro);
      try {
        const { data } = await supabase.from("viaturas").select(COLUNAS_CARTAO).eq("id", limpo).maybeSingle();
        if (data) return normalizar(data);
      } catch {}
    }
    return null;
  }

  // Apenas se nenhum ID foi fornecido no URL (ex: acesso direto a viatura.html), carrega a primeira do stock
  if (!limpo) {
    try {
      const { data } = await supabase
        .from("viaturas")
        .select(COLUNAS_DETALHE)
        .order("criada_em", { ascending: false })
        .limit(1);
      if (data && data[0]) return normalizar(data[0]);
    } catch {}
  }

  return null;
}

/** Lista leve (id, marca, modelo, ano) para escolher uma viatura nos formulários. */
export async function listarOpcoesViaturas() {
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from("viaturas")
    .select("id, marca, modelo, versao, ano")
    .order("marca")
    .order("modelo")
    .limit(500);
  if (error) throw error;
  return data ?? [];
}
