import { CAIXAS, COMBUSTIVEIS, ESTADOS, esc } from "../ui/format.js";
import { SEGMENTOS } from "../services/filtros.js";
import { htmlCampo, limparErros, mostrarErroGeral, mostrarErros } from "../ui/formularios.js";
import { htmlMensagem } from "../ui/estados.js";
import { confirmar } from "../ui/dialogo.js";
import { urlFotografia } from "../supabase-client.js";
import { validarViatura } from "../services/validacao.js";
import {
  definirPrincipal,
  enviarFotografia,
  guardarViatura,
  obterParaEditar,
  removerFotografia,
} from "../services/admin-viaturas.js";

const opcoes = (mapa, vazio) => [
  ...(vazio ? [{ valor: "", texto: vazio }] : []),
  ...Object.entries(mapa).map(([valor, texto]) => ({ valor, texto })),
];

function htmlFormulario(v) {
  const campo = (def) => htmlCampo({ prefixo: "v", ...def });
  return `
    <form class="form-viatura" id="form-viatura" novalidate>
      <fieldset>
        <legend>Identificação</legend>
        ${campo({ nome: "marca", rotulo: "Marca", valor: v.marca, obrigatorio: true, atributos: 'maxlength="60"' })}
        ${campo({ nome: "modelo", rotulo: "Modelo", valor: v.modelo, obrigatorio: true, atributos: 'maxlength="80"' })}
        ${campo({ nome: "versao", rotulo: "Versão", valor: v.versao, atributos: 'maxlength="120"' })}
        ${campo({ nome: "ano", rotulo: "Ano", tipo: "number", valor: v.ano, obrigatorio: true, atributos: 'min="1950" max="2100" step="1" inputmode="numeric"' })}
      </fieldset>

      <fieldset>
        <legend>Preço e estado</legend>
        ${campo({ nome: "preco", rotulo: "Preço (€)", tipo: "number", valor: v.preco, obrigatorio: true, atributos: 'min="0" step="0.01" inputmode="decimal"' })}
        ${campo({ nome: "quilometragem", rotulo: "Quilometragem (km)", tipo: "number", valor: v.quilometragem, obrigatorio: true, atributos: 'min="0" step="1" inputmode="numeric"' })}
        ${campo({ nome: "estado", rotulo: "Estado", valor: v.estado, obrigatorio: true, opcoes: opcoes(ESTADOS) })}
        <div class="campo campo--caixa">
          <input type="checkbox" id="v-destaque" name="destaque"${v.destaque ? " checked" : ""}>
          <label for="v-destaque">Mostrar em destaque na página inicial</label>
        </div>
        <div class="campo campo--caixa">
          <input type="checkbox" id="v-iva-dedutivel" name="iva_dedutivel"${v.iva_dedutivel ? " checked" : ""}>
          <label for="v-iva-dedutivel">IVA dedutível</label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Ficha técnica</legend>
        ${campo({ nome: "segmento", rotulo: "Segmento / Carroçaria", valor: v.segmento ?? "", opcoes: opcoes(SEGMENTOS, "Não indicado") })}
        ${campo({ nome: "combustivel", rotulo: "Combustível", valor: v.combustivel, obrigatorio: true, opcoes: opcoes(COMBUSTIVEIS, "Escolha o combustível") })}
        ${campo({ nome: "caixa", rotulo: "Caixa de velocidades", valor: v.caixa ?? "", opcoes: opcoes(CAIXAS, "Não indicada") })}
        ${campo({ nome: "cor", rotulo: "Cor", valor: v.cor, atributos: 'maxlength="40"' })}
        ${campo({ nome: "cilindrada_cc", rotulo: "Cilindrada (cm³)", tipo: "number", valor: v.cilindrada_cc, atributos: 'min="1" step="1" inputmode="numeric"' })}
        ${campo({ nome: "potencia_cv", rotulo: "Potência (cv)", tipo: "number", valor: v.potencia_cv, atributos: 'min="1" step="1" inputmode="numeric"' })}
        ${campo({ nome: "garantia_meses", rotulo: "Garantia contratual (meses)", tipo: "number", valor: v.garantia_meses, atributos: 'min="0" max="120" step="1" inputmode="numeric"' })}
      </fieldset>

      <fieldset>
        <legend>Descrição e equipamento</legend>
        ${campo({ nome: "descricao", rotulo: "Descrição", valor: v.descricao, linhas: 6, classe: "campo--larga", atributos: 'maxlength="5000"' })}
        ${campo({ nome: "equipamento", rotulo: "Equipamento", valor: (v.equipamento ?? []).join("\n"), linhas: 6, classe: "campo--larga", ajuda: "Um item por linha." })}
      </fieldset>

      <div class="filtros__acoes">
        <button class="botao botao--primario" type="submit">Guardar</button>
        <a class="ligacao" href="#viaturas">Voltar à lista</a>
      </div>
    </form>`;
}

