import { obterSupabase } from "../supabase-client.js";
import { SUPABASE_URL } from "../config.js";

export const ESTADOS_RETOMA = {
  novo: "Novo",
  em_analise: "Em análise",
  proposta_enviada: "Proposta enviada",
  aceite: "Aceite",
  recusado: "Recusado",
  arquivado: "Arquivado",
};

export function urlFotografiaRetoma(caminho) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  const codificado = String(caminho).split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/retomas/${codificado}`;
}

export async function listarPedidosRetoma({ estado = "" } = {}) {
  const supabase = await obterSupabase();
  let consulta = supabase
    .from("pedidos_retoma")
    .select("*, viaturas:viatura_interesse_id(id, marca, modelo, ano), retoma_fotografias(count)")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  if (error) throw error;
  return data ?? [];
}

export async function obterFotografiasRetoma(pedidoRetomaId) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from("retoma_fotografias")
    .select("*")
    .eq("pedido_retoma_id", pedidoRetomaId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function atualizarEstadoRetoma(id, estado) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from("pedidos_retoma")
    .update({ estado })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Não foi possível atualizar o pedido.");
}

export async function eliminarPedidoRetoma(id) {
  const supabase = await obterSupabase();
  // Delete photos from storage first
  const { data: fotos } = await supabase
    .from("retoma_fotografias")
    .select("caminho")
    .eq("pedido_retoma_id", id);
  if (fotos?.length) {
    await supabase.storage.from("retomas").remove(fotos.map((f) => f.caminho));
  }
  const { data, error } = await supabase
    .from("pedidos_retoma")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Não foi possível eliminar o pedido.");
}

export async function contarPedidosRetoma(estado) {
  const supabase = await obterSupabase();
  const { count, error } = await supabase
    .from("pedidos_retoma")
    .select("id", { count: "exact", head: true })
    .eq("estado", estado);
  if (error) throw error;
  return count ?? 0;
}
