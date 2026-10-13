import test from "node:test";
import assert from "node:assert/strict";
import { validarPedidoContacto, validarPedidoTestDrive, validarPedidoRetoma, validarViatura } from "../js/services/validacao.js";

const contactoValido = {
  nome: "Ana Silva",
  email: "ana@exemplo.pt",
  telefone: "",
  viatura_id: "",
  mensagem: "Gostava de saber mais sobre esta viatura.",
};

test("pedido de contacto válido: telefone e viatura são opcionais e ficam a null", () => {
  const { erros, dados } = validarPedidoContacto(contactoValido);
  assert.deepEqual(erros, {});
  assert.equal(dados.telefone, null);
  assert.equal(dados.viatura_id, null);
});

test("pedido de contacto inválido: indica o que está mal em cada campo", () => {
  const { erros } = validarPedidoContacto({ nome: "A", email: "sem-arroba", telefone: "abc", mensagem: "oi" });
  assert.deepEqual(Object.keys(erros).sort(), ["email", "mensagem", "nome", "telefone"]);
});

test("pedido de contacto: espaços à volta são removidos e a mensagem tem limite", () => {
  const { erros, dados } = validarPedidoContacto({ ...contactoValido, nome: "  Ana Silva  " });
  assert.deepEqual(erros, {});
  assert.equal(dados.nome, "Ana Silva");
  assert.ok(validarPedidoContacto({ ...contactoValido, mensagem: "x".repeat(2001) }).erros.mensagem);
});

const testDriveValido = {
  nome: "Rui Costa",
  email: "rui@exemplo.pt",
  telefone: "+351 912 345 678",
  viatura_id: "11111111-1111-1111-1111-111111111111",
  data_preferida: "2026-10-20",
  periodo_preferido: "tarde",
  mensagem: "",
};

test("pedido de test drive válido", () => {
  const { erros, dados } = validarPedidoTestDrive(testDriveValido, "2026-10-12");
  assert.deepEqual(erros, {});
  assert.equal(dados.mensagem, null);
  assert.equal(dados.periodo_preferido, "tarde");
});

test("test drive exige telefone e viatura", () => {
  const { erros } = validarPedidoTestDrive({ ...testDriveValido, telefone: "", viatura_id: "" }, "2026-10-12");
  assert.ok(erros.telefone);
  assert.ok(erros.viatura_id);
});

test("test drive não aceita datas passadas nem períodos desconhecidos", () => {
  const passada = validarPedidoTestDrive({ ...testDriveValido, data_preferida: "2026-10-01" }, "2026-10-12");
  assert.ok(passada.erros.data_preferida);
  const periodo = validarPedidoTestDrive({ ...testDriveValido, periodo_preferido: "noite" }, "2026-10-12");
  assert.ok(periodo.erros.periodo_preferido);
  const semData = validarPedidoTestDrive({ ...testDriveValido, data_preferida: "" }, "2026-10-12");
  assert.deepEqual(semData.erros, {});
  assert.equal(semData.dados.data_preferida, null);
});

const viaturaValida = {
  marca: "Audi",
  modelo: "A4",
  versao: "",
  ano: "2021",
  preco: "33900,50",
  quilometragem: "58000",
  combustivel: "diesel",
  caixa: "",
  cor: "",
  cilindrada_cc: "",
  potencia_cv: "163",
  descricao: "",
  equipamento: "Navegação\n\n  Faróis LED  \n",
  estado: "disponivel",
  destaque: "on",
};

test("viatura válida: converte números, aceita vírgula decimal e limpa o equipamento", () => {
  const { erros, dados } = validarViatura(viaturaValida);
  assert.deepEqual(erros, {});
  assert.equal(dados.ano, 2021);
  assert.equal(dados.preco, 33900.5);
  assert.equal(dados.cilindrada_cc, null);
  assert.equal(dados.potencia_cv, 163);
  assert.deepEqual(dados.equipamento, ["Navegação", "Faróis LED"]);
  assert.equal(dados.destaque, true);
  assert.equal(dados.caixa, null);
  assert.equal(dados.segmento, null);
  assert.equal(dados.garantia_meses, null);
  assert.equal(dados.iva_dedutivel, false);
});

test("viatura com segmento, garantia e IVA dedutível válidos", () => {
  const { erros, dados } = validarViatura({
    ...viaturaValida,
    segmento: "suv",
    garantia_meses: "24",
    iva_dedutivel: "on",
  });
  assert.deepEqual(erros, {});
  assert.equal(dados.segmento, "suv");
  assert.equal(dados.garantia_meses, 24);
  assert.equal(dados.iva_dedutivel, true);
});

test("viatura sem destaque marcado fica com destaque false", () => {
  const { destaque, ...semDestaque } = viaturaValida;
  assert.equal(validarViatura(semDestaque).dados.destaque, false);
});

test("viatura inválida: rejeita valores fora dos limites da base de dados", () => {
  const { erros } = validarViatura({
    ...viaturaValida,
    marca: "",
    ano: "1900",
    preco: "-5",
    quilometragem: "abc",
    combustivel: "vapor",
    estado: "perdida",
  });
  assert.deepEqual(Object.keys(erros).sort(), ["ano", "combustivel", "estado", "marca", "preco", "quilometragem"]);
});

const retomaValida = {
  nome: "Carlos Ferreira",
  email: "carlos@exemplo.pt",
  telefone: "912345678",
  marca_viatura: "Volkswagen",
  modelo_viatura: "Golf",
  ano_viatura: "2018",
  quilometragem_viatura: "95000",
  combustivel_viatura: "diesel",
  descricao: "Viatura em excelente estado com livro de revisões completo.",
  viatura_interesse_id: "22222222-2222-2222-2222-222222222222",
};

test("pedido de retoma válido: converte ano e km para números e aceita viatura de interesse", () => {
  const { erros, dados } = validarPedidoRetoma(retomaValida);
  assert.deepEqual(erros, {});
  assert.equal(dados.nome, "Carlos Ferreira");
  assert.equal(dados.ano_viatura, 2018);
  assert.equal(dados.quilometragem_viatura, 95000);
  assert.equal(dados.combustivel_viatura, "diesel");
  assert.equal(dados.viatura_interesse_id, "22222222-2222-2222-2222-222222222222");
  assert.equal(dados.descricao, "Viatura em excelente estado com livro de revisões completo.");
});

test("pedido de retoma válido: campos opcionais vazios ficam a null", () => {
  const { erros, dados } = validarPedidoRetoma({
    ...retomaValida,
    descricao: "  ",
    viatura_interesse_id: "",
  });
  assert.deepEqual(erros, {});
  assert.equal(dados.descricao, null);
  assert.equal(dados.viatura_interesse_id, null);
});

test("pedido de retoma inválido: exige todos os campos obrigatórios e rejeita dados incorretos", () => {
  const { erros } = validarPedidoRetoma({
    nome: "C",
    email: "invalido",
    telefone: "",
    marca_viatura: "",
    modelo_viatura: "",
    ano_viatura: "1930",
    quilometragem_viatura: "-10",
    combustivel_viatura: "gas",
    descricao: "x".repeat(2001),
    viatura_interesse_id: "nao-e-uuid",
  });
  assert.ok(erros.nome);
  assert.ok(erros.email);
  assert.ok(erros.telefone);
  assert.ok(erros.marca_viatura);
  assert.ok(erros.modelo_viatura);
  assert.ok(erros.ano_viatura);
  assert.ok(erros.quilometragem_viatura);
  assert.ok(erros.combustivel_viatura);
  assert.ok(erros.descricao);
  assert.ok(erros.viatura_interesse_id);
});

