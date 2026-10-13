import { urlFotografia } from "../supabase-client.js";
import { CAIXAS, COMBUSTIVEIS, esc, formatarKm, formatarPreco, rotulo } from "./format.js";

export function htmlCartao(v, { horizontal = false } = {}) {
  const nome = `${v.marca} ${v.modelo}`;
  const media = v.fotoPrincipal
    ? `<img src="${esc(urlFotografia(v.fotoPrincipal.caminho))}" alt="Fotografia de ${esc(nome)}" width="800" height="500" loading="lazy">`
    : `<div class="cartao__sem-foto"><span>Fotografia em breve</span></div>`;

  const isVendido = v.estado === "vendida";

  const etiquetas = [
    isVendido ? `<span class="etiqueta etiqueta--vendida">Vendido</span>` : "",
    v.destaque ? `<span class="etiqueta etiqueta--destaque">Destaque</span>` : "",
    v.estado === "reservada" ? `<span class="etiqueta etiqueta--reservada">Reservada</span>` : "",
    v.dados_demonstracao ? `<span class="etiqueta">Demonstração</span>` : "",
  ].join("");

  const itensSpecs = [
    v.ano ? `<span>📅 ${esc(v.ano)}</span>` : "",
    v.quilometragem != null ? `<span>⏱ ${esc(formatarKm(v.quilometragem))}</span>` : "",
    v.combustivel ? `<span>⛽ ${esc(rotulo(COMBUSTIVEIS, v.combustivel))}</span>` : "",
    v.caixa ? `<span>⚙ ${esc(rotulo(CAIXAS, v.caixa))}</span>` : "",
    v.potencia_cv ? `<span>⚡ ${esc(v.potencia_cv)} cv</span>` : "",
  ].filter(Boolean);

  const mesesGarantia = v.garantia_meses ? `${v.garantia_meses} meses` : "18 meses";

  // Estimativa de financiamento calculada com base no preço (120 meses indicativos)
  const parcelaMes = !isVendido && v.preco && v.preco > 0
    ? `${Math.max(89, Math.round((v.preco * 1.15) / 120))},00 €/mês`
    : null;

  const urlDetalhe = `viatura.html?id=${encodeURIComponent(v.id)}`;

  if (horizontal) {
    return `
      <article class="cartao cartao--horizontal${isVendido ? " cartao--vendido" : ""}">
        <a class="cartao__media" href="${urlDetalhe}" aria-label="Ver detalhes de ${esc(nome)}">
          ${media}
          ${etiquetas ? `<div class="cartao__etiquetas">${etiquetas}</div>` : ""}
        </a>
        <div class="cartao__corpo">
          <div class="cartao__detalhes">
            <h3 class="cartao__titulo">
              <a class="cartao__ligacao" href="${urlDetalhe}">${esc(nome)}</a>
            </h3>
            ${v.versao ? `<p class="cartao__versao">${esc(v.versao)}</p>` : ""}
            <div class="cartao__specs">${itensSpecs.join("")}</div>
            <p class="cartao__garantia">${isVendido ? `<span style="color:#ef4444;font-weight:700">Viatura entregue a cliente</span>` : `Garantia: <span>${esc(mesesGarantia)}</span>`}</p>
          </div>
          <div class="cartao__preco-coluna">
            <p class="cartao__preco num">${esc(formatarPreco(v.preco))}</p>
            ${isVendido ? `
              <div class="cartao__financiamento-caixa" style="border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.1)">
                <span class="cartao__financiamento-valor" style="color:#fca5a5;font-size:1.05rem">VENDIDO</span>
                <span class="cartao__financiamento-prazo">Viatura Indisponível</span>
              </div>` : (parcelaMes ? `
              <div class="cartao__financiamento-caixa">
                <span class="cartao__financiamento-valor">${esc(parcelaMes)}</span>
                <span class="cartao__financiamento-prazo">* 120 meses</span>
              </div>` : "")}
          </div>
        </div>
      </article>`;
  }

  return `
    <article class="cartao${isVendido ? " cartao--vendido" : ""}">
      <a class="cartao__media" href="${urlDetalhe}" aria-label="Ver detalhes de ${esc(nome)}">
        ${media}
        ${v.iva_dedutivel ? `<span class="cartao__faixa-iva">IVA Dedutível</span>` : ""}
        ${etiquetas ? `<div class="cartao__etiquetas">${etiquetas}</div>` : ""}
      </a>
      <div class="cartao__corpo">
        <div class="cartao__cabeca-linha">
          <h3 class="cartao__titulo">
            <a class="cartao__ligacao" href="viatura.html?id=${encodeURIComponent(v.id)}">${esc(nome)}</a>
          </h3>
          <span class="cartao__preco-topo num">${esc(formatarPreco(v.preco))}</span>
        </div>
        ${v.versao ? `<p class="cartao__versao">${esc(v.versao)}</p>` : ""}
        <div class="cartao__specs-linha">${itensSpecs.slice(0, 3).join("")}</div>
        <div class="cartao__rodape-info">
          <p class="cartao__garantia">${isVendido ? `<span style="color:#ef4444;font-weight:700">Vendido</span>` : `Garantia: <span>${esc(mesesGarantia)}</span>`}</p>
          ${isVendido ? `<span style="color:#fca5a5;font-weight:600;font-size:0.8125rem">Indisponível</span>` : (parcelaMes ? `<span class="cartao__financiamento-prazo">* 120 meses</span>` : "")}
        </div>
      </div>
    </article>`;
}
