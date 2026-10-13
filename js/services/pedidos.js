import { obterSupabase } from "../supabase-client.js";

export const TABELAS_PEDIDOS = {
  contacto: "pedidos_contacto",
  test_drive: "pedidos_test_drive",
  retoma: "pedidos_retoma",
};

/**
 * Cria um pedido como visitante. Não pede a linha de volta (os visitantes não têm permissão de leitura).
 * O estado inicial ("novo" / "pendente") é o valor predefinido da base de dados e é imposto pela política RLS.
 */
async function criarPedido(tabela, dados) {
  const supabase = await obterSupabase();
  let { error } = await supabase.from(tabela).insert(dados);

  // Se der erro de política RLS sobre o estado, tenta alternar o estado ou omiti-lo
  if (error && (error.message?.includes("policy") || error.code === "42501")) {
    const estadoAlt = dados.estado === "pendente" ? "novo" : "pendente";
    const resAlt = await supabase.from(tabela).insert({ ...dados, estado: estadoAlt });
    if (!resAlt.error) {
      error = null;
    } else {
      const { estado, ...dadosSemEstado } = dados;
      const resSem = await supabase.from(tabela).insert(dadosSemEstado);
      if (!resSem.error) error = null;
    }
  }

  if (error) {
    console.error(`Erro ao criar pedido na tabela ${tabela}:`, error);
    throw error;
  }
}

export const criarPedidoContacto = (dados) =>
  criarPedido(TABELAS_PEDIDOS.contacto, { ...dados, estado: "novo" });

export const criarPedidoTestDrive = (dados) =>
  criarPedido(TABELAS_PEDIDOS.test_drive, { ...dados, estado: "pendente" });

// ---------- Administração (as políticas RLS garantem que só administradores têm acesso) ----------

export async function listarPedidos(tipo, { estado = "" } = {}) {
  const supabase = await obterSupabase();
  let consulta = supabase
    .from(TABELAS_PEDIDOS[tipo])
    .select("*, viaturas(id, marca, modelo, ano)")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  if (error) throw error;
  return data ?? [];
}

export async function atualizarEstadoPedido(tipo, id, estado) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from(TABELAS_PEDIDOS[tipo])
    .update({ estado })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  // Sem permissões, o Supabase devolve zero linhas em vez de um erro
  if (!data?.length) throw new Error("Não foi possível atualizar o pedido. Verifique se a sessão de administrador ainda é válida.");
}

export async function eliminarPedido(tipo, id) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase.from(TABELAS_PEDIDOS[tipo]).delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Não foi possível eliminar o pedido.");
}

export async function contarPedidos(tipo, estado) {
  const supabase = await obterSupabase();
  const { count, error } = await supabase
    .from(TABELAS_PEDIDOS[tipo])
    .select("id", { count: "exact", head: true })
    .eq("estado", estado);
  if (error) throw error;
  return count ?? 0;
}
