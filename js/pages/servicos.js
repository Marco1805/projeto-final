import { montarLayout, htmlContactos } from "../ui/layout.js";
import { SITE } from "../site-config.js";
import { esc } from "../ui/format.js";

montarLayout("servicos");

const ICONES = {
  financiamento: `
    <svg class="servico-cartao__icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
    </svg>`,
  garantia: `
    <svg class="servico-cartao__icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>`,
  retoma: `
    <svg class="servico-cartao__icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>`,
  aconselhamento: `
    <svg class="servico-cartao__icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="M8 9h8"/>
      <path d="M8 13h5"/>
    </svg>`,
};

const ICONE_PADRAO = `
  <svg class="servico-cartao__icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`;

function obterIcone(nome) {
  return ICONES[nome] ?? ICONE_PADRAO;
}

function htmlServico(s) {
  const cta = s.ligacao
    ? `<a class="botao botao--contorno servico-cartao__cta" href="${esc(s.ligacao)}">Saber mais</a>`
    : "";

  return `
    <article class="servico-cartao">
      <div class="servico-cartao__icone-contentor">
        ${obterIcone(s.icone)}
      </div>
      <h3 class="servico-cartao__titulo">${esc(s.titulo)}</h3>
      <p class="servico-cartao__texto">${esc(s.texto)}</p>
      ${cta}
    </article>`;
}

function renderizarServicos() {
  const grelha = document.getElementById("grelha-servicos");
  if (!grelha) return;

  const servicos = SITE.servicosDetalhados ?? [];
  if (!servicos.length) {
    grelha.innerHTML = "<p>Nenhum serviço disponível de momento.</p>";
    return;
  }

  grelha.innerHTML = servicos.map(htmlServico).join("");
}

function preencherContactos() {
  const alvo = document.getElementById("contactos-servicos");
  if (!alvo) return;
  const html = htmlContactos();
  if (html) {
    alvo.innerHTML = html;
  } else {
    alvo.remove();
  }
}

renderizarServicos();
preencherContactos();
