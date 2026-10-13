const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapa texto antes de o inserir em HTML. Usar sempre em dados que vêm da base de dados. */
export function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

const moeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const inteiro = new Intl.NumberFormat("pt-PT");

export function formatarPreco(preco) {
  return preco === null || preco === undefined ? "Preço sob consulta" : moeda.format(preco);
}

export function formatarKm(km) {
  return km === null || km === undefined ? "" : `${inteiro.format(km)} km`;
}

export const COMBUSTIVEIS = {
  gasolina: "Gasolina",
  diesel: "Diesel",
  hibrido: "Híbrido",
  hibrido_plug_in: "Híbrido plug-in",
  eletrico: "Elétrico",
  gpl: "GPL",
  outro: "Outro",
};

export const CAIXAS = {
  manual: "Manual",
  automatica: "Automática",
};

export const MARCAS_POPULARES = [
  "Abarth", "Alfa Romeo", "Alpine", "Aston Martin", "Audi", "Bentley", "BMW",
  "Citroën", "Cupra", "Dacia", "DS Automobiles", "Ferrari", "Fiat", "Ford",
  "Honda", "Hyundai", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Maserati", "Mazda", "Mercedes-Benz", "MG", "MINI", "Mitsubishi",
  "Nissan", "Opel", "Peugeot", "Polestar", "Porsche", "Renault", "SEAT",
  "Škoda", "Smart", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

export const ESTADOS = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
};

export const ESTADOS_CONTACTO = {
  novo: "Novo",
  em_tratamento: "Em tratamento",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

export const ESTADOS_TEST_DRIVE = {
  pendente: "Pendente",
  contactado: "Contactado",
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const PERIODOS = {
  indiferente: "Indiferente",
  manha: "Manhã",
  tarde: "Tarde",
};

const dataHora = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" });
const dataSimples = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" });

export function formatarDataHora(iso) {
  return iso ? dataHora.format(new Date(iso)) : "";
}

/** Formata uma data "AAAA-MM-DD" (sem fuso horário, para não mudar de dia). */
export function formatarData(data) {
  if (!data) return "";
  const [a, m, d] = String(data).split("-").map(Number);
  return dataSimples.format(new Date(a, m - 1, d));
}

export function rotulo(mapa, valor) {
  return mapa[valor] ?? valor ?? "";
}
