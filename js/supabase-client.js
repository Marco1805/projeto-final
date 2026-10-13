import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config.js";

const VERSAO_SUPABASE_JS = "2.117.2";

export class SupabaseNaoConfigurado extends Error {
  constructor() {
    super("A ligação ao Supabase ainda não está configurada.");
    this.name = "SupabaseNaoConfigurado";
  }
}

export function supabaseConfigurado() {
  return /^https?:\/\/\S+$/.test(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 20;
}

let cliente = null;

/**
 * Devolve o cliente Supabase, criado só na primeira utilização.
 * A biblioteca é carregada à parte, para que uma falha de rede não impeça o resto do site de arrancar.
 */
export async function obterSupabase() {
  if (!supabaseConfigurado()) {
    throw new SupabaseNaoConfigurado();
  }
  if (!cliente) {
    const { createClient } = await import(
      `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${VERSAO_SUPABASE_JS}/+esm`
    );
    cliente = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return cliente;
}

/** URL pública de uma fotografia guardada no bucket "viaturas" do Supabase Storage. */
export function urlFotografia(caminho) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  const codificado = String(caminho).split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/viaturas/${codificado}`;
}
