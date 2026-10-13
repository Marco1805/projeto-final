import { montarLayout, htmlContactos } from "../ui/layout.js";
import { esc, PERIODOS } from "../ui/format.js";
import { htmlArmadilha, htmlCampo, limparErros, mostrarErroGeral, mostrarErros } from "../ui/formularios.js";
import { listarOpcoesViaturas } from "../services/viaturas.js";
import { criarPedidoContacto, criarPedidoTestDrive } from "../services/pedidos.js";
import { validarPedidoContacto, validarPedidoTestDrive } from "../services/validacao.js";

montarLayout("contactos");

const parametros = new URLSearchParams(window.location.search);
const viaturaPedida = parametros.get("viatura") ?? "";

const painelContacto = document.getElementById("painel-contacto");
const painelTestDrive = document.getElementById("painel-test-drive");
const separadorContacto = document.getElementById("separador-contacto");
const separadorTestDrive = document.getElementById("separador-test-drive");

function opcoesViatura(viaturas, vazio) {
  return [
    { valor: "", texto: vazio },
    ...viaturas.map((v) => ({
      valor: v.id,
      texto: `${v.marca} ${v.modelo}${v.versao ? ` ${v.versao}` : ""} (${v.ano})`,
    })),
  ];
}

function htmlFormularioContacto(viaturas) {
  return `
    <form class="formulario" id="form-contacto" novalidate>
      ${htmlCampo({ prefixo: "c", nome: "nome", rotulo: "Nome", obrigatorio: true, atributos: 'maxlength="120" autocomplete="name"' })}
      ${htmlCampo({ prefixo: "c", nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, atributos: 'maxlength="254" autocomplete="email"' })}
      ${htmlCampo({ prefixo: "c", nome: "telefone", rotulo: "Telefone", tipo: "tel", atributos: 'maxlength="30" autocomplete="tel"' })}
      ${htmlCampo({ prefixo: "c", nome: "viatura_id", rotulo: "Viatura", valor: viaturaPedida, opcoes: opcoesViatura(viaturas, "Sem viatura específica") })}
      ${htmlCampo({ prefixo: "c", nome: "mensagem", rotulo: "Mensagem", obrigatorio: true, linhas: 5, atributos: 'maxlength="2000"' })}
      ${htmlArmadilha("c")}
      <button class="botao botao--primario" type="submit">Enviar pedido</button>
    </form>`;
}

function htmlFormularioTestDrive(viaturas) {
  const hoje = new Date().toISOString().slice(0, 10);
  return `
    <form class="formulario" id="form-test-drive" novalidate>
      ${htmlCampo({ prefixo: "t", nome: "viatura_id", rotulo: "Viatura que pretende experimentar", valor: viaturaPedida, obrigatorio: true, opcoes: opcoesViatura(viaturas, "Escolha uma viatura") })}
      ${htmlCampo({ prefixo: "t", nome: "nome", rotulo: "Nome", obrigatorio: true, atributos: 'maxlength="120" autocomplete="name"' })}
      ${htmlCampo({ prefixo: "t", nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, atributos: 'maxlength="254" autocomplete="email"' })}
      ${htmlCampo({ prefixo: "t", nome: "telefone", rotulo: "Telefone", tipo: "tel", obrigatorio: true, atributos: 'maxlength="30" autocomplete="tel"' })}
      ${htmlCampo({ prefixo: "t", nome: "data_preferida", rotulo: "Data preferida", tipo: "date", atributos: `min="${hoje}"`, ajuda: "É só uma preferência. O stand confirma o dia e a hora consigo." })}
      ${htmlCampo({ prefixo: "t", nome: "periodo_preferido", rotulo: "Período preferido", obrigatorio: true, valor: "indiferente", opcoes: Object.entries(PERIODOS).map(([valor, texto]) => ({ valor, texto })) })}
      ${htmlCampo({ prefixo: "t", nome: "mensagem", rotulo: "Mensagem", linhas: 3, atributos: 'maxlength="2000"' })}
      ${htmlArmadilha("t")}
      <button class="botao botao--primario" type="submit">Pedir test drive</button>
    </form>`;
}

/** Liga um formulário à validação e ao envio. */
function ligarFormulario(painel, formulario, { validar, enviar, titulo, texto }) {
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);

    const { erros, dados } = validar(Object.fromEntries(new FormData(formulario)));
    if (Object.keys(erros).length) return mostrarErros(formulario, erros);

    const botao = formulario.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "A enviar…";
    try {
      // Campo-armadilha preenchido: é um robô. Finge sucesso sem enviar nada.
      if (!formulario.elements.website.value) await enviar(dados);
      painel.innerHTML = `
        <div class="formulario__confirmacao" role="status">
          <h3>${esc(titulo)}</h3>
          <p>${esc(texto)}</p>
          <a class="botao botao--contorno" href="catalogo.html">Ver viaturas</a>
        </div>`;
      painel.querySelector("h3").scrollIntoView({ block: "nearest" });
    } catch (erro) {
      console.error("Erro ao submeter pedido em contactos:", erro);
      botao.disabled = false;
      botao.textContent = painel === painelTestDrive ? "Pedir test drive" : "Enviar pedido";
      const detalhe = erro?.message || erro?.details || "";
      mostrarErroGeral(
        formulario,
        erro?.name === "SupabaseNaoConfigurado"
          ? "O envio de pedidos ainda não está configurado."
          : detalhe
          ? `Não foi possível enviar o pedido (${detalhe}). Verifique a ligação e tente novamente.`
          : "Não foi possível enviar o pedido. Verifique a ligação e tente novamente."
      );
    }
  });
}

function selecionarSeparador(tipo) {
  const testDrive = tipo === "test-drive";
  separadorContacto.setAttribute("aria-selected", String(!testDrive));
  separadorTestDrive.setAttribute("aria-selected", String(testDrive));
  separadorContacto.tabIndex = testDrive ? -1 : 0;
  separadorTestDrive.tabIndex = testDrive ? 0 : -1;
  painelContacto.hidden = testDrive;
  painelTestDrive.hidden = !testDrive;
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
    // Sem lista de viaturas, o formulário de contacto continua a funcionar sem viatura específica
    if (erro?.name !== "SupabaseNaoConfigurado") console.error(erro);
  }

  painelContacto.innerHTML = htmlFormularioContacto(viaturas);
  painelTestDrive.innerHTML = htmlFormularioTestDrive(viaturas);

  ligarFormulario(painelContacto, document.getElementById("form-contacto"), {
    validar: validarPedidoContacto,
    enviar: criarPedidoContacto,
    titulo: "Pedido recebido",
    texto: "Obrigado. O stand vai responder ao seu pedido de informações.",
  });
  ligarFormulario(painelTestDrive, document.getElementById("form-test-drive"), {
    validar: (dados) => validarPedidoTestDrive(dados),
    enviar: criarPedidoTestDrive,
    titulo: "Pedido de test drive recebido",
    texto: "Isto ainda não é uma marcação. O stand vai contactá-lo para confirmar o dia e a hora.",
  });

  separadorContacto.addEventListener("click", () => selecionarSeparador("contacto"));
  separadorTestDrive.addEventListener("click", () => selecionarSeparador("test-drive"));
  document.querySelector(".separadores").addEventListener("keydown", (evento) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    const testDrive = evento.key === "ArrowRight";
    selecionarSeparador(testDrive ? "test-drive" : "contacto");
    (testDrive ? separadorTestDrive : separadorContacto).focus();
  });

  if (parametros.get("tipo") === "test-drive") selecionarSeparador("test-drive");
}

iniciar();
