import { esc } from "./format.js";

let regiao = null;

function obterRegiao() {
  if (!regiao) {
    regiao = document.createElement("div");
    regiao.className = "avisos";
    regiao.setAttribute("role", "status");
    regiao.setAttribute("aria-live", "polite");
    document.body.append(regiao);
  }
  return regiao;
}

/** Mostra um aviso temporário. tipo: "sucesso" | "erro". Os erros ficam mais tempo no ecrã. */
export function avisar(mensagem, tipo = "sucesso") {
  const aviso = document.createElement("p");
  aviso.className = `aviso aviso--${tipo}`;
  aviso.innerHTML = esc(mensagem);
  obterRegiao().append(aviso);
  setTimeout(() => aviso.remove(), tipo === "erro" ? 8000 : 4000);
}
