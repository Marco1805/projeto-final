import { montarLayout } from "../ui/layout.js";
import { esc, COMBUSTIVEIS, CAIXAS, MARCAS_POPULARES } from "../ui/format.js";
import { htmlCartao } from "../ui/cartao-viatura.js";
import { htmlEsqueletos, htmlMensagem, mensagemDeErro } from "../ui/estados.js";
import { filtrosParaParametros, lerFiltros, ORDENACOES, SEGMENTOS } from "../services/filtros.js";
import { listarMarcas, listarViaturas, TAMANHO_PAGINA } from "../services/viaturas.js";

montarLayout("viaturas");

const formulario = document.getElementById("filtros");
const seccaoFiltros = document.getElementById("seccao-filtros");
const resultados = document.getElementById("resultados");
const contagem = document.getElementById("contagem");
const botaoMais = document.getElementById("mostrar-mais");

let filtros = lerFiltros(window.location.search);
let pagina = 0;
let pedidoAtual = 0; // evita que uma resposta antiga substitua uma mais recente

function preencherOpcoes() {
  const vistos = new Set();
  const segmentosLista = Object.entries(SEGMENTOS).filter(([_, texto]) => {
    if (vistos.has(texto)) return false;
    vistos.add(texto);
    return true;
  });
  formulario.elements.segmento.insertAdjacentHTML(
    'beforeend',
    segmentosLista
      .map(([valor, texto]) => `<option value="${esc(valor)}">${esc(texto)}</option>`)
      .join('')
  );
  formulario.elements.combustivel.insertAdjacentHTML(
    "beforeend",
    Object.entries(COMBUSTIVEIS)
      .map(([valor, texto]) => `<option value="${esc(valor)}">${esc(texto)}</option>`)
      .join("")
  );
  if (formulario.elements.caixa) {
    formulario.elements.caixa.insertAdjacentHTML(
      "beforeend",
      Object.entries(CAIXAS)
        .map(([valor, texto]) => `<option value="${esc(valor)}">${esc(texto)}</option>`)
        .join("")
    );
  }
  formulario.elements.ordenar.innerHTML = Object.entries(ORDENACOES)
    .map(([valor, { rotulo }]) => `<option value="${esc(valor)}">${esc(rotulo)}</option>`)
    .join("");
}

async function preencherMarcas() {
  const select = formulario.elements.marca;
  let todas = [...MARCAS_POPULARES];
  try {
    const marcasBd = await listarMarcas();
    for (const { marca } of marcasBd) {
      if (!todas.some((m) => m.toLowerCase() === marca.toLowerCase())) {
        todas.push(marca);
      }
    }
  } catch {
    // Mantém as marcas pré-definidas
  }
  todas.sort((a, b) => a.localeCompare(b, "pt"));
  const valorAtual = select.value || filtros.marca;
  select.innerHTML = `<option value="">Todas as marcas</option>` +
    todas.map((marca) => `<option value="${esc(marca)}">${esc(marca)}</option>`).join("");
  if (valorAtual) select.value = valorAtual;
  selecionarMarca();
}

function filtrosParaFormulario() {
  const e = formulario.elements;
  e.q.value = filtros.q;
  
  // Normalização do segmento para garantir seleção correta (ex: sedan vs berlina)
  const segValor = (filtros.segmento === "berlina" || filtros.segmento === "sedan") ? "sedan" : filtros.segmento;
  if ([...e.segmento.options].some((o) => o.value === segValor)) {
    e.segmento.value = segValor;
  } else if ([...e.segmento.options].some((o) => o.value === filtros.segmento)) {
    e.segmento.value = filtros.segmento;
  } else {
    e.segmento.value = "";
  }

  e.combustivel.value = filtros.combustivel;
  if (e.caixa) e.caixa.value = filtros.caixa;
  e.preco_min.value = filtros.precoMin ?? "";
  e.preco_max.value = filtros.precoMax ?? "";
  e.ano_min.value = filtros.anoMin ?? "";
  if (e.ano_max) e.ano_max.value = filtros.anoMax ?? "";
  e.km_max.value = filtros.kmMax ?? "";
  e.iva_dedutivel.checked = filtros.ivaDedutivel;
  if (formulario.elements.estado) formulario.elements.estado.value = filtros.estado || "";
  atualizarAbasEstado(filtros.estado || "");
  selecionarMarca();

  // Se houver algum filtro ativo, garante que o painel de filtros está aberto
  if (filtros.segmento || filtros.marca || filtros.combustivel || filtros.caixa || filtros.precoMax || filtros.precoMin || filtros.q) {
    seccaoFiltros.open = true;
  }
}

