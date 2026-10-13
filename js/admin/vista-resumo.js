import { formatarPreco } from "../ui/format.js";
import { obterResumoStock } from "../services/admin-viaturas.js";
import { contarPedidos } from "../services/pedidos.js";

export async function mostrar(raiz) {
  const [stock, contactosNovos, testDrivesPendentes, retomasNovas] = await Promise.all([
    obterResumoStock(),
    contarPedidos("contacto", "novo"),
    contarPedidos("test_drive", "pendente"),
    contarPedidos("retoma", "novo"),
  ]);

  raiz.innerHTML = `
    <h2 class="so-leitores">Resumo</h2>
    <dl class="resumo">
      <div><dt>Viaturas disponíveis</dt><dd class="num">${stock.disponivel}</dd></div>
      <div><dt>Viaturas reservadas</dt><dd class="num">${stock.reservada}</dd></div>
      <div><dt>Viaturas vendidas</dt><dd class="num">${stock.vendida}</dd></div>
      <div><dt>Valor das viaturas disponíveis</dt><dd class="num">${formatarPreco(stock.valorDisponivel)}</dd></div>
      <div><dt>Pedidos de contacto novos</dt><dd class="num">${contactosNovos}</dd><a href="#contactos">Ver pedidos</a></div>
      <div><dt>Test drives pendentes</dt><dd class="num">${testDrivesPendentes}</dd><a href="#test-drives">Ver pedidos</a></div>
      <div><dt>Retomas novas</dt><dd class="num">${retomasNovas}</dd><a href="#retomas">Ver pedidos</a></div>
    </dl>`;
}
