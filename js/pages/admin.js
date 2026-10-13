import { montarLayout } from "../ui/layout.js";
import { esc } from "../ui/format.js";
import { avisar } from "../ui/avisos.js";
import { htmlMensagem, mensagemDeErro } from "../ui/estados.js";
import { limparErros, mostrarErroGeral, mostrarErros, htmlCampo } from "../ui/formularios.js";
import { eAdministrador, entrar, mensagemErroLogin, obterUtilizador, sair } from "../services/auth.js";
import { contarPedidos } from "../services/pedidos.js";

montarLayout("");

const raiz = document.getElementById("admin");
const ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** Cada rota carrega o seu módulo só quando é preciso. */
const ROTAS = [
  { padrao: /^$|^resumo$/, id: "resumo", carregar: () => import("../admin/vista-resumo.js") },
  { padrao: /^viaturas$/, id: "viaturas", carregar: () => import("../admin/vista-viaturas.js") },
  { padrao: /^viaturas\/nova$/, id: "viaturas", carregar: () => import("../admin/vista-viatura-form.js") },
  { padrao: new RegExp(`^viaturas/(${ID})$`, "i"), id: "viaturas", carregar: () => import("../admin/vista-viatura-form.js") },
  { padrao: /^contactos$/, id: "contactos", carregar: () => import("../admin/vista-pedidos.js"), tipo: "contacto" },
  { padrao: /^test-drives$/, id: "test-drives", carregar: () => import("../admin/vista-pedidos.js"), tipo: "test_drive" },
  { padrao: /^retomas$/, id: "retomas", carregar: () => import("../admin/vista-retomas.js") },
];

const SEPARADORES = [
  { id: "resumo", texto: "Resumo", href: "#resumo" },
  { id: "viaturas", texto: "Viaturas", href: "#viaturas" },
  { id: "contactos", texto: "Pedidos de contacto", href: "#contactos", contador: "contacto" },
  { id: "test-drives", texto: "Test drives", href: "#test-drives", contador: "test_drive" },
  { id: "retomas", texto: "Retomas", href: "#retomas", contador: "retoma" },
];

// ---------- Início de sessão ----------

function mostrarLogin() {
  raiz.innerHTML = `
    <div class="admin-login">
      <h1>Área reservada</h1>
      <form class="formulario" id="form-login" novalidate>
        ${htmlCampo({ prefixo: "l", nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, atributos: 'autocomplete="username"' })}
        ${htmlCampo({ prefixo: "l", nome: "palavra_passe", rotulo: "Palavra-passe", tipo: "password", obrigatorio: true, atributos: 'autocomplete="current-password"' })}
        <button class="botao botao--primario" type="submit">Entrar</button>
      </form>
    </div>`;

  const formulario = document.getElementById("form-login");
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);
    const email = formulario.elements.email.value.trim();
    const palavraPasse = formulario.elements.palavra_passe.value;

    const erros = {};
    if (!email) erros.email = "Indique o seu email.";
    if (!palavraPasse) erros.palavra_passe = "Indique a sua palavra-passe.";
    if (Object.keys(erros).length) return mostrarErros(formulario, erros);

    const botao = formulario.querySelector("button[type=submit]");
    botao.disabled = true;
    botao.textContent = "A entrar…";
    try {
      await entrar(email, palavraPasse);
      await iniciar();
    } catch (erro) {
      botao.disabled = false;
      botao.textContent = "Entrar";
      if (erro?.name === "SupabaseNaoConfigurado") {
        return mostrarErroGeral(formulario, "A ligação ao Supabase ainda não está configurada.");
      }
      mostrarErroGeral(formulario, mensagemErroLogin(erro));
    }
  });
}

function mostrarSemPermissao(utilizador) {
  raiz.innerHTML = `
    <div class="admin-login">
      <h1>Sem permissões</h1>
      <p>A conta <strong>${esc(utilizador.email)}</strong> não tem permissões de administração.</p>
      <p style="margin-top:1rem"><button class="botao botao--contorno" type="button" id="terminar">Terminar sessão</button></p>
    </div>`;
  document.getElementById("terminar").addEventListener("click", terminarSessao);
}

async function terminarSessao() {
  try {
    await sair();
  } catch (erro) {
    console.error(erro);
  }
  window.location.hash = "";
  await iniciar();
}

// ---------- Painel ----------

function mostrarPainel(utilizador) {
  raiz.innerHTML = `
    <div class="admin__cabeca">
      <h1>Administração</h1>
      <div class="admin__utilizador">
        <span>${esc(utilizador.email)}</span>
        <button class="botao botao--contorno botao--pequeno" type="button" id="terminar">Terminar sessão</button>
      </div>
    </div>
    <nav aria-label="Administração">
      <ul class="admin__navegacao" id="admin-navegacao">
        ${SEPARADORES.map(
          (s) => `<li><a href="${s.href}" data-id="${s.id}">${esc(s.texto)}<span class="etiqueta" data-contador="${s.contador ?? ""}" hidden></span></a></li>`
        ).join("")}
      </ul>
    </nav>
    <div id="vista"></div>`;
  document.getElementById("terminar").addEventListener("click", terminarSessao);
  navegar();
  atualizarContadores();
}

/** Mostra, junto dos separadores, quantos pedidos novos ou pendentes existem. */
async function atualizarContadores() {
  for (const [tipo, estado] of [["contacto", "novo"], ["test_drive", "pendente"], ["retoma", "novo"]]) {
    const etiqueta = document.querySelector(`[data-contador="${tipo}"]`);
    if (!etiqueta) continue;
    try {
      const total = await contarPedidos(tipo, estado);
      etiqueta.textContent = total;
      etiqueta.hidden = total === 0;
      etiqueta.setAttribute("aria-label", `${total} por tratar`);
    } catch {
      etiqueta.hidden = true;
    }
  }
}

async function navegar() {
  const vista = document.getElementById("vista");
  if (!vista) return;
  const caminho = window.location.hash.replace(/^#\/?/, "");
  const rota = ROTAS.find((r) => r.padrao.test(caminho));

  document.querySelectorAll("#admin-navegacao a").forEach((a) => {
    if (a.dataset.id === (rota?.id ?? "")) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  if (!rota) {
    vista.innerHTML = htmlMensagem({ titulo: "Página não encontrada", texto: "Escolha uma secção no menu.", acao: { texto: "Ir para o resumo", href: "#resumo" } });
    return;
  }

  vista.innerHTML = `<p role="status">A carregar…</p>`;
  try {
    const modulo = await rota.carregar();
    const correspondencia = caminho.match(rota.padrao);
    await modulo.mostrar(vista, {
      parametro: correspondencia?.[1] ?? null,
      tipo: rota.tipo ?? null,
      avisar,
      atualizarContadores,
      navegar: (hash) => {
        window.location.hash = hash;
      },
    });
  } catch (erro) {
    vista.innerHTML = htmlMensagem(mensagemDeErro(erro));
  }
}

// ---------- Arranque ----------

async function iniciar() {
  try {
    const utilizador = await obterUtilizador();
    if (!utilizador) return mostrarLogin();
    if (!(await eAdministrador(utilizador))) return mostrarSemPermissao(utilizador);
    mostrarPainel(utilizador);
  } catch (erro) {
    raiz.innerHTML = htmlMensagem(mensagemDeErro(erro));
  }
}

window.addEventListener("hashchange", navegar);
iniciar();
