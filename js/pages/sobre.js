import { montarLayout } from "../ui/layout.js";
import { SITE } from "../site-config.js";
import { esc } from "../ui/format.js";

montarLayout("sobre");

function preencherSobre() {
  const sobre = SITE.sobre ?? {};

  const tituloAlvo = document.getElementById("titulo-hero");
  if (tituloAlvo && sobre.titulo) {
    tituloAlvo.textContent = sobre.titulo;
  }

  const introAlvo = document.getElementById("sobre-introducao");
  if (introAlvo && sobre.introducao) {
    introAlvo.textContent = sobre.introducao;
  }

  const valoresAlvo = document.getElementById("sobre-valores");
  const valores = sobre.valores ?? [];
  if (valoresAlvo) {
    if (valores.length) {
      valoresAlvo.innerHTML = valores
        .map(
          (v) => `
        <article class="valor-cartao">
          <h3>${esc(v.titulo)}</h3>
          <p>${esc(v.texto)}</p>
        </article>`
        )
        .join("");
    } else {
      document.getElementById("seccao-valores")?.remove();
    }
  }

  const notaAlvo = document.getElementById("sobre-nota");
  if (notaAlvo) {
    if (sobre.nota) {
      notaAlvo.textContent = sobre.nota;
    } else {
      notaAlvo.remove();
    }
  }

  const faqAlvo = document.getElementById("sobre-faq");
  const seccaoFaq = document.getElementById("seccao-faq");
  const faq = SITE.faq ?? [];
  if (faqAlvo && seccaoFaq) {
    if (faq.length) {
      faqAlvo.innerHTML = faq
        .map(
          (item) => `
        <details class="faq-item">
          <summary>${esc(item.pergunta)}</summary>
          <p>${esc(item.resposta)}</p>
        </details>`
        )
        .join("");
      seccaoFaq.hidden = false;
    } else {
      seccaoFaq.remove();
    }
  }
}

preencherSobre();