function htmlFotografias(viatura) {
  if (!viatura.fotografias.length) {
    return `<p>Esta viatura ainda não tem fotografias.</p>`;
  }
  return `<ul class="fotos-admin">${viatura.fotografias
    .map(
      (f) => `
      <li class="foto-admin${f.principal ? " foto-admin--principal" : ""}" data-foto="${esc(f.id)}">
        <img src="${esc(urlFotografia(f.caminho))}" alt="" loading="lazy" width="240" height="180">
        <div class="foto-admin__acoes">
          ${f.principal ? `<span class="etiqueta">Principal</span>` : `<button class="botao botao--contorno botao--pequeno" type="button" data-acao="principal">Tornar principal</button>`}
          <button class="botao botao--perigo botao--pequeno" type="button" data-acao="remover">Remover</button>
        </div>
      </li>`
    )
    .join("")}</ul>`;
}

export async function mostrar(raiz, ctx) {
  const id = ctx.parametro;
  let viatura = null;
  if (id) {
    viatura = await obterParaEditar(id);
    if (!viatura) {
      raiz.innerHTML = htmlMensagem({
        titulo: "Viatura não encontrada",
        texto: "Esta viatura já não existe.",
        acao: { texto: "Voltar às viaturas", href: "#viaturas" },
      });
      return;
    }
  }

  const valores = viatura ?? { estado: "disponivel", quilometragem: 0, equipamento: [], destaque: false, combustivel: "" };
  const nome = viatura ? `${viatura.marca} ${viatura.modelo}` : "";

  raiz.innerHTML = `
    <h2>${viatura ? `Editar ${esc(nome)}` : "Nova viatura"}</h2>
    ${viatura && viatura.estado !== "vendida" ? `<p><a class="ligacao" href="viatura.html?id=${encodeURIComponent(id)}">Ver no site</a></p>` : ""}
    <div style="height:1.25rem"></div>
    ${htmlFormulario(valores)}
    ${
      viatura
        ? `<section class="form-viatura" style="margin-top:3rem" aria-labelledby="titulo-fotos">
            <h2 id="titulo-fotos">Fotografias</h2>
            <form class="formulario" id="form-fotos">
              <div class="campo">
                <label for="ficheiros">Adicionar fotografias</label>
                <input id="ficheiros" type="file" multiple accept="image/jpeg,image/png,image/webp" aria-describedby="ficheiros-ajuda">
                <p class="campo__ajuda" id="ficheiros-ajuda">JPEG, PNG ou WebP, até 5 MB cada. Se a viatura ainda não tiver fotografia principal, a primeira passa a ser a principal.</p>
              </div>
              <div><button class="botao botao--contorno" type="submit">Enviar fotografias</button></div>
              <p role="status" id="estado-envio"></p>
            </form>
            <div id="fotografias">${htmlFotografias(viatura)}</div>
          </section>`
        : ""
    }`;

  // ---------- Guardar os dados da viatura ----------
  const formulario = document.getElementById("form-viatura");
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);
    const { erros, dados } = validarViatura(Object.fromEntries(new FormData(formulario)));
    if (Object.keys(erros).length) return mostrarErros(formulario, erros);

    const botao = formulario.querySelector("button[type=submit]");
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = "A guardar…";
    try {
      const idGuardado = await guardarViatura(dados, id);
      if (id) {
        ctx.avisar("Alterações guardadas.");
        botao.disabled = false;
        botao.textContent = textoOriginal;
      } else {
        ctx.avisar("Viatura criada. Já pode adicionar fotografias.");
        ctx.navegar(`viaturas/${idGuardado}`);
      }
    } catch (erro) {
      console.error(erro);
      botao.disabled = false;
      botao.textContent = textoOriginal;
      mostrarErroGeral(formulario, "Não foi possível guardar a viatura. Verifique os dados e tente novamente.");
    }
  });

  if (!viatura) return;

  // ---------- Fotografias ----------
  const formFotos = document.getElementById("form-fotos");
  const estadoEnvio = document.getElementById("estado-envio");
  const zonaFotos = document.getElementById("fotografias");

  async function recarregarFotografias() {
    viatura = await obterParaEditar(id);
    zonaFotos.innerHTML = htmlFotografias(viatura);
  }

  formFotos.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const entrada = document.getElementById("ficheiros");
    const ficheiros = [...entrada.files];
    if (!ficheiros.length) {
      estadoEnvio.textContent = "Escolha pelo menos uma imagem.";
      return;
    }

    const botao = formFotos.querySelector("button[type=submit]");
    botao.disabled = true;
    let ordem = Math.max(-1, ...viatura.fotografias.map((f) => f.ordem)) + 1;
    let temPrincipal = viatura.fotografias.some((f) => f.principal);
    const falhas = [];

    for (const [i, ficheiro] of ficheiros.entries()) {
      estadoEnvio.textContent = `A enviar ${i + 1} de ${ficheiros.length}…`;
      try {
        await enviarFotografia(id, ficheiro, { ordem, principal: !temPrincipal });
        temPrincipal = true;
        ordem += 1;
      } catch (erro) {
        console.error(erro);
        falhas.push(erro.message);
      }
    }

    try {
      await recarregarFotografias();
    } catch (erro) {
      console.error(erro);
    }
    botao.disabled = false;
    entrada.value = "";
    const enviadas = ficheiros.length - falhas.length;
    estadoEnvio.textContent = falhas.length
      ? `${enviadas} enviada(s). Falhou: ${falhas.join(" ")}`
      : `${enviadas} fotografia(s) enviada(s).`;
    if (falhas.length) ctx.avisar("Algumas fotografias não foram enviadas.", "erro");
  });

  zonaFotos.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("[data-acao]");
    if (!botao) return;
    const fotografia = viatura.fotografias.find((f) => f.id === botao.closest("[data-foto]").dataset.foto);
    if (!fotografia) return;

    try {
      if (botao.dataset.acao === "principal") {
        await definirPrincipal(id, fotografia.id);
        ctx.avisar("Fotografia principal atualizada.");
      } else {
        const confirmado = await confirmar({
          titulo: "Remover fotografia?",
          texto: "A imagem vai ser eliminada. Esta ação não pode ser desfeita.",
          textoConfirmar: "Remover",
        });
        if (!confirmado) return;
        const restantes = viatura.fotografias.filter((f) => f.id !== fotografia.id);
        await removerFotografia(id, fotografia, restantes);
        ctx.avisar("Fotografia removida.");
      }
      await recarregarFotografias();
    } catch (erro) {
      console.error(erro);
      ctx.avisar("Não foi possível concluir a operação.", "erro");
    }
  });
}
