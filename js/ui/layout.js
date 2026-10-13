import { SITE } from "../site-config.js";
import { esc } from "./format.js";

const SIMBOLO = `
  <svg class="marca__simbolo" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M2.5 19v-3.2c0-.9.6-1.6 1.5-1.8l5.2-1.2 3.3-4.3h6.2l3.3 3.6 3.2.8c.9.2 1.3.9 1.3 1.7V19h-2.3M6.5 19h11"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="19.5" r="2.7" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="21" cy="19.5" r="2.7" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;

const LIGACOES = [
  { id: "inicio", texto: "Início", href: "index.html" },
  { id: "viaturas", texto: "Viaturas", href: "catalogo.html" },
  { id: "servicos", texto: "Serviços", href: "servicos.html" },
  { id: "retoma", texto: "Retoma", href: "retoma.html" },
  { id: "sobre", texto: "Sobre nós", href: "sobre.html" },
  { id: "contactos", texto: "Contactos", href: "contactos.html" },
];

/** Lista de contactos preenchidos em site-config.js. Devolve "" se não houver nenhum. */
export function htmlContactos() {
  const c = SITE.contactos;
  const itens = [];
  if (c.telefone) {
    const href = c.telefone.replace(/[^\d+]/g, "");
    itens.push(`<li><span class="contactos-lista__titulo">Telefone</span><a href="tel:${esc(href)}">${esc(c.telefone)}</a></li>`);
  }
  if (c.email) {
    itens.push(`<li><span class="contactos-lista__titulo">Email</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`);
  }
  if (c.morada) {
    itens.push(`<li><span class="contactos-lista__titulo">Morada</span><span>${esc(c.morada)}</span></li>`);
  }
  if (c.horario) {
    itens.push(`<li><span class="contactos-lista__titulo">Horário</span><span>${esc(c.horario)}</span></li>`);
  }
  return itens.length ? `<ul class="contactos-lista">${itens.join("")}</ul>` : "";
}

/** Monta o cabeçalho e o rodapé. "ativa" é o id da ligação da página atual. */
export function montarLayout(ativa) {
  const nome = esc(SITE.nome);
  const cabecalhoEl = document.getElementById("cabecalho");
  const rodapeEl = document.getElementById("rodape");

  if (cabecalhoEl) {
    cabecalhoEl.innerHTML = `
      <div class="contentor cabecalho__linha">
        <a class="marca" href="index.html" aria-label="${nome}, página inicial">
          ${SIMBOLO}<span>${nome}</span>
        </a>
        <nav aria-label="Principal">
          <ul class="navegacao">
            ${LIGACOES.map(
              (l) => `<li><a href="${l.href}"${l.id === ativa ? ' aria-current="page"' : ""}>${l.texto}</a></li>`
            ).join("")}
          </ul>
        </nav>
        <div class="cabecalho__acoes">
          <a class="botao botao--primario botao--pequeno cabecalho__cta" href="catalogo.html">Ver Viaturas</a>
          <button class="menu-hamburguer" type="button" aria-expanded="false" aria-controls="menu-movel" aria-label="Abrir menu de navegação">
            <span class="menu-hamburguer__linha"></span>
            <span class="menu-hamburguer__linha"></span>
            <span class="menu-hamburguer__linha"></span>
          </button>
        </div>
      </div>
      <div class="menu-movel" id="menu-movel" aria-hidden="true">
        <div class="menu-movel__fundo" id="menu-movel-fundo" tabindex="-1"></div>
        <div class="menu-movel__painel">
          <div class="menu-movel__cabeca">
            <a class="marca" href="index.html">${SIMBOLO}<span>${nome}</span></a>
            <button class="menu-movel__fechar botao-icone" type="button" id="menu-movel-fechar" aria-label="Fechar menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <nav class="menu-movel__nav" aria-label="Navegação móvel">
            <ul>
              ${LIGACOES.map((l) => `<li><a href="${l.href}"${l.id === ativa ? ' aria-current="page"' : ""}>${l.texto}</a></li>`).join("")}
            </ul>
          </nav>
          <div class="menu-movel__acoes">
            <a class="botao botao--primario" href="catalogo.html">Consultar Viaturas</a>
            <a class="botao botao--contorno" href="retoma.html">Avaliar Retoma</a>
          </div>
        </div>
      </div>`;

    // Interatividade do cabeçalho
    const btnHamburguer = cabecalhoEl.querySelector(".menu-hamburguer");
    const menuMovel = cabecalhoEl.querySelector("#menu-movel");
    const btnFechar = cabecalhoEl.querySelector("#menu-movel-fechar");
    const fundoMovel = cabecalhoEl.querySelector("#menu-movel-fundo");

    function abrirMenu() {
      btnHamburguer.setAttribute("aria-expanded", "true");
      menuMovel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      btnFechar?.focus();
    }

    function fecharMenu() {
      btnHamburguer.setAttribute("aria-expanded", "false");
      menuMovel.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      btnHamburguer.focus();
    }

    btnHamburguer?.addEventListener("click", () => {
      const aberto = btnHamburguer.getAttribute("aria-expanded") === "true";
      if (aberto) fecharMenu();
      else abrirMenu();
    });

    btnFechar?.addEventListener("click", fecharMenu);
    fundoMovel?.addEventListener("click", fecharMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btnHamburguer.getAttribute("aria-expanded") === "true") {
        fecharMenu();
      }
    });

    // Efeito de scroll no cabeçalho
    function atualizarScroll() {
      if (window.scrollY > 15) cabecalhoEl.classList.add("cabecalho--scrolled");
      else cabecalhoEl.classList.remove("cabecalho--scrolled");
    }
    window.addEventListener("scroll", atualizarScroll, { passive: true });
    atualizarScroll();
  }

  if (rodapeEl) {
    const contactos = htmlContactos();
    const botaoWhatsapp = SITE.whatsapp
      ? `
      <a class="whatsapp-flutuante" href="https://wa.me/${esc(SITE.whatsapp)}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>`
      : "";

    rodapeEl.innerHTML = `
      <div class="contentor rodape__grelha">
        <div class="rodape__coluna-marca">
          <a class="marca" href="index.html">${SIMBOLO}<span>${nome}</span></a>
          <p>${esc(SITE.apresentacao)}</p>
          <div class="rodape__selo">
            <span class="rodape__selo-ponto"></span>
            <span>Viaturas de gama média-alta selecionadas com garantia</span>
          </div>
        </div>
        <div>
          <h2>Navegação</h2>
          <ul>
            ${LIGACOES.map((l) => `<li><a href="${l.href}">${l.texto}</a></li>`).join("")}
            <li><a href="privacidade.html">Política de privacidade</a></li>
          </ul>
        </div>
        <div>
          <h2>Contactos</h2>
          ${contactos || `
            <ul class="contactos-lista">
              <li><span class="contactos-lista__titulo">Morada</span><span>${esc(SITE.contactos.morada)}</span></li>
              <li><span class="contactos-lista__titulo">Telefone</span><a href="tel:+351918894947">918 894 947</a></li>
              <li><span class="contactos-lista__titulo">Email</span><a href="mailto:geral@superautosport.pt">geral@superautosport.pt</a></li>
            </ul>
          `}
        </div>
      </div>
      <div class="rodape__fim">
        <div class="contentor rodape__fim-linha">
          <span>© ${new Date().getFullYear()} ${nome}. Todos os direitos reservados.</span>
          <a href="admin.html">Área reservada</a>
        </div>
      </div>
      ${botaoWhatsapp}`;
  }
}
