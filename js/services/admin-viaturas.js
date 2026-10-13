import { obterSupabase } from "../supabase-client.js";

const BUCKET = "viaturas";
export const TIPOS_IMAGEM = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024; // igual ao limite do bucket

function exigirLinhas(data, mensagem) {
  // Sem permissões, o Supabase devolve zero linhas em vez de um erro
  if (!data?.length) throw new Error(mensagem);
  return data;
}

export async function listarTodas({ q = "", estado = "" } = {}) {
  const supabase = await obterSupabase();
  let consulta = supabase
    .from("viaturas")
    .select("id, marca, modelo, versao, ano, preco, estado, destaque, dados_demonstracao, criada_em, viatura_fotografias(count)")
    .order("criada_em", { ascending: false })
    .limit(500);
  if (estado) consulta = consulta.eq("estado", estado);
  for (const palavra of q.split(" ").filter(Boolean).slice(0, 5)) {
    consulta = consulta.or(["marca", "modelo", "versao"].map((c) => `${c}.ilike.%${palavra}%`).join(","));
  }
  const { data, error } = await consulta;
  if (error) throw error;
  return data ?? [];
}

export async function obterParaEditar(id) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from("viaturas")
    .select("*, viatura_fotografias(id, caminho, legenda, ordem, principal)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fotografias = [...data.viatura_fotografias].sort(
    (a, b) => Number(b.principal) - Number(a.principal) || a.ordem - b.ordem
  );
  return { ...data, fotografias };
}

/** Cria (sem id) ou atualiza (com id) uma viatura. Devolve o id. */
export async function guardarViatura(dados, id = null) {
  const supabase = await obterSupabase();
  if (id) {
    const { data, error } = await supabase.from("viaturas").update(dados).eq("id", id).select("id");
    if (error) throw error;
    exigirLinhas(data, "Não foi possível guardar. Verifique se a sessão de administrador ainda é válida.");
    return id;
  }
  const { data, error } = await supabase.from("viaturas").insert(dados).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function atualizarCampos(id, campos) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase.from("viaturas").update(campos).eq("id", id).select("id");
  if (error) throw error;
  exigirLinhas(data, "Não foi possível atualizar a viatura.");
}

/** Elimina a viatura e os ficheiros de imagem dela (as linhas das fotografias saem por cascata). */
export async function eliminarViatura(id) {
  const supabase = await obterSupabase();
  const { data: ficheiros, error: erroLista } = await supabase.storage.from(BUCKET).list(id, { limit: 200 });
  if (erroLista) throw erroLista;
  if (ficheiros?.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(ficheiros.map((f) => `${id}/${f.name}`));
    if (error) throw error;
  }
  const { data, error } = await supabase.from("viaturas").delete().eq("id", id).select("id");
  if (error) throw error;
  exigirLinhas(data, "Não foi possível eliminar a viatura.");
}

// ---------- Fotografias ----------

export function validarImagem(ficheiro) {
  if (!Object.hasOwn(TIPOS_IMAGEM, ficheiro.type)) return "Só são aceites imagens JPEG, PNG ou WebP.";
  if (ficheiro.size > TAMANHO_MAXIMO_IMAGEM) return "A imagem tem mais de 5 MB.";
  return null;
}

/** Envia uma imagem para o Storage e regista-a. A primeira fotografia da viatura fica como principal. */
export async function enviarFotografia(viaturaId, ficheiro, { ordem, principal }) {
  const erro = validarImagem(ficheiro);
  if (erro) throw new Error(`${ficheiro.name}: ${erro}`);

  const supabase = await obterSupabase();
  const caminho = `${viaturaId}/${crypto.randomUUID()}.${TIPOS_IMAGEM[ficheiro.type]}`;
  const { error: erroEnvio } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, ficheiro, { contentType: ficheiro.type, cacheControl: "31536000", upsert: false });
  if (erroEnvio) throw erroEnvio;

  const { error } = await supabase
    .from("viatura_fotografias")
    .insert({ viatura_id: viaturaId, caminho, ordem, principal });
  if (error) {
    // Evita ficheiros órfãos no Storage se o registo falhar
    await supabase.storage.from(BUCKET).remove([caminho]);
    throw error;
  }
}

export async function definirPrincipal(viaturaId, fotografiaId) {
  const supabase = await obterSupabase();
  // Só pode haver uma principal por viatura: primeiro retira-se a atual, depois define-se a nova
  const { error: e1 } = await supabase
    .from("viatura_fotografias")
    .update({ principal: false })
    .eq("viatura_id", viaturaId)
    .eq("principal", true);
  if (e1) throw e1;
  const { data, error } = await supabase
    .from("viatura_fotografias")
    .update({ principal: true })
    .eq("id", fotografiaId)
    .select("id");
  if (error) throw error;
  exigirLinhas(data, "Não foi possível definir a fotografia principal.");
}

/** Remove a fotografia (Storage e registo). Se era a principal, a primeira restante passa a principal. */
export async function removerFotografia(viaturaId, fotografia, restantes) {
  const supabase = await obterSupabase();
  const { error: erroFicheiro } = await supabase.storage.from(BUCKET).remove([fotografia.caminho]);
  if (erroFicheiro) throw erroFicheiro;
  const { data, error } = await supabase.from("viatura_fotografias").delete().eq("id", fotografia.id).select("id");
  if (error) throw error;
  exigirLinhas(data, "Não foi possível remover a fotografia.");
  if (fotografia.principal && restantes.length) {
    await definirPrincipal(viaturaId, restantes[0].id);
  }
}

// ---------- Estatísticas ----------

export async function obterResumoStock() {
  const supabase = await obterSupabase();
  const { data, error } = await supabase.from("viaturas").select("estado, preco, destaque").limit(1000);
  if (error) throw error;
  const resumo = { total: 0, disponivel: 0, reservada: 0, vendida: 0, destaques: 0, valorDisponivel: 0 };
  for (const v of data ?? []) {
    resumo.total += 1;
    resumo[v.estado] += 1;
    if (v.destaque) resumo.destaques += 1;
    if (v.estado === "disponivel") resumo.valorDisponivel += Number(v.preco);
  }
  return resumo;
}
