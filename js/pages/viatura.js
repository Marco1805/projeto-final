import { SITE } from "../site-config.js";
import { montarLayout } from "../ui/layout.js";
import { urlFotografia } from "../supabase-client.js";
import { CAIXAS, COMBUSTIVEIS, ESTADOS, esc, formatarKm, formatarPreco, rotulo } from "../ui/format.js";
import { SEGMENTOS } from "../services/filtros.js";
import { htmlMensagem, mensagemDeErro } from "../ui/estados.js";
import { obterViatura, listarViaturas } from "../services/viaturas.js";
import { criarPedidoContacto } from "../services/pedidos.js";

montarLayout("viaturas");

const raiz = document.getElementById("detalhe");

let indiceFotoAtual = 0;
let listaFotografias = [];

function htmlGaleriaSupercars(v, nome) {
  listaFotografias = v.fotografias || [];
  if (!listaFotografias.length) {
    return `
      <div class="galeria-supercars">
        <div class="galeria-supercars__moldura">
          <div class="cartao__sem-foto" style="height:460px;display:flex;align-items:center;justify-content:center;background:var(--bg-campo);border-radius:var(--raio-lg)">
            <span>Fotografias em preparação</span>
          </div>
        </div>
      </div>`;
  }

  const miniaturas = listaFotografias.map((f, i) => `
    <button class="miniatura-supercars${i === 0 ? " miniatura-supercars--ativa" : ""}" type="button" data-indice="${i}" aria-label="Foto ${i + 1} de ${listaFotografias.length}">
      <img src="${esc(urlFotografia(f.caminho))}" alt="" loading="lazy">
    </button>
  `).join("");

  const fotoInicial = urlFotografia(listaFotografias[0].caminho);

  return `
    <div class="galeria-supercars">
      <div class="galeria-supercars__lateral" id="galeria-miniaturas">
        ${miniaturas}
      </div>
      <div class="galeria-supercars__moldura">
        <img id="foto-principal" src="${esc(fotoInicial)}" alt="Fotografia de ${esc(nome)}" loading="eager">
        ${listaFotografias.length > 1 ? `
          <button class="galeria-supercars__seta galeria-supercars__seta--esq" type="button" data-acao="foto-ant" aria-label="Fotografia anterior">‹</button>
          <button class="galeria-supercars__seta galeria-supercars__seta--dir" type="button" data-acao="foto-prox" aria-label="Próxima fotografia">›</button>
        ` : ""}
        <button class="galeria-supercars__expandir" type="button" data-acao="expandir" aria-label="Ver em ecrã inteiro">⛶</button>
        <span class="galeria-supercars__contador" id="foto-contador">📷 1 / ${listaFotografias.length}</span>
        <button class="galeria-supercars__pergunta-rapida" type="button" id="btn-pergunta-rapida">
          <span>Este carro ainda está disponível?</span>
          <span class="seta-cima">↑</span>
        </button>
      </div>
    </div>`;
}

function htmlEspecificacoesGrid(v) {
  const specs = [
    { icone: "📅", titulo: v.ano ? `11/${v.ano}` : "N/D", subtitulo: "Mês/Ano" },
    { icone: "⏱", titulo: v.quilometragem != null ? formatarKm(v.quilometragem) : "N/D", subtitulo: "Quilómetros" },
    { icone: "⛽", titulo: rotulo(COMBUSTIVEIS, v.combustivel) || "N/D", subtitulo: "Combustível" },
    { icone: "⚙", titulo: rotulo(CAIXAS, v.caixa) || "Manual", subtitulo: "Transmissão" },
    { icone: "🔧", titulo: v.cilindrada_cc ? `${v.cilindrada_cc} cm³` : "N/D", subtitulo: "Cilindrada" },
    { icone: "⚡", titulo: v.potencia_cv ? `${v.potencia_cv} cv` : "N/D", subtitulo: "Potência" },
    { icone: "🎨", titulo: v.cor || "Nacional", subtitulo: "Cor" },
    { icone: "🇵🇹", titulo: "Nacional", subtitulo: "Origem" },
    { icone: "🚗", titulo: rotulo(SEGMENTOS, v.segmento) || "Automóvel", subtitulo: "Segmento" },
    { icone: "👥", titulo: v.lugares ? `${v.lugares} lug.` : "5 lug.", subtitulo: "Capacidade" },
  ];

  return `
    <div class="especificacoes-supercars">
      ${specs.map((s) => `
        <div class="especificacao-item">
          <span class="especificacao-item__icone">${s.icone}</span>
          <div class="especificacao-item__conteudo">
            <strong>${esc(s.titulo)}</strong>
            <span>${esc(s.subtitulo)}</span>
          </div>
        </div>
      `).join("")}
    </div>`;
}

