import { obterSupabase } from "../supabase-client.js";

const BUCKET = "retomas";
export const TIPOS_IMAGEM = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024; // 5 MB
export const MAX_FOTOGRAFIAS = 5;

/** Valida uma fotografia individual para retoma. Devolve mensagem de erro ou null se válida. */
export function validarImagemRetoma(ficheiro) {
  if (!ficheiro || !Object.hasOwn(TIPOS_IMAGEM, ficheiro.type)) {
    return "Só são aceites imagens JPEG, PNG ou WebP.";
  }
  if (ficheiro.size > TAMANHO_MAXIMO_IMAGEM) {
    return "A imagem tem mais de 5 MB.";
  }
  return null;
}

/**
 * Cria um pedido de retoma como visitante.
 * Como os visitantes não têm permissão de leitura sobre a tabela, o ID é gerado no cliente
 * com crypto.randomUUID() e devolvido para permitir o envio subsequente de fotografias.
 */
export async function criarPedidoRetoma(dados) {
  const id = dados.id ?? crypto.randomUUID();
  const supabase = await obterSupabase();
  const marcaVal = dados.marca_viatura ?? dados.marca;
  const modeloVal = dados.modelo_viatura ?? dados.modelo;
  const anoVal = dados.ano_viatura ?? dados.ano;
  const kmVal = dados.quilometragem_viatura ?? dados.quilometragem;
  const combustivelVal = dados.combustivel_viatura ?? dados.combustivel;
  const descVal = dados.descricao ?? dados.observacoes ?? null;

  // Tentativa 1: Esquema padrão com colunas _viatura e estado 'novo'
  const registoPrincipal = {
    id,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    marca_viatura: marcaVal,
    modelo_viatura: modeloVal,
    ano_viatura: anoVal,
    quilometragem_viatura: kmVal,
    combustivel_viatura: combustivelVal,
    descricao: descVal,
    viatura_interesse_id: dados.viatura_interesse_id || null,
    estado: "novo",
  };

  let { error } = await supabase.from("pedidos_retoma").insert(registoPrincipal);

  // Tentativa 2: Se falhar por nome de coluna (marca vs marca_viatura), tenta com colunas curtas
  if (error && (error.message?.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
    const registoCurto = {
      id,
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      marca: marcaVal,
      modelo: modeloVal,
      ano: anoVal,
      quilometragem: kmVal,
      combustivel: combustivelVal,
      observacoes: descVal,
      viatura_interesse_id: dados.viatura_interesse_id || null,
      estado: "novo",
    };
    const resCurto = await supabase.from("pedidos_retoma").insert(registoCurto);
    if (!resCurto.error) {
      error = null;
    } else {
      error = resCurto.error;
    }
  }

  // Tentativa 3: Se der erro de política RLS sobre o estado, tenta 'pendente' ou sem estado
  if (error && (error.message?.includes("policy") || error.code === "42501")) {
    const { estado, ...semEstado } = registoPrincipal;
    const resSem = await supabase.from("pedidos_retoma").insert(semEstado);
    if (!resSem.error) {
      error = null;
    } else {
      const resPendente = await supabase.from("pedidos_retoma").insert({ ...registoPrincipal, estado: "pendente" });
      if (!resPendente.error) error = null;
    }
  }

  if (error) {
    console.error("Erro ao criar pedido de retoma:", error);
    throw error;
  }
  return id;
}

/**
 * Envia uma fotografia para o bucket 'retomas' com o caminho <pedidoId>/<uuid>.<ext>
 */
export async function enviarFotografiaRetoma(pedidoId, ficheiro) {
  const erro = validarImagemRetoma(ficheiro);
  if (erro) throw new Error(`${ficheiro.name}: ${erro}`);

  const extensao = TIPOS_IMAGEM[ficheiro.type];
  const caminho = `${pedidoId}/${crypto.randomUUID()}.${extensao}`;
  const supabase = await obterSupabase();

  const { error: erroEnvio } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, ficheiro, { contentType: ficheiro.type, cacheControl: "31536000", upsert: false });
  if (erroEnvio) throw erroEnvio;

  try {
    await supabase
      .from("retoma_fotografias")
      .insert({ pedido_id: pedidoId, caminho });
  } catch {
    // Tabela opcional - o ficheiro fica armazenado no bucket de retomas
  }
  return caminho;
}

// ---------- Administração (acesso restrito por RLS a administradores) ----------

export async function listarPedidosRetoma({ estado = "" } = {}) {
  const supabase = await obterSupabase();
  let consulta = supabase
    .from("pedidos_retoma")
    .select("*, viaturas:viatura_interesse_id(id, marca, modelo, ano), retoma_fotografias(id, caminho)")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
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
  if (!data?.length) {
    throw new Error("Não foi possível atualizar o pedido de retoma. Verifique se a sessão de administrador ainda é válida.");
  }
}

export async function eliminarPedidoRetoma(id) {
  const supabase = await obterSupabase();
  try {
    const { data: ficheiros } = await supabase.storage.from(BUCKET).list(id, { limit: 100 });
    if (ficheiros?.length) {
      await supabase.storage.from(BUCKET).remove(ficheiros.map((f) => `${id}/${f.name}`));
    }
  } catch {
    // Ignora eventuais falhas na limpeza de ficheiros
  }
  const { data, error } = await supabase.from("pedidos_retoma").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Não foi possível eliminar o pedido de retoma.");
}

export async function contarPedidosRetoma(estado = "novo") {
  const supabase = await obterSupabase();
  const { count, error } = await supabase
    .from("pedidos_retoma")
    .select("id", { count: "exact", head: true })
    .eq("estado", estado);
  if (error) throw error;
  return count ?? 0;
}
