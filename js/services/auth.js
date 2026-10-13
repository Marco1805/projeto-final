import { obterSupabase } from "../supabase-client.js";

/** Devolve o utilizador autenticado, ou null. Valida a sessão junto do servidor do Supabase. */
export async function obterUtilizador() {
  const supabase = await obterSupabase();
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function entrar(email, palavraPasse) {
  const supabase = await obterSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: palavraPasse });
  if (error) throw error;
  return data.user;
}

export async function sair() {
  const supabase = await obterSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Indica se o utilizador atual é administrador.
 * É só para decidir o que mostrar: quem protege os dados são as políticas RLS no servidor.
 */
export async function eAdministrador(utilizador) {
  if (!utilizador) return false;
  const supabase = await obterSupabase();
  const { data, error } = await supabase
    .from("administradores")
    .select("user_id")
    .eq("user_id", utilizador.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** Converte os erros do login numa mensagem clara, sem revelar se o email existe. */
export function mensagemErroLogin(erro) {
  const codigo = erro?.code ?? "";
  if (codigo === "invalid_credentials" || /invalid login/i.test(erro?.message ?? "")) {
    return "Email ou palavra-passe incorretos.";
  }
  if (codigo === "email_not_confirmed") return "O email desta conta ainda não foi confirmado.";
  if (erro?.status === 429 || codigo === "over_request_rate_limit") {
    return "Demasiadas tentativas. Aguarde um momento e volte a tentar.";
  }
  return "Não foi possível iniciar sessão. Tente novamente.";
}
