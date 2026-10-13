import { ESTADOS, esc, formatarPreco } from "../ui/format.js";
import { confirmar } from "../ui/dialogo.js";
import { limparTextoPesquisa } from "../services/filtros.js";
import { atualizarCampos, eliminarViatura, listarTodas } from "../services/admin-viaturas.js";

function opcoesEstado(atual) {
  return Object.entries(ESTADOS)
    .map(([valor, texto]) => `<option value="${valor}"${valor === atual ? " selected" : ""}>${texto}</option>`)
    .join("");
}

function htmlLinha(v) {
  const nome = `${v.marca} ${v.modelo}`;
  const fotos = v.viatura_fotografias?.[0]?.count ?? 0;
  return `
    <tr data-id="${esc(v.id)}">
      <td>
        <strong>${esc(nome)}</strong>
        ${v.versao ? `<span class="tabela__secundario">${esc(v.versao)}</span>` : ""}
        ${v.dados_demonstracao ? `<span class="etiqueta">Demonstração</span>` : ""}
      </td>
      <td class="num">${esc(v.ano)}</td>
      <td class="num">${esc(formatarPreco(v.preco))}</td>
      <td class="num">${fotos}</td>
      <td>
        <label class="so-leitores" for="estado-${esc(v.id)}">Estado de ${esc(nome)}</label>
        <select id="estado-${esc(v.id)}" data-acao="estado">${opcoesEstado(v.estado)}</select>
      </td>
      <td>
        <input type="checkbox" data-acao="destaque" aria-label="Destaque: ${esc(nome)}"${v.destaque ? " checked" : ""}>
      </td>
      <td>
        <div class="tabela__acoes">
          <a class="botao botao--contorno botao--pequeno" href="#viaturas/${encodeURIComponent(v.id)}">Editar</a>
          <button class="botao botao--perigo botao--pequeno" type="button" data-acao="eliminar" data-nome="${esc(nome)}">Eliminar</button>
        </div>
      </td>
    </tr>`;
}

export async function mostrar(raiz, ctx) {
  raiz.innerHTML = `
    <h2 class="so-leitores">Viaturas</h2>
    <form class="barra-ferramentas" id="pesquisa-admin" role="search">
      <div class="campo">
        <label for="a-q">Pesquisar</label>
        <input id="a-q" name="q" type="search" maxlength="60" placeholder="Marca ou modelo">
      </div>
      <div class="campo">
        <label for="a-estado">Estado</label>
        <select id="a-estado" name="estado">
          <option value="">Todos</option>
          ${Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}
        </select>
      </div>
      <button class="botao botao--contorno" type="submit">Filtrar</button>
      <span class="barra-ferramentas__espaco"></span>
      <a class="botao botao--primario" href="#viaturas/nova">Nova viatura</a>
    </form>
    <div id="lista-viaturas" aria-live="polite"></div>`;

  const lista = document.getElementById("lista-viaturas");
  const formulario = document.getElementById("pesquisa-admin");

  async function carregar() {
    const q = limparTextoPesquisa(formulario.elements.q.value);
    const estado = formulario.elements.estado.value;
    lista.innerHTML = `<p role="status">A carregar viaturas…</p>`;
    try {
      const viaturas = await listarTodas({ q, estado });
      lista.innerHTML = viaturas.length
        ? `<div class="tabela-envolvente"><table class="tabela">
            <caption class="so-leitores">Viaturas registadas</caption>
            <thead><tr><th scope="col">Viatura</th><th scope="col">Ano</th><th scope="col">Preço</th><th scope="col">Fotos</th><th scope="col">Estado</th><th scope="col">Destaque</th><th scope="col">Ações</th></tr></thead>
            <tbody>${viaturas.map(htmlLinha).join("")}</tbody>
          </table></div>`
        : `<p>Nenhuma viatura encontrada. <a href="#viaturas/nova">Adicionar uma viatura</a></p>`;
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = `<p role="alert">Não foi possível carregar as viaturas.</p>`;
    }
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    carregar();
  });

  lista.addEventListener("change", async (evento) => {
    const controlo = evento.target;
    const acao = controlo.dataset.acao;
    if (acao !== "estado" && acao !== "destaque") return;
    const id = controlo.closest("tr").dataset.id;
    const campos = acao === "estado" ? { estado: controlo.value } : { destaque: controlo.checked };
    controlo.disabled = true;
    try {
      await atualizarCampos(id, campos);
      ctx.avisar("Viatura atualizada.");
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível atualizar a viatura.", "erro");
      await carregar(); // volta a mostrar o valor real guardado
      return;
    }
    controlo.disabled = false;
  });

  lista.addEventListener("click", async (evento) => {
    const botao = evento.target.closest('[data-acao="eliminar"]');
    if (!botao) return;
    const id = botao.closest("tr").dataset.id;
    const confirmado = await confirmar({
      titulo: "Eliminar viatura?",
      texto: `${botao.dataset.nome} e todas as suas fotografias vão ser eliminadas. Esta ação não pode ser desfeita.`,
      textoConfirmar: "Eliminar",
    });
    if (!confirmado) return;
    try {
      await eliminarViatura(id);
      ctx.avisar("Viatura eliminada.");
      await carregar();
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível eliminar a viatura.", "erro");
    }
  });

  await carregar();
}
