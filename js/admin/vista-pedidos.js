import { ESTADOS_CONTACTO, ESTADOS_TEST_DRIVE, PERIODOS, esc, formatarData, formatarDataHora, rotulo } from "../ui/format.js";
import { confirmar } from "../ui/dialogo.js";
import { atualizarEstadoPedido, eliminarPedido, listarPedidos } from "../services/pedidos.js";

const CONFIGURACAO = {
  contacto: { titulo: "Pedidos de contacto", estados: ESTADOS_CONTACTO, inicial: "novo" },
  test_drive: { titulo: "Pedidos de test drive", estados: ESTADOS_TEST_DRIVE, inicial: "pendente" },
};

function htmlViatura(pedido) {
  const v = pedido.viaturas;
  if (!v) return "Sem viatura específica";
  return `<a href="#viaturas/${encodeURIComponent(v.id)}">${esc(v.marca)} ${esc(v.modelo)}</a><span class="tabela__secundario">${esc(v.ano)}</span>`;
}

function htmlDetalhes(tipo, pedido) {
  if (tipo === "contacto") {
    return `<div class="tabela__mensagem">${esc(pedido.mensagem)}</div>`;
  }
  const preferencia = [
    pedido.data_preferida ? `Data preferida: ${formatarData(pedido.data_preferida)}` : "Sem data preferida",
    `Período: ${rotulo(PERIODOS, pedido.periodo_preferido)}`,
  ];
  return `
    <span class="tabela__secundario">${preferencia.map(esc).join(" · ")}</span>
    ${pedido.mensagem ? `<div class="tabela__mensagem">${esc(pedido.mensagem)}</div>` : ""}`;
}

function htmlLinha(tipo, pedido, estados) {
  return `
    <tr data-id="${esc(pedido.id)}">
      <td class="num">${esc(formatarDataHora(pedido.criado_em))}</td>
      <td>
        <strong>${esc(pedido.nome)}</strong>
        <a class="tabela__secundario" href="mailto:${esc(pedido.email)}">${esc(pedido.email)}</a>
        ${pedido.telefone ? `<a class="tabela__secundario" href="tel:${esc(pedido.telefone.replace(/[^\d+]/g, ""))}">${esc(pedido.telefone)}</a>` : ""}
      </td>
      <td>${htmlViatura(pedido)}</td>
      <td>${htmlDetalhes(tipo, pedido)}</td>
      <td>
        <label class="so-leitores" for="est-${esc(pedido.id)}">Estado do pedido de ${esc(pedido.nome)}</label>
        <select id="est-${esc(pedido.id)}" data-acao="estado">
          ${Object.entries(estados).map(([v, t]) => `<option value="${v}"${v === pedido.estado ? " selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td><button class="botao botao--perigo botao--pequeno" type="button" data-acao="eliminar" data-nome="${esc(pedido.nome)}">Eliminar</button></td>
    </tr>`;
}

export async function mostrar(raiz, ctx) {
  const tipo = ctx.tipo;
  const { titulo, estados } = CONFIGURACAO[tipo];

  raiz.innerHTML = `
    <h2 class="so-leitores">${esc(titulo)}</h2>
    <form class="barra-ferramentas" id="filtro-pedidos">
      <div class="campo">
        <label for="p-estado">Estado</label>
        <select id="p-estado" name="estado">
          <option value="">Todos</option>
          ${Object.entries(estados).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}
        </select>
      </div>
    </form>
    <div id="lista-pedidos" aria-live="polite"></div>`;

  const lista = document.getElementById("lista-pedidos");
  const filtro = document.getElementById("p-estado");

  async function carregar() {
    lista.innerHTML = `<p role="status">A carregar pedidos…</p>`;
    try {
      const pedidos = await listarPedidos(tipo, { estado: filtro.value });
      lista.innerHTML = pedidos.length
        ? `<div class="tabela-envolvente"><table class="tabela">
            <caption class="so-leitores">${esc(titulo)}</caption>
            <thead><tr><th scope="col">Recebido</th><th scope="col">Cliente</th><th scope="col">Viatura</th><th scope="col">Pedido</th><th scope="col">Estado</th><th scope="col">Ações</th></tr></thead>
            <tbody>${pedidos.map((p) => htmlLinha(tipo, p, estados)).join("")}</tbody>
          </table></div>`
        : `<p>Não há pedidos${filtro.value ? " com este estado" : " por agora"}.</p>`;
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = `<p role="alert">Não foi possível carregar os pedidos.</p>`;
    }
  }

  filtro.addEventListener("change", carregar);

  lista.addEventListener("change", async (evento) => {
    const controlo = evento.target;
    if (controlo.dataset.acao !== "estado") return;
    const id = controlo.closest("tr").dataset.id;
    controlo.disabled = true;
    try {
      await atualizarEstadoPedido(tipo, id, controlo.value);
      ctx.avisar("Estado atualizado.");
      ctx.atualizarContadores();
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível atualizar o estado.", "erro");
      await carregar();
      return;
    }
    controlo.disabled = false;
  });

  lista.addEventListener("click", async (evento) => {
    const botao = evento.target.closest('[data-acao="eliminar"]');
    if (!botao) return;
    const confirmado = await confirmar({
      titulo: "Eliminar pedido?",
      texto: `O pedido de ${botao.dataset.nome} vai ser eliminado. Esta ação não pode ser desfeita.`,
      textoConfirmar: "Eliminar",
    });
    if (!confirmado) return;
    try {
      await eliminarPedido(tipo, botao.closest("tr").dataset.id);
      ctx.avisar("Pedido eliminado.");
      ctx.atualizarContadores();
      await carregar();
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível eliminar o pedido.", "erro");
    }
  });

  await carregar();
}
