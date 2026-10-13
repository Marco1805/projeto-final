import { SITE } from "../site-config.js";
import { montarLayout } from "../ui/layout.js";
import { esc } from "../ui/format.js";

montarLayout("");

const contentor = document.getElementById("area-faq");
const faqItens = Array.isArray(SITE.faq) ? SITE.faq : [];

if (contentor) {
  contentor.innerHTML = `
    <h1>Perguntas Frequentes</h1>
    <p>Consulte as respostas às questões mais comuns sobre as nossas viaturas, garantias, test drives e condições de aquisição.</p>

    <div class="faq-lista" role="region" aria-label="Lista de perguntas frequentes">
      ${faqItens
        .map(
          (item) => `
        <details>
          <summary>${esc(item.pergunta || item.q || "")}</summary>
          <p>${esc(item.resposta || item.a || "")}</p>
        </details>`
        )
        .join("")}
    </div>
  `;
}
