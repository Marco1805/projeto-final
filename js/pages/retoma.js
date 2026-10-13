import { montarLayout, htmlContactos } from "../ui/layout.js";
import { esc, COMBUSTIVEIS } from "../ui/format.js";
import { htmlCampo, htmlArmadilha, limparErros, mostrarErroGeral, mostrarErros } from "../ui/formularios.js";
import { listarOpcoesViaturas } from "../services/viaturas.js";
import { criarPedidoRetoma, enviarFotografiaRetoma, validarImagemRetoma } from "../services/retoma.js";
import { validarPedidoRetoma } from "../services/validacao.js";

montarLayout("retoma");

const parametros = new URLSearchParams(window.location.search);
const viaturaPedida = parametros.get("viatura") ?? "";

const painelRetoma = document.getElementById("painel-retoma");

function opcoesViatura(viaturas, vazio) {
  return [
    { valor: "", texto: vazio },
    ...viaturas.map((v) => ({
      valor: v.id,
      texto: `${v.marca} ${v.modelo}${v.versao ? ` ${v.versao}` : ""} (${v.ano})`,
    })),
  ];
}

function htmlFormularioRetoma(viaturas) {
  const opcoesCombustivel = [
    { valor: "", texto: "Escolha o combustível" },
    ...Object.entries(COMBUSTIVEIS).map(([valor, texto]) => ({ valor, texto })),
  ];

  return `
    <form class="formulario" id="form-retoma" novalidate>
      ${htmlCampo({ prefixo: "r", nome: "nome", rotulo: "O seu nome", obrigatorio: true, atributos: 'maxlength="120" autocomplete="name"' })}
      ${htmlCampo({ prefixo: "r", nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, atributos: 'maxlength="254" autocomplete="email"' })}
      ${htmlCampo({ prefixo: "r", nome: "telefone", rotulo: "Telefone", tipo: "tel", obrigatorio: true, atributos: 'maxlength="30" autocomplete="tel"' })}

      <div class="campo-duplo">
        ${htmlCampo({ prefixo: "r", nome: "marca_viatura", rotulo: "Marca da sua viatura", obrigatorio: true, atributos: 'maxlength="60"' })}
        ${htmlCampo({ prefixo: "r", nome: "modelo_viatura", rotulo: "Modelo da sua viatura", obrigatorio: true, atributos: 'maxlength="80"' })}
      </div>

      <div class="campo-duplo">
        ${htmlCampo({ prefixo: "r", nome: "ano_viatura", rotulo: "Ano da viatura", tipo: "number", obrigatorio: true, atributos: 'min="1950" max="2100" step="1" inputmode="numeric"' })}
        ${htmlCampo({ prefixo: "r", nome: "quilometragem_viatura", rotulo: "Quilometragem (km)", tipo: "number", obrigatorio: true, atributos: 'min="0" step="1" inputmode="numeric"' })}
      </div>

      ${htmlCampo({ prefixo: "r", nome: "combustivel_viatura", rotulo: "Combustível", obrigatorio: true, opcoes: opcoesCombustivel })}

      ${htmlCampo({ prefixo: "r", nome: "viatura_interesse_id", rotulo: "Viatura de interesse em stock", valor: viaturaPedida, opcoes: opcoesViatura(viaturas, "Sem viatura de interesse (apenas venda)") })}

      ${htmlCampo({ prefixo: "r", nome: "descricao", rotulo: "Estado geral e informações adicionais", linhas: 4, atributos: 'maxlength="2000"', ajuda: "Indique o histórico de revisões, estado de pintura/pneus, eventuais danos ou extras relevantes." })}

      <div class="campo">
        <label for="r-fotografias">Fotografias da viatura (opcional)</label>
        <input type="file" id="r-fotografias" name="fotografias" multiple accept="image/jpeg,image/png,image/webp" aria-describedby="r-fotografias-ajuda r-fotografias-erro">
        <p class="campo__ajuda" id="r-fotografias-ajuda">Pode selecionar até 5 fotografias (formatos JPEG, PNG ou WebP, máximo 5 MB cada).</p>
        <p class="campo__erro" id="r-fotografias-erro" hidden></p>
        <div id="r-fotografias-lista" class="campo__ajuda" style="margin-top:0.25rem"></div>
      </div>

      <p class="campo__ajuda">
        <strong>Nota:</strong> O envio deste pedido destina-se unicamente a uma estimativa preliminar e não constitui uma proposta vinculativa nem uma oferta garantida. O valor final carece de inspeção presencial no stand.
      </p>

      ${htmlArmadilha("r")}
      <button class="botao botao--primario" type="submit">Pedir avaliação</button>
    </form>`;
}

