import { esc, formatarPreco } from './format.js';

const moeda = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

/**
 * Gera o HTML de um simulador indicativo de financiamento.
 * NOTA: Os valores são meramente indicativos e não constituem uma proposta de crédito.
 */
export function htmlSimulador(preco) {
  if (!preco || preco <= 0) return '';
  return `
    <div class="simulador" id="simulador">
      <h3>Simular financiamento</h3>
      <p style="font-size:0.875rem;color:#46514c;margin-bottom:1rem">Simulação meramente indicativa. Não constitui uma proposta de crédito.</p>
      <div class="formulario">
        <div class="campo">
          <label for="sim-entrada">Entrada (€)</label>
          <input id="sim-entrada" type="number" min="0" max="${preco}" step="500" value="0" inputmode="numeric">
        </div>
        <div class="campo">
          <label for="sim-meses">N.º de meses</label>
          <select id="sim-meses">
            <option value="12">12 meses</option>
            <option value="24">24 meses</option>
            <option value="36">36 meses</option>
            <option value="48" selected>48 meses</option>
            <option value="60">60 meses</option>
            <option value="72">72 meses</option>
            <option value="84">84 meses</option>
            <option value="96">96 meses</option>
          </select>
        </div>
        <div class="campo">
          <label for="sim-taxa">Taxa anual indicativa (%)</label>
          <input id="sim-taxa" type="number" min="0" max="30" step="0.1" value="7.9" inputmode="decimal">
        </div>
      </div>
      <div class="simulador__resultado" id="sim-resultado"></div>
    </div>`;
}

/** Calcula a prestação mensal com juros compostos. */
function calcularPrestacao(capital, taxaAnual, meses) {
  if (capital <= 0 || meses <= 0) return 0;
  if (taxaAnual <= 0) return capital / meses;
  const r = taxaAnual / 100 / 12;
  return capital * r * Math.pow(1 + r, meses) / (Math.pow(1 + r, meses) - 1);
}

export function ligarSimulador(preco) {
  const simulador = document.getElementById('simulador');
  if (!simulador) return;

  const entrada = document.getElementById('sim-entrada');
  const meses = document.getElementById('sim-meses');
  const taxa = document.getElementById('sim-taxa');
  const resultado = document.getElementById('sim-resultado');

  function calcular() {
    const e = Math.max(0, Math.min(preco, Number(entrada.value) || 0));
    const m = Number(meses.value) || 48;
    const t = Math.max(0, Math.min(30, Number(taxa.value) || 0));
    const capital = preco - e;

    if (capital <= 0) {
      resultado.innerHTML = '<span class="num">Sem financiamento</span><small>O valor da entrada cobre o preço total.</small>';
      return;
    }

    const prestacao = calcularPrestacao(capital, t, m);
    resultado.innerHTML = `
      <span class="num">${moeda.format(prestacao)} /mês</span>
      <small>Capital: ${moeda.format(capital)} · ${m} meses · TAEG indicativa: ${t.toFixed(1)}%</small>
      <small style="display:block;margin-top:0.5rem">Simulação indicativa, sujeita a aprovação. Contacte-nos para uma proposta personalizada.</small>`;
  }

  entrada.addEventListener('input', calcular);
  meses.addEventListener('change', calcular);
  taxa.addEventListener('input', calcular);
  calcular();
}
