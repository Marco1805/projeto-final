import { esc } from "./format.js";

export function htmlEsqueletos(quantidade = 3) {
  return Array.from(
    { length: quantidade },
    () => `
    <div class="cartao cartao--esqueleto" aria-hidden="true">
      <div class="cartao__media"></div>
      <div class="cartao__corpo">
        <span class="esqueleto-linha"></span>
        <span class="esqueleto-linha esqueleto-linha--curta"></span>
      </div>
    </div>`
  ).join("");
}

/** Bloco de mensagem. "acao" é opcional: { texto, href }. */
export function htmlMensagem({ titulo, texto, acao, erro = false }) {
  return `
    <div class="mensagem${erro ? " mensagem--erro" : ""}" role="${erro ? "alert" : "status"}">
      <p class="mensagem__titulo">${esc(titulo)}</p>
      <p>${esc(texto)}</p>
      ${acao ? `<a class="botao botao--contorno" href="${esc(acao.href)}">${esc(acao.texto)}</a>` : ""}
    </div>`;
}

/** Converte um erro técnico numa mensagem clara para quem visita o site. */
export function mensagemDeErro(erro) {
  if (erro?.name === "SupabaseNaoConfigurado") {
    return {
      titulo: "Ligação ao Supabase por configurar",
      texto: "Preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em js/config.js para carregar as viaturas.",
      erro: true,
    };
  }
  console.error(erro);
  return {
    titulo: "Não foi possível carregar as viaturas",
    texto: "Verifique a ligação à Internet e volte a tentar dentro de momentos.",
    erro: true,
  };
}