function ligarFormularioRetoma(painel, formulario) {
  const inputFotos = formulario.querySelector("#r-fotografias");
  const listaFotos = formulario.querySelector("#r-fotografias-lista");

  inputFotos.addEventListener("change", () => {
    const ficheiros = [...inputFotos.files];
    if (!ficheiros.length) {
      listaFotos.textContent = "";
      return;
    }
    if (ficheiros.length > 5) {
      listaFotos.textContent = `${ficheiros.length} fotografias selecionadas (o limite é de 5 fotografias).`;
      return;
    }
    const tamanhoTotalMb = (ficheiros.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1);
    listaFotos.textContent = `${ficheiros.length} fotografia(s) selecionada(s) (${tamanhoTotalMb} MB no total).`;
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);

    const dadosFormulario = Object.fromEntries(new FormData(formulario));
    const { erros, dados } = validarPedidoRetoma(dadosFormulario);

    const ficheiros = inputFotos?.files ? [...inputFotos.files] : [];

    if (ficheiros.length > 5) {
      erros.fotografias = "Pode enviar no máximo 5 fotografias.";
    } else {
      for (const f of ficheiros) {
        const erroFoto = validarImagemRetoma(f);
        if (erroFoto) {
          erros.fotografias = erroFoto;
          break;
        }
      }
    }

    if (Object.keys(erros).length) {
      return mostrarErros(formulario, erros);
    }

    const botao = formulario.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "A enviar…";

    try {
      // Campo-armadilha preenchido: é um robô. Finge sucesso sem enviar nada.
      if (!formulario.elements.website.value) {
        const pedidoId = await criarPedidoRetoma(dados);

        if (ficheiros.length > 0) {
          for (let i = 0; i < ficheiros.length; i++) {
            botao.textContent = `A enviar fotografia ${i + 1} de ${ficheiros.length}…`;
            await enviarFotografiaRetoma(pedidoId, ficheiros[i]);
          }
        }
      }

      painel.innerHTML = `
        <div class="formulario__confirmacao" role="status">
          <h3>Pedido de avaliação recebido</h3>
          <p>Obrigado pelo seu pedido. A equipa do stand irá analisar as informações da sua viatura e entrará em contacto consigo brevemente com uma estimativa.</p>
          <p><small>Lembramos que esta estimativa não constitui uma proposta vinculativa nem uma oferta garantida. O valor final definitivo será apurado após verificação presencial da viatura no stand.</small></p>
          <div style="display:flex;gap:0.75rem;margin-top:0.5rem;flex-wrap:wrap">
            <a class="botao botao--contorno" href="catalogo.html">Ver viaturas em stock</a>
            <a class="botao botao--contorno" href="index.html">Página inicial</a>
          </div>
        </div>`;
      painel.querySelector("h3").scrollIntoView({ block: "nearest" });
    } catch (erro) {
      console.error("Erro ao submeter pedido de retoma:", erro);
      botao.disabled = false;
      botao.textContent = "Pedir avaliação";
      const detalhe = erro?.message || erro?.details || "";
      mostrarErroGeral(
        formulario,
        erro?.name === "SupabaseNaoConfigurado"
          ? "O envio de pedidos ainda não está configurado."
          : detalhe
          ? `Não foi possível enviar o pedido de avaliação (${detalhe}). Verifique os dados e tente novamente.`
          : "Não foi possível enviar o pedido de avaliação. Verifique a ligação e tente novamente."
      );
    }
  });
}

async function iniciar() {
  const contactos = htmlContactos();
  const alvo = document.getElementById("contactos-stand");
  if (contactos) alvo.innerHTML = contactos;
  else alvo.remove();

  let viaturas = [];
  try {
    viaturas = await listarOpcoesViaturas();
  } catch (erro) {
    if (erro?.name !== "SupabaseNaoConfigurado") console.error(erro);
  }

  painelRetoma.innerHTML = htmlFormularioRetoma(viaturas);
  ligarFormularioRetoma(painelRetoma, document.getElementById("form-retoma"));
}

iniciar();
