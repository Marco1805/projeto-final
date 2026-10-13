import { SITE } from "../site-config.js";
import { montarLayout, htmlContactos } from "../ui/layout.js";
import { esc, MARCAS_POPULARES } from "../ui/format.js";
import { htmlCartao } from "../ui/cartao-viatura.js";
import { htmlEsqueletos, htmlMensagem, mensagemDeErro } from "../ui/estados.js";
import { contarViaturas, listarDestaques, listarMarcas } from "../services/viaturas.js";

montarLayout("inicio");

function preencherHero() {
  document.getElementById("hero-apresentacao").textContent = SITE.apresentacao;
  if (SITE.heroImagem) {
    const hero = document.getElementById("hero");
    hero.style.setProperty("--hero-imagem", `url(${JSON.stringify(SITE.heroImagem)})`);
    hero.classList.add("hero--imagem");
  }
}

async function preencherMarcasHero() {
  const selectMarca = document.getElementById("pr-marca");
  if (!selectMarca) return;
  let todasMarcas = [...MARCAS_POPULARES];
  try {
    const marcasBd = await listarMarcas();
    for (const { marca } of marcasBd) {
      if (!todasMarcas.some((m) => m.toLowerCase() === marca.toLowerCase())) {
        todasMarcas.push(marca);
      }
    }
  } catch {
    // Mantém as marcas populares pré-definidas
  }
  todasMarcas.sort((a, b) => a.localeCompare(b, "pt"));
  selectMarca.innerHTML = `<option value="">Todas as marcas</option>` +
    todasMarcas.map((marca) => `<option value="${esc(marca)}">${esc(marca)}</option>`).join("");
}

function preencherServicos() {
  const seccao = document.getElementById("seccao-servicos");
  if (!SITE.servicos.length) return seccao?.remove();
  const servicosEl = document.getElementById("servicos");
  if (servicosEl) {
    servicosEl.innerHTML = SITE.servicos
      .map((s) => `<div><dt>${esc(s.titulo)}</dt><dd>${esc(s.texto)}</dd></div>`)
      .join("");
  }
}

function preencherContactos() {
  const html = htmlContactos();
  const seccao = document.getElementById("seccao-contactos");
  if (!html) return seccao?.remove();
  const el = document.getElementById("contactos");
  if (el) el.innerHTML = html;
}

function configurarCarrosselDestaques(pista, totalViaturas) {
  const moldura = pista.closest(".carrossel-destaques-moldura");
  const btnAnt = document.getElementById("destaques-ant");
  const btnProx = document.getElementById("destaques-prox");
  const btnSetaAnt = document.getElementById("btn-seta-ant");
  const btnSetaProx = document.getElementById("btn-seta-prox");
  const pontosContainer = document.getElementById("destaques-pontos");

  // Gerar pontos de navegação
  if (pontosContainer) {
    pontosContainer.innerHTML = Array.from(
      { length: totalViaturas },
      (_, i) =>
        `<button class="carrossel-ponto${i === 0 ? " carrossel-ponto--ativo" : ""}" type="button" aria-label="Ir para viatura ${i + 1}" data-index="${i}"></button>`
    ).join("");

    pontosContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".carrossel-ponto");
      if (!btn) return;
      const idx = Number(btn.dataset.index);
      const card = pista.children[idx];
      if (card) {
        card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      }
      reiniciarTimer();
    });
  }

  // Atualizar ponto ativo conforme scroll
  let ticking = false;
  function atualizarPontoAtivo() {
    if (!pontosContainer) return;
    const cards = Array.from(pista.children);
    if (!cards.length) return;

    const scrollLeft = pista.scrollLeft;
    let indiceMaisProximo = 0;
    let menorDistancia = Infinity;

    cards.forEach((card, idx) => {
      const dist = Math.abs(card.offsetLeft - pista.offsetLeft - scrollLeft);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        indiceMaisProximo = idx;
      }
    });

    const pontos = pontosContainer.querySelectorAll(".carrossel-ponto");
    pontos.forEach((p, idx) => {
      p.classList.toggle("carrossel-ponto--ativo", idx === indiceMaisProximo);
    });
  }

  pista.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        atualizarPontoAtivo();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  function calcularPasso() {
    const card = pista.firstElementChild;
    return card ? card.offsetWidth + 24 : 320;
  }

  function avancar() {
    const passo = calcularPasso();
    const maxScroll = pista.scrollWidth - pista.clientWidth;
    if (pista.scrollLeft >= maxScroll - 20) {
      pista.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      pista.scrollBy({ left: passo, behavior: "smooth" });
    }
  }

  function recuar() {
    const passo = calcularPasso();
    if (pista.scrollLeft <= 20) {
      pista.scrollTo({ left: pista.scrollWidth, behavior: "smooth" });
    } else {
      pista.scrollBy({ left: -passo, behavior: "smooth" });
    }
  }

  const aoClicarProx = () => {
    avancar();
    reiniciarTimer();
  };
  const aoClicarAnt = () => {
    recuar();
    reiniciarTimer();
  };

  btnProx?.addEventListener("click", aoClicarProx);
  btnSetaProx?.addEventListener("click", aoClicarProx);
  btnAnt?.addEventListener("click", aoClicarAnt);
  btnSetaAnt?.addEventListener("click", aoClicarAnt);

  // Animação contínua e suave (passa viatura a cada 3.5 segundos)
  let timer = null;
  let emPausa = false;

  function iniciarTimer() {
    pararTimer();
    timer = setInterval(() => {
      if (!emPausa && document.visibilityState === "visible") {
        avancar();
      }
    }, 3500);
  }

  function pararTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function reiniciarTimer() {
    pararTimer();
    iniciarTimer();
  }

  // Pausa suave quando o utilizador interage ou coloca o rato por cima
  const alvosInteracao = [moldura, pista, pontosContainer].filter(Boolean);
  alvosInteracao.forEach((el) => {
    el.addEventListener("mouseenter", () => { emPausa = true; });
    el.addEventListener("mouseleave", () => { emPausa = false; });
    el.addEventListener("touchstart", () => { emPausa = true; }, { passive: true });
    el.addEventListener("touchend", () => {
      setTimeout(() => { emPausa = false; }, 2000);
    }, { passive: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pararTimer();
    else iniciarTimer();
  });

  iniciarTimer();
}

async function carregarDestaques() {
  const alvo = document.getElementById("destaques");
  if (!alvo) return;
  alvo.innerHTML = htmlEsqueletos(4);

  // Atualizar botão com a contagem total de viaturas
  const btnTodas = document.getElementById("btn-todas-viaturas");
  try {
    const totalContagem = await contarViaturas();
    if (btnTodas && totalContagem > 0) {
      const spanTexto = btnTodas.querySelector("span:first-child");
      if (spanTexto) {
        spanTexto.textContent = `Mostrar todas as ${totalContagem} viaturas`;
      }
    }
  } catch {
    // Mantém texto original caso a contagem falhe
  }

  try {
    const viaturas = await listarDestaques(12);
    if (!viaturas.length) {
      alvo.innerHTML = htmlMensagem({
        titulo: "Ainda não há viaturas publicadas",
        texto: "Volte em breve para ver as viaturas disponíveis.",
      });
      return;
    }

    alvo.innerHTML = viaturas.map((v) => htmlCartao(v)).join("");
    configurarCarrosselDestaques(alvo, viaturas.length);
  } catch (erro) {
    alvo.innerHTML = htmlMensagem(mensagemDeErro(erro));
  }
}

preencherHero();
preencherMarcasHero();
preencherServicos();
preencherContactos();
carregarDestaques();