const abasEstado = document.getElementById("abas-estado");
function atualizarAbasEstado(estadoAtivo) {
  if (!abasEstado) return;
  const botoes = abasEstado.querySelectorAll(".catalogo-aba-btn");
  botoes.forEach((btn) => {
    const ativo = (btn.dataset.estado || "") === (estadoAtivo || "");
    btn.classList.toggle("ativo", ativo);
    btn.setAttribute("aria-selected", String(ativo));
  });
}

abasEstado?.addEventListener("click", (e) => {
  const btn = e.target.closest(".catalogo-aba-btn");
  if (!btn) return;
  const novoEstado = btn.dataset.estado || "";
  filtros.estado = novoEstado;
  if (formulario.elements.estado) formulario.elements.estado.value = novoEstado;
  atualizarAbasEstado(novoEstado);
  const parametros = filtrosParaParametros(filtros).toString();
  window.history.pushState(null, "", parametros ? `?${parametros}` : window.location.pathname);
  carregar({ reiniciar: true });
});

function selecionarMarca() {
  const select = formulario.elements.marca;
  const igual = (o) => o.value.toLowerCase() === filtros.marca.toLowerCase();
  // A marca do URL pode ainda não estar na lista: garante que a opção existe antes de a escolher
  if (filtros.marca && ![...select.options].some(igual)) {
    select.insertAdjacentHTML("beforeend", `<option value="${esc(filtros.marca)}">${esc(filtros.marca)}</option>`);
  }
  const opcao = filtros.marca ? [...select.options].find(igual) : null;
  select.value = opcao ? opcao.value : "";
}

async function carregar({ reiniciar }) {
  const pedido = ++pedidoAtual;
  if (reiniciar) {
    pagina = 0;
    resultados.innerHTML = htmlEsqueletos(6);
    contagem.textContent = "A carregar viaturas…";
    botaoMais.hidden = true;
  } else {
    botaoMais.disabled = true;
  }

  try {
    const { viaturas, total } = await listarViaturas(filtros, pagina);
    if (pedido !== pedidoAtual) return;

    if (reiniciar) resultados.innerHTML = "";
    if (total === 0) {
      contagem.textContent = filtros.estado === "vendida" ? "Nenhuma viatura vendida" : "Nenhuma viatura encontrada";
      resultados.innerHTML = htmlMensagem({
        titulo: filtros.estado === "vendida" ? "Sem viaturas vendidas para apresentar" : "Nenhuma viatura corresponde aos filtros",
        texto: filtros.estado === "vendida" ? "As viaturas comercializadas e entregues a clientes serão exibidas aqui." : "Experimente alargar o intervalo de preço ou remover algum filtro.",
        acao: { texto: "Limpar filtros", href: "catalogo.html" },
      });
    } else {
      resultados.insertAdjacentHTML("beforeend", viaturas.map((v) => htmlCartao(v, { horizontal: true })).join(""));
      const rotuloEstado = filtros.estado === "vendida" ? "vendidas" : "disponíveis";
      contagem.textContent = total === 1 ? `1 ${filtros.estado === "vendida" ? "vendida" : "disponível"}` : `${total} ${rotuloEstado}`;
    }
    botaoMais.hidden = (pagina + 1) * TAMANHO_PAGINA >= total;
    botaoMais.disabled = false;
  } catch (erro) {
    if (pedido !== pedidoAtual) return;
    contagem.textContent = "";
    botaoMais.hidden = true;
    if (reiniciar) resultados.innerHTML = htmlMensagem(mensagemDeErro(erro));
    else {
      botaoMais.hidden = false;
      botaoMais.disabled = false;
      resultados.insertAdjacentHTML("beforeend", htmlMensagem(mensagemDeErro(erro)));
    }
  }
}

function aplicarDoFormulario() {
  filtros = lerFiltros(new URLSearchParams(new FormData(formulario)));
  const parametros = filtrosParaParametros(filtros).toString();
  window.history.pushState(null, "", parametros ? `?${parametros}` : window.location.pathname);
  atualizarAbasEstado(filtros.estado || "");
  carregar({ reiniciar: true });
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  aplicarDoFormulario();
});
formulario.elements.ordenar.addEventListener("change", aplicarDoFormulario);

botaoMais.addEventListener("click", () => {
  pagina += 1;
  carregar({ reiniciar: false });
});

window.addEventListener("popstate", () => {
  filtros = lerFiltros(window.location.search);
  filtrosParaFormulario();
  carregar({ reiniciar: true });
});

// Em ecrãs grandes os filtros estão sempre visíveis; em ecrãs pequenos ficam recolhidos
seccaoFiltros.open = window.matchMedia("(min-width: 62.01rem)").matches;

preencherOpcoes();
filtrosParaFormulario();
carregar({ reiniciar: true });
preencherMarcas().then(selecionarMarca);
