import { esc } from "./format.js";

/**
 * Gera o HTML de um campo com rótulo, ajuda e espaço para a mensagem de erro.
 * - opcoes: [{ valor, texto }] cria um <select>; linhas cria um <textarea>; caso contrário um <input>.
 * - atributos: texto HTML extra para o controlo (por exemplo, 'maxlength="120"'). Usar só com valores fixos.
 */
export function htmlCampo({
  prefixo,
  nome,
  rotulo,
  tipo = "text",
  valor = "",
  obrigatorio = false,
  ajuda = "",
  atributos = "",
  opcoes = null,
  linhas = null,
  classe = "",
}) {
  const id = `${prefixo}-${nome}`;
  const descricao = [ajuda ? `${id}-ajuda` : "", `${id}-erro`].filter(Boolean).join(" ");
  const comum = `id="${id}" name="${nome}" aria-describedby="${descricao}"${obrigatorio ? " required" : ""} ${atributos}`;

  let controlo;
  if (opcoes) {
    controlo = `<select ${comum}>${opcoes
      .map((o) => `<option value="${esc(o.valor)}"${String(o.valor) === String(valor) ? " selected" : ""}>${esc(o.texto)}</option>`)
      .join("")}</select>`;
  } else if (linhas) {
    controlo = `<textarea ${comum} rows="${linhas}">${esc(valor)}</textarea>`;
  } else {
    controlo = `<input type="${tipo}" ${comum} value="${esc(valor)}">`;
  }

  return `
    <div class="campo ${classe}">
      <label for="${id}">${esc(rotulo)}${obrigatorio ? "" : " (opcional)"}</label>
      ${controlo}
      ${ajuda ? `<p class="campo__ajuda" id="${id}-ajuda">${esc(ajuda)}</p>` : ""}
      <p class="campo__erro" id="${id}-erro" hidden></p>
    </div>`;
}

/** Campo escondido que só os robôs preenchem. */
export function htmlArmadilha(prefixo) {
  return `
    <div class="campo--armadilha" aria-hidden="true">
      <label for="${prefixo}-website">Não preencha este campo</label>
      <input type="text" id="${prefixo}-website" name="website" tabindex="-1" autocomplete="off">
    </div>`;
}

export function limparErros(formulario) {
  formulario.querySelectorAll(".campo__erro").forEach((e) => {
    e.hidden = true;
    e.textContent = "";
  });
  formulario.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
  formulario.querySelector(".formulario__resumo-erros")?.remove();
}

/** Mostra os erros junto de cada campo e põe o foco no primeiro campo com erro. */
export function mostrarErros(formulario, erros) {
  let primeiro = null;
  for (const [nome, mensagem] of Object.entries(erros)) {
    const controlo = formulario.elements[nome];
    const erro = controlo && formulario.querySelector(`#${controlo.id}-erro`);
    if (!controlo || !erro) continue;
    erro.textContent = mensagem;
    erro.hidden = false;
    controlo.setAttribute("aria-invalid", "true");
    primeiro ??= controlo;
  }
  primeiro?.focus();
}

/** Mensagem geral no topo do formulário (por exemplo, falha de rede). */
export function mostrarErroGeral(formulario, mensagem) {
  formulario.querySelector(".formulario__resumo-erros")?.remove();
  const aviso = document.createElement("p");
  aviso.className = "formulario__resumo-erros";
  aviso.setAttribute("role", "alert");
  aviso.textContent = mensagem;
  formulario.prepend(aviso);
  aviso.scrollIntoView({ block: "nearest" });
}
