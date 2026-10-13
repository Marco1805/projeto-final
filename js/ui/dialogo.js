import { esc } from "./format.js";

/**
 * Pede confirmação com uma janela nativa <dialog> (gere o foco e o teclado por si).
 * Devolve uma Promise<boolean>: true se o utilizador confirmar.
 */
export function confirmar({ titulo, texto, textoConfirmar = "Confirmar" }) {
  return new Promise((resolver) => {
    const dialogo = document.createElement("dialog");
    dialogo.className = "dialogo";
    dialogo.setAttribute("aria-labelledby", "dialogo-titulo");
    dialogo.innerHTML = `
      <form method="dialog" class="dialogo__corpo">
        <h2 id="dialogo-titulo">${esc(titulo)}</h2>
        <p>${esc(texto)}</p>
        <div class="dialogo__acoes">
          <button class="botao botao--contorno" value="cancelar" autofocus>Cancelar</button>
          <button class="botao botao--perigo" value="confirmar">${esc(textoConfirmar)}</button>
        </div>
      </form>`;
    dialogo.addEventListener("close", () => {
      const confirmado = dialogo.returnValue === "confirmar";
      dialogo.remove();
      resolver(confirmado);
    });
    document.body.append(dialogo);
    dialogo.showModal();
  });
}