function htmlPainelContacto(v, nome) {
  const garantia = v.garantia_meses ? `${v.garantia_meses} meses` : "18 meses";
  const numWhatsapp = SITE.whatsapp || "351918894947";
  const msgWhatsapp = encodeURIComponent(`Olá, gostaria de saber mais informações sobre a viatura ${nome} (${formatarPreco(v.preco)}).`);

  // Estimativa de financiamento calculada com base no preço (120 meses indicativos)
  const parcelaMes = v.preco && v.preco > 0
    ? `${Math.max(89, Math.round((v.preco * 1.15) / 120))},00 €/mês`
    : null;

  const isVendido = v.estado === "vendida";

  return `
    <div class="painel-contacto-supercars">
      <div class="painel-contacto-supercars__preco-cabeca"${isVendido ? ' style="border-left:4px solid #ef4444;background:rgba(239,68,68,0.08);padding:1rem;border-radius:var(--raio)"' : ""}>
        <span class="preco-rotulo">${isVendido ? `<strong style="color:#ef4444">ESTADO DA VIATURA</strong>` : "Preço de venda"}</span>
        <span class="preco-valor num"${isVendido ? ' style="color:#ef4444;font-size:2rem"' : ""}>${isVendido ? "VENDIDO" : esc(formatarPreco(v.preco))}</span>
        <span class="preco-garantia">${isVendido ? "Esta viatura já foi vendida e entregue ao proprietário" : `garantia de ${esc(garantia)} por mútuo acordo`}</span>
      </div>

      ${!isVendido && parcelaMes ? `
        <div class="cartao-financiamento-caixa">
          <div class="cartao-financiamento-caixa__topo">
            <span class="cartao-financiamento-caixa__rotulo">Financiamento desde</span>
            <span class="cartao-financiamento-caixa__valor num">${esc(parcelaMes)}</span>
          </div>
          <span class="cartao-financiamento-caixa__prazo">* 120 meses</span>
          <p class="cartao-financiamento-caixa__nota">Exemplo indicativo para crédito automóvel. Sujeito a aprovação financeira. A SuperAuto Sport atua como intermediário de crédito a título acessório.</p>
        </div>` : ""}

      <div class="cartao-solicitar-contacto">
        <h3>${isVendido ? "Procura uma viatura idêntica?" : "Solicitar contacto"}</h3>
        <p class="cartao-solicitar-contacto__subtitulo">${isVendido ? "Esta unidade já foi vendida, mas a equipa da SuperAuto Sport pode encontrar um modelo semelhante para si." : "Deixe-nos responder às suas perguntas sem compromisso. Entraremos em contacto consigo com a máxima brevidade."}</p>
        
        <form id="form-contacto-viatura" novalidate>
          <div class="campo campo--com-icone">
            <svg class="campo-icone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input type="text" name="nome" placeholder="Indique o seu nome" required autocomplete="name">
          </div>
          <div class="campo campo--com-icone">
            <svg class="campo-icone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <input type="tel" name="telefone" placeholder="Indique o seu número de telefone" required autocomplete="tel">
          </div>
          <div class="campo campo--com-icone">
            <svg class="campo-icone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input type="email" name="email" placeholder="Indique o seu e-mail" required autocomplete="email">
          </div>
          <div class="campo">
            <textarea id="txt-mensagem-viatura" name="mensagem" placeholder="${isVendido ? "Olá, vi esta viatura vendida e tenho interesse numa unidade semelhante…" : "Escreva a sua mensagem aqui…"}" maxlength="300" rows="3">${isVendido ? `Olá, vi a viatura ${esc(nome)} que já foi vendida e gostaria de saber se conseguem arranjar uma semelhante.` : ""}</textarea>
            <span class="campo-contador" id="contador-caracteres">${isVendido ? `${`Olá, vi a viatura ${nome} que já foi vendida e gostaria de saber se conseguem arranjar uma semelhante.`.length}/300 carateres` : "0/300 carateres"}</span>
          </div>

          <div class="campo campo--caixa campo-termos-viatura">
            <input type="checkbox" id="check-termos" name="aceita_termos" checked required>
            <label for="check-termos">Declaro que li e compreendi a <a href="privacidade.html" target="_blank">Política de Privacidade</a> e autorizo o contacto pela SuperAuto Sport.</label>
          </div>

          <div class="painel-contacto__acoes">
            <button class="botao botao--primario botao--solicitar" type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ${isVendido ? "Pedir viatura idêntica" : "Solicitar contacto"}
            </button>
            <a class="botao-whatsapp-redondo" href="https://wa.me/${numWhatsapp}?text=${msgWhatsapp}" target="_blank" rel="noopener" aria-label="Contactar via WhatsApp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </a>
          </div>
          ${isVendido ? `<p style="margin-top:0.75rem;text-align:center"><a class="ligacao" href="catalogo.html">← Ver viaturas disponíveis no catálogo</a></p>` : ""}
          <div id="contacto-feedback" style="margin-top:0.75rem;font-size:0.9rem;" hidden></div>
        </form>
      </div>
    </div>`;
}

