import { COMBUSTIVEIS, esc, formatarDataHora, formatarKm, rotulo } from "../ui/format.js";
import { confirmar } from "../ui/dialogo.js";
import {
  ESTADOS_RETOMA,
  atualizarEstadoRetoma,
  eliminarPedidoRetoma,
  listarPedidosRetoma,
  obterFotografiasRetoma,
  urlFotografiaRetoma,
} from "../services/retoma-admin.js";

function htmlViaturaInteresse(pedido) {
  const v = pedido.viaturas;
  if (!v) return `<span class="tabela__secundario">Nenhuma</span>`;
  return `<a href="#viaturas/${encodeURIComponent(v.id)}">${esc(v.marca)} ${esc(v.modelo)}</a><span class="tabela__secundario">${esc(v.ano)}</span>`;
}

function htmlLinha(pedido) {
  const totalFotos = pedido.retoma_fotografias?.[0]?.count ?? 0;
  const nomeViatura = `${pedido.marca_viatura ?? ""} ${pedido.modelo_viatura ?? ""}`.trim() || "Viatura";

  const detalhesViatura = [
    pedido.ano_viatura ? esc(pedido.ano_viatura) : "",
    pedido.quilometragem_viatura != null && pedido.quilometragem_viatura !== ""
      ? esc(formatarKm(pedido.quilometragem_viatura))
      : "",
    pedido.combustivel_viatura ? esc(rotulo(COMBUSTIVEIS, pedido.combustivel_viatura)) : "",
  ].filter(Boolean).join(" · ");

  return `
    <tr data-id="${esc(pedido.id)}">
      <td class="num">${esc(formatarDataHora(pedido.criado_em))}</td>
      <td>
        <strong>${esc(pedido.nome)}</strong>
        <a class="tabela__secundario" href="mailto:${esc(pedido.email)}">${esc(pedido.email)}</a>
        ${pedido.telefone ? `<a class="tabela__secundario" href="tel:${esc(pedido.telefone.replace(/[^\d+]/g, ""))}">${esc(pedido.telefone)}</a>` : ""}
      </td>
      <td>
        <strong>${esc(nomeViatura)}</strong>
        ${detalhesViatura ? `<span class="tabela__secundario">${detalhesViatura}</span>` : ""}
      </td>
      <td>
        ${pedido.descricao ? `<div class="tabela__mensagem">${esc(pedido.descricao)}</div>` : `<span class="tabela__secundario">Sem descrição</span>`}
      </td>
      <td>${htmlViaturaInteresse(pedido)}</td>
      <td class="num">
        ${totalFotos > 0
          ? `<span>${totalFotos}</span><br><button class="ligacao" type="button" data-acao="ver-fotos" data-nome="${esc(nomeViatura)}">Ver fotos</button>`
          : `<span class="tabela__secundario">0</span>`}
      </td>
      <td>
        <label class="so-leitores" for="est-${esc(pedido.id)}">Estado do pedido de retoma de ${esc(pedido.nome)}</label>
        <select id="est-${esc(pedido.id)}" data-acao="estado">
          ${Object.entries(ESTADOS_RETOMA).map(([v, t]) => `<option value="${v}"${v === pedido.estado ? " selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td>
        <button class="botao botao--perigo botao--pequeno" type="button" data-acao="eliminar" data-nome="${esc(pedido.nome)}">Eliminar</button>
      </td>
    </tr>`;
}

async function abrirModalFotos(pedidoId, nomeViatura, avisar) {
  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo";
  dialogo.setAttribute("aria-labelledby", "dialogo-fotos-titulo");
  dialogo.style.width = "min(52rem, calc(100vw - 2rem))";
  dialogo.innerHTML = `
    <div class="dialogo__corpo">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 id="dialogo-fotos-titulo">Fotografias: ${esc(nomeViatura)}</h2>
        <button class="botao botao--contorno botao--pequeno" type="button" data-acao="fechar">Fechar</button>
      </div>
      <div id="dialogo-fotos-conteudo" style="min-height: 8rem; display:flex; align-items:center; justify-content:center;">
        <p role="status">A carregar fotografias…</p>
      </div>
    </div>`;

  dialogo.querySelector('[data-acao="fechar"]').addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("close", () => dialogo.remove());
  document.body.append(dialogo);
  dialogo.showModal();

  try {
    const fotos = await obterFotografiasRetoma(pedidoId);
    const conteudo = dialogo.querySelector("#dialogo-fotos-conteudo");
    if (!fotos.length) {
      conteudo.style.display = "block";
      conteudo.innerHTML = `<p>Não foram encontradas fotografias para este pedido.</p>`;
      return;
    }
    conteudo.style.display = "block";
    conteudo.innerHTML = `
      <ul class="fotos-admin" style="margin-top:0;">
        ${fotos.map((f) => `
          <li class="foto-admin">
            <a href="${esc(urlFotografiaRetoma(f.caminho))}" target="_blank" rel="noopener" title="Abrir imagem original">
              <img src="${esc(urlFotografiaRetoma(f.caminho))}" alt="Fotografia de ${esc(nomeViatura)}" loading="lazy">
            </a>
          </li>
        `).join("")}
      </ul>`;
  } catch (erro) {
    console.error(erro);
    avisar?.("Não foi possível carregar as fotografias.", "erro");
    dialogo.close();
  }
}

export async function mostrar(raiz, ctx) {
  raiz.innerHTML = `
    <h2 class="so-leitores">Pedidos de retoma</h2>
    <form class="barra-ferramentas" id="filtro-retomas">
      <div class="campo">
        <label for="p-estado">Estado</label>
        <select id="p-estado" name="estado">
          <option value="">Todos</option>
          ${Object.entries(ESTADOS_RETOMA).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}
        </select>
      </div>
    </form>
    <div id="lista-retomas" aria-live="polite"></div>`;

  const lista = document.getElementById("lista-retomas");
  const filtro = document.getElementById("p-estado");

  async function carregar() {
    lista.innerHTML = `<p role="status">A carregar pedidos de retoma…</p>`;
    try {
      const pedidos = await listarPedidosRetoma({ estado: filtro.value });
      lista.innerHTML = pedidos.length
        ? `<div class="tabela-envolvente"><table class="tabela">
            <caption class="so-leitores">Pedidos de retoma</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Cliente</th>
                <th scope="col">Viatura do cliente</th>
                <th scope="col">Descrição</th>
                <th scope="col">Viatura de interesse</th>
                <th scope="col">Fotografias</th>
                <th scope="col">Estado</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>${pedidos.map(htmlLinha).join("")}</tbody>
          </table></div>`
        : `<p>Não há pedidos de retoma${filtro.value ? " com este estado" : " por agora"}.</p>`;
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = `<p role="alert">Não foi possível carregar os pedidos de retoma.</p>`;
    }
  }

  filtro.addEventListener("change", carregar);

  lista.addEventListener("change", async (evento) => {
    const controlo = evento.target;
    if (controlo.dataset.acao !== "estado") return;
    const id = controlo.closest("tr").dataset.id;
    controlo.disabled = true;
    try {
      await atualizarEstadoRetoma(id, controlo.value);
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
    const botaoFotos = evento.target.closest('[data-acao="ver-fotos"]');
    if (botaoFotos) {
      const tr = botaoFotos.closest("tr");
      abrirModalFotos(tr.dataset.id, botaoFotos.dataset.nome, ctx.avisar);
      return;
    }

    const botaoEliminar = evento.target.closest('[data-acao="eliminar"]');
    if (!botaoEliminar) return;
    const confirmado = await confirmar({
      titulo: "Eliminar pedido de retoma?",
      texto: `O pedido de retoma de ${botaoEliminar.dataset.nome} vai ser eliminado. Esta ação não pode ser desfeita.`,
      textoConfirmar: "Eliminar",
    });
    if (!confirmado) return;
    try {
      await eliminarPedidoRetoma(botaoEliminar.closest("tr").dataset.id);
      ctx.avisar("Pedido de retoma eliminado.");
      ctx.atualizarContadores();
      await carregar();
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível eliminar o pedido.", "erro");
    }
  });

  await carregar();
}