function htmlAbaEquipamento(v) {
  let itensBd = [];
  if (Array.isArray(v.equipamento)) {
    itensBd = v.equipamento;
  } else if (typeof v.equipamento === "string" && v.equipamento.trim()) {
    try {
      const p = JSON.parse(v.equipamento);
      if (Array.isArray(p)) itensBd = p;
      else itensBd = v.equipamento.split("\n").map(s => s.trim()).filter(Boolean);
    } catch {
      itensBd = v.equipamento.split("\n").map(s => s.trim()).filter(Boolean);
    }
  }
  
  if (itensBd.length > 0) {
    return `
      <div class="detalhe__seccao-bloco">
        <h2>Equipamento e Opcionais</h2>
        <p style="color:var(--texto-secundario);margin:0.5rem 0 1.5rem">Equipamento registado para esta unidade:</p>
        <div class="equipamento-categorias-grelha" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(18rem, 1fr));gap:0.85rem">
          ${itensBd.map((item) => `
            <div class="equipamento-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1.15rem;background:var(--bg-campo);border:1px solid var(--borda-suave);border-radius:var(--raio)">
              <span class="check-icone" style="color:var(--acento);font-weight:700">✓</span>
              <span style="color:var(--texto-puro);font-weight:600">${esc(item)}</span>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  const categoriasPadrao = [
    { titulo: "Áudio e Multimédia", itens: ["Apple CarPlay e Android Auto", "Bluetooth Mãos-Livres", "Ecrã Tátil Multifunções"] },
    { titulo: "Conforto e Interior", itens: ["Ar Condicionado Automático", "Bancos Conforto", "Volante Multifunções em Pele"] },
    { titulo: "Segurança e Protecção", itens: ["Sensores de Estacionamento", "Faróis LED", "Controlo de Estabilidade e Tração"] },
  ];

  return `
    <div class="detalhe__seccao-bloco">
      <h2>Equipamento da Viatura</h2>
      <div class="equipamento-categorias-grelha" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(18rem, 1fr));gap:1.25rem;margin-top:1.5rem">
        ${categoriasPadrao.map((c) => `
          <div class="equipamento-categoria-bloco">
            <h3>${esc(c.titulo)}</h3>
            <ul class="equipamento-lista">
              ${c.itens.map((i) => `
                <li class="equipamento-item"><span class="check-icone">✓</span><span>${esc(i)}</span></li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    </div>`;
}

function htmlAbaDescricao(v) {
  const garantia = v.garantia_meses ? `${v.garantia_meses} meses` : "18 meses";
  const desc = v.descricao ? esc(v.descricao).replace(/\n+/g, "</p><p>") : `Viatura ${esc(v.marca)} ${esc(v.modelo)} em excelente estado de conservação, totalmente inspecionada com garantia contratual de ${esc(garantia)}.`;

  const dadosPrincipais = [
    v.ano ? `Ano de Fabrico / Matrícula: ${v.ano}` : null,
    v.quilometragem != null ? `Quilometragem Verificada: ${formatarKm(v.quilometragem)}` : null,
    v.combustivel ? `Combustível: ${rotulo(COMBUSTIVEIS, v.combustivel)}` : null,
    v.caixa ? `Transmissão: ${rotulo(CAIXAS, v.caixa)}` : null,
    v.potencia_cv ? `Potência do Motor: ${v.potencia_cv} cv` : null,
    `Garantia Contratual: ${garantia}`,
    "Viatura com revisão técnica completa efetuada",
    "Pronta a circular sem despesas adicionais",
  ].filter(Boolean);

  return `
    <div class="detalhe__seccao-bloco">
      <h2>Apresentação da Viatura</h2>
      <div style="margin:1rem 0 1.5rem;line-height:1.75;font-size:1.05rem;color:var(--texto-principal)">
        <p>${desc}</p>
      </div>

      <h3 style="font-size:1.2rem;margin-top:2rem;margin-bottom:1rem;color:var(--texto-puro)">Dados Principais</h3>
      <div class="descricao-bloco-dados">
        ${dadosPrincipais.map((d) => `
          <div class="equipamento-item">
            <span class="check-icone">✓</span>
            <span>${esc(d)}</span>
          </div>
        `).join("")}
      </div>
    </div>`;
}

function htmlAbaLocalizacao(v) {
  return `
    <div class="detalhe__seccao-bloco">
      <h2>Onde pode ver esta viatura</h2>
      <div class="contactos-mapa-grelha" style="margin-top:1.5rem">
        <div class="contactos-cards">
          <div class="cartao-info-contacto">
            <div class="cartao-info-contacto__icone">📍</div>
            <div>
              <strong>Stand</strong>
              <span>SuperAuto Sport</span>
            </div>
          </div>
          <div class="cartao-info-contacto">
            <div class="cartao-info-contacto__icone">🏢</div>
            <div>
              <strong>Morada</strong>
              <span>Avenida Fontes Pereira de Melo, 4100-248 Porto</span>
            </div>
          </div>
          <div class="cartao-info-contacto">
            <div class="cartao-info-contacto__icone">📞</div>
            <div>
              <strong>Telefone Comercial</strong>
              <a href="tel:+351918894947">918 894 947</a>
            </div>
          </div>
          <div class="cartao-info-contacto">
            <div class="cartao-info-contacto__icone">🕒</div>
            <div>
              <strong>Horário de Funcionamento</strong>
              <span>Seg. a Sex.: 09:30 – 19:30 · Sáb.: 10:00 – 18:00</span>
            </div>
          </div>
          <div class="contactos-cards__acoes">
            <a class="botao botao--primario" href="https://maps.google.com/?q=Avenida+Fontes+Pereira+de+Melo+4100-248+Porto" target="_blank" rel="noopener">Obter direcções no Google Maps</a>
            <a class="botao botao--contorno" href="https://wa.me/351918894947" target="_blank" rel="noopener">Falar no WhatsApp</a>
          </div>
        </div>
        <div class="contactos-mapa-envolvente">
          <iframe
            title="Localização da viatura no Stand SuperAuto Sport no Porto"
            src="https://maps.google.com/maps?q=Avenida+Fontes+Pereira+de+Melo,+4100-248+Porto&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=&amp;output=embed"
            width="100%"
            height="100%"
            style="border:0; min-height:340px; border-radius:var(--raio-lg);"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </div>`;
}

function mostrar(v) {
  const nome = `${v.marca} ${v.modelo}`;
  document.title = `${nome} | ${SITE.nome}`;

  raiz.innerHTML = `
    <div class="contentor detalhe-supercars">
      <div class="detalhe-supercars__topo">
        <a class="botao-voltar-supercars" href="catalogo.html" aria-label="Voltar às viaturas">‹</a>
        <h1 class="detalhe-supercars__titulo">
          <span>${esc(nome)}</span>
          ${v.versao ? `<span class="separador-versao"> | </span><span class="subtitulo-versao">${esc(v.versao)}</span>` : ""}
          ${v.estado === "vendida" ? `<span class="etiqueta etiqueta--vendida" style="margin-left:0.75rem;vertical-align:middle;font-size:0.875rem">VENDIDO</span>` : ""}
        </h1>
      </div>

      <div class="detalhe-supercars__principal">
        <div class="detalhe-supercars__coluna-esquerda">
          ${htmlGaleriaSupercars(v, nome)}
        </div>
        <div class="detalhe-supercars__coluna-direita">
          ${htmlPainelContacto(v, nome)}
        </div>
      </div>

      <div class="detalhe-supercars__especificacoes-seccao">
        ${htmlEspecificacoesGrid(v)}
      </div>

      <div class="detalhe-supercars__abas-wrapper">
        <div class="detalhe-abas-barra" role="tablist" aria-label="Informações detalhadas da viatura">
          <button class="detalhe-aba-botao detalhe-aba-botao--ativo" type="button" role="tab" id="tab-btn-equipamento" data-aba="equipamento" aria-controls="tab-painel-equipamento" aria-selected="true">Equipamento</button>
          <button class="detalhe-aba-botao" type="button" role="tab" id="tab-btn-descricao" data-aba="descricao" aria-controls="tab-painel-descricao" aria-selected="false">Descrição</button>
          <button class="detalhe-aba-botao" type="button" role="tab" id="tab-btn-localizacao" data-aba="localizacao" aria-controls="tab-painel-localizacao" aria-selected="false">Localização</button>
        </div>

        <div class="detalhe-aba-conteudo" id="tab-painel-equipamento" role="tabpanel" aria-labelledby="tab-btn-equipamento">
          ${htmlAbaEquipamento(v)}
        </div>

        <div class="detalhe-aba-conteudo" id="tab-painel-descricao" role="tabpanel" aria-labelledby="tab-btn-descricao" hidden>
          ${htmlAbaDescricao(v)}
        </div>

        <div class="detalhe-aba-conteudo" id="tab-painel-localizacao" role="tabpanel" aria-labelledby="tab-btn-localizacao" hidden>
          ${htmlAbaLocalizacao(v)}
        </div>
      </div>
    </div>`;

  // Comportamento das Abas
  const botoesAbas = raiz.querySelectorAll(".detalhe-aba-botao");
  const paineisAbas = raiz.querySelectorAll(".detalhe-aba-conteudo");
  botoesAbas.forEach((btn) => {
    btn.addEventListener("click", () => {
      const abaAlvo = btn.dataset.aba;
      botoesAbas.forEach((b) => {
        const ativo = b === btn;
        b.classList.toggle("detalhe-aba-botao--ativo", ativo);
        b.setAttribute("aria-selected", String(ativo));
      });
      paineisAbas.forEach((p) => {
        p.hidden = p.id !== `tab-painel-${abaAlvo}`;
      });
    });
  });

  // Interações da Galeria
  const fotoPrincipal = document.getElementById("foto-principal");
  const contador = document.getElementById("foto-contador");
  const miniaturas = raiz.querySelectorAll(".miniatura-supercars");

  function atualizarFoto(novoIndice) {
    if (!listaFotografias.length) return;
    indiceFotoAtual = (novoIndice + listaFotografias.length) % listaFotografias.length;
    fotoPrincipal.src = urlFotografia(listaFotografias[indiceFotoAtual].caminho);
    if (contador) contador.textContent = `📷 ${indiceFotoAtual + 1} / ${listaFotografias.length}`;
    miniaturas.forEach((btn, i) => {
      btn.classList.toggle("miniatura-supercars--ativa", i === indiceFotoAtual);
    });
  }

  miniaturas.forEach((btn, i) => {
    btn.addEventListener("click", () => atualizarFoto(i));
  });

  raiz.querySelector('[data-acao="foto-ant"]')?.addEventListener("click", () => atualizarFoto(indiceFotoAtual - 1));
  raiz.querySelector('[data-acao="foto-prox"]')?.addEventListener("click", () => atualizarFoto(indiceFotoAtual + 1));

  // Botão pergunta rápida
  const btnPergunta = document.getElementById("btn-pergunta-rapida");
  const txtMensagem = document.getElementById("txt-mensagem-viatura");
  btnPergunta?.addEventListener("click", () => {
    if (txtMensagem) {
      txtMensagem.value = "Olá, esta viatura ainda se encontra disponível para visita?";
      txtMensagem.focus();
      const contador = document.getElementById("contador-caracteres");
      if (contador) contador.textContent = `${txtMensagem.value.length}/300 carateres`;
    }
  });

  // Contador de caracteres
  txtMensagem?.addEventListener("input", () => {
    const contador = document.getElementById("contador-caracteres");
    if (contador) contador.textContent = `${txtMensagem.value.length}/300 carateres`;
  });

  // Submissão do Formulário de Contacto
  const formContacto = document.getElementById("form-contacto-viatura");
  const feedback = document.getElementById("contacto-feedback");
  formContacto?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSubmit = formContacto.querySelector('button[type="submit"]');
    const nomeVal = formContacto.elements.nome.value.trim();
    const telVal = formContacto.elements.telefone.value.trim();
    const emailVal = formContacto.elements.email.value.trim();
    const msgVal = formContacto.elements.mensagem.value.trim();
    const checkTermos = formContacto.querySelector("#check-termos");

    if (checkTermos && !checkTermos.checked) {
      feedback.hidden = false;
      feedback.style.color = "var(--erro)";
      feedback.textContent = "Por favor, aceite os termos e a política de privacidade.";
      return;
    }

    if (!nomeVal || !telVal || !emailVal) {
      feedback.hidden = false;
      feedback.style.color = "var(--erro)";
      feedback.textContent = "Por favor, preencha o seu nome, telefone e email.";
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "A enviar…";

    try {
      await criarPedidoContacto({
        viatura_id: v.id,
        nome: nomeVal,
        telefone: telVal,
        email: emailVal,
        mensagem: msgVal || `Interesse na viatura ${nome}`,
      });
      feedback.hidden = false;
      feedback.style.color = "var(--sucesso)";
      feedback.textContent = "✓ Pedido de contacto enviado com sucesso! Responderemos brevemente.";
      formContacto.reset();
      btnSubmit.textContent = "Solicitar contacto";
      btnSubmit.disabled = false;
    } catch (erro) {
      console.error("Erro ao enviar contacto:", erro);
      feedback.hidden = false;
      feedback.style.color = "var(--erro)";
      feedback.textContent = "Não foi possível enviar o pedido. Tente novamente ou use o WhatsApp.";
      btnSubmit.textContent = "Solicitar contacto";
      btnSubmit.disabled = false;
    }
  });
}

function mostrarMensagem(dados) {
  raiz.innerHTML = `<div class="contentor seccao">${htmlMensagem(dados)}</div>`;
}

async function carregarSemelhantes(v) {
  try {
    const filtros = { q: '', marca: v.marca, segmento: '', combustivel: '', precoMin: null, precoMax: null, anoMin: null, kmMax: null, ivaDedutivel: false, ordenar: 'recentes' };
    const { viaturas } = await listarViaturas(filtros, 0);
    const semelhantes = viaturas.filter(s => s.id !== v.id).slice(0, 3);
    if (!semelhantes.length) return;
    
    const { htmlCartao } = await import('../ui/cartao-viatura.js');
    const seccao = document.createElement('section');
    seccao.className = 'seccao seccao-semelhantes';
    seccao.innerHTML = `
      <div class="contentor">
        <div class="seccao__cabeca">
          <h2>Outras Viaturas Semelhantes</h2>
          <a class="ligacao" href="catalogo.html?marca=${encodeURIComponent(v.marca)}">Ver todas</a>
        </div>
        <div class="grelha-viaturas">${semelhantes.map(htmlCartao).join('')}</div>
      </div>`;
    raiz.after(seccao);
  } catch (e) { console.error(e); }
}

async function iniciar() {
  const params = new URLSearchParams(
    window.location.search || (window.location.hash.includes("?") ? window.location.hash.slice(window.location.hash.indexOf("?")) : "")
  );
  let idBruto = params.get("id") || params.get("viatura") || "";
  let id = idBruto.trim().replace(/[/?#].*$/, "");

  let viatura = null;
  if (id) {
    try {
      viatura = await obterViatura(id);
    } catch (e) {
      console.warn("Erro ao obter viatura por ID:", e);
    }
  }

  // Apenas se NENHUM ID tiver sido especificado no URL (ex: navegação direta para viatura.html), carrega uma viatura inicial
  if (!viatura && !id) {
    try {
      const { viaturas } = await listarViaturas({}, 0);
      if (viaturas && viaturas.length > 0) {
        viatura = (await obterViatura(viaturas[0].id)) || viaturas[0];
        if (viatura) {
          window.history.replaceState(null, "", `?id=${viatura.id}`);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar viatura fallback:", e);
    }
  }

  if (!viatura) {
    return mostrarMensagem({
      titulo: "Viatura não encontrada",
      texto: "Esta viatura pode já ter sido vendida ou a ligação estar incorreta.",
      acao: { texto: "Ver todas as viaturas", href: "catalogo.html" },
    });
  }

  mostrar(viatura);
  carregarSemelhantes(viatura);
}

iniciar();
