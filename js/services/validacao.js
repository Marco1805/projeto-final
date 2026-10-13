const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TELEFONE = /^[+\d][\d\s().-]{5,29}$/;

function texto(valor) {
  return String(valor ?? "").trim();
}

function validarBase(dados, erros, { telefoneObrigatorio }) {
  const nome = texto(dados.nome);
  if (nome.length < 2 || nome.length > 120) erros.nome = "Indique o seu nome (entre 2 e 120 carateres).";

  const email = texto(dados.email);
  if (!EMAIL.test(email) || email.length > 254) erros.email = "Indique um email válido.";

  const telefone = texto(dados.telefone);
  if (!telefone && telefoneObrigatorio) erros.telefone = "Indique um número de telefone para o contactarmos.";
  else if (telefone && !TELEFONE.test(telefone)) erros.telefone = "Indique um telefone válido (6 a 30 carateres, só números e + ( ) . -).";
}

const UUID_PADRAO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida um pedido de contacto. Devolve { erros, dados }: "dados" já está limpo e pronto a enviar. */
export function validarPedidoContacto(entrada) {
  const erros = {};
  validarBase(entrada, erros, { telefoneObrigatorio: false });

  const mensagem = texto(entrada.mensagem);
  if (mensagem.length < 5 || mensagem.length > 2000) erros.mensagem = "Escreva uma mensagem com 5 a 2000 carateres.";

  const viaturaIdBruto = texto(entrada.viatura_id);
  const dados = {
    viatura_id: UUID_PADRAO.test(viaturaIdBruto) ? viaturaIdBruto : null,
    nome: texto(entrada.nome),
    email: texto(entrada.email),
    telefone: texto(entrada.telefone) || null,
    mensagem,
  };
  return { erros, dados };
}

/** Valida um pedido de test drive. "hoje" (AAAA-MM-DD) existe para facilitar os testes. */
export function validarPedidoTestDrive(entrada, hoje = new Date().toISOString().slice(0, 10)) {
  const erros = {};
  validarBase(entrada, erros, { telefoneObrigatorio: true });

  const viaturaIdBruto = texto(entrada.viatura_id);
  if (!UUID_PADRAO.test(viaturaIdBruto)) {
    erros.viatura_id = "Escolha a viatura que pretende experimentar.";
  }

  const data = texto(entrada.data_preferida);
  if (data && (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data < hoje)) {
    erros.data_preferida = "Escolha uma data a partir de hoje.";
  }

  const periodo = texto(entrada.periodo_preferido) || "indiferente";
  if (!["manha", "tarde", "indiferente"].includes(periodo)) erros.periodo_preferido = "Escolha um período válido.";

  const mensagem = texto(entrada.mensagem);
  if (mensagem.length > 2000) erros.mensagem = "A mensagem pode ter no máximo 2000 carateres.";

  const dados = {
    viatura_id: UUID_PADRAO.test(viaturaIdBruto) ? viaturaIdBruto : null,
    nome: texto(entrada.nome),
    email: texto(entrada.email),
    telefone: texto(entrada.telefone),
    data_preferida: data || null,
    periodo_preferido: periodo,
    mensagem: mensagem || null,
  };
  return { erros, dados };
}

/** Valida os dados de uma viatura na área de administração. */
export function validarViatura(entrada) {
  const erros = {};
  const obrigatorio = (campo, mensagem, max) => {
    const v = texto(entrada[campo]);
    if (!v || v.length > max) erros[campo] = mensagem;
    return v;
  };
  const inteiro = (campo, mensagem, min, max, { opcional = false } = {}) => {
    const bruto = texto(entrada[campo]);
    if (!bruto && opcional) return null;
    const n = Number(bruto);
    if (!bruto || !Number.isInteger(n) || n < min || n > max) {
      erros[campo] = mensagem;
      return null;
    }
    return n;
  };

  const marca = obrigatorio("marca", "Indique a marca (até 60 carateres).", 60);
  const modelo = obrigatorio("modelo", "Indique o modelo (até 80 carateres).", 80);
  const ano = inteiro("ano", "Indique um ano entre 1950 e 2100.", 1950, 2100);
  const quilometragem = inteiro("quilometragem", "Indique a quilometragem (0 ou mais).", 0, 5_000_000);
  const cilindrada = inteiro("cilindrada_cc", "A cilindrada tem de ser um número positivo.", 1, 20000, { opcional: true });
  const potencia = inteiro("potencia_cv", "A potência tem de ser um número positivo.", 1, 5000, { opcional: true });

  const precoBruto = texto(entrada.preco).replace(",", ".");
  const preco = Number(precoBruto);
  if (!precoBruto || !Number.isFinite(preco) || preco < 0 || preco > 99_999_999) {
    erros.preco = "Indique um preço válido (0 ou mais).";
  }

  if (texto(entrada.versao).length > 120) erros.versao = "A versão pode ter no máximo 120 carateres.";
  if (texto(entrada.cor).length > 40) erros.cor = "A cor pode ter no máximo 40 carateres.";
  if (texto(entrada.descricao).length > 5000) erros.descricao = "A descrição pode ter no máximo 5000 carateres.";

  const combustiveis = ["gasolina", "diesel", "hibrido", "hibrido_plug_in", "eletrico", "gpl", "outro"];
  if (!combustiveis.includes(texto(entrada.combustivel))) erros.combustivel = "Escolha o combustível.";
  if (texto(entrada.caixa) && !["manual", "automatica"].includes(texto(entrada.caixa))) erros.caixa = "Escolha uma caixa válida.";
  if (!["disponivel", "reservada", "vendida"].includes(texto(entrada.estado))) erros.estado = "Escolha o estado.";

  const segmento = texto(entrada.segmento);
  const segmentosValidos = ["citadino", "sedan", "carrinha", "suv", "coupe", "cabrio", "monovolume", "utilitario", "outro"];
  if (segmento && !segmentosValidos.includes(segmento)) erros.segmento = "Escolha um segmento válido.";

  const garantia = numeroInteiro(entrada.garantia_meses, { minimo: 0, maximo: 120 });
  if (texto(entrada.garantia_meses) && garantia === null) erros.garantia_meses = "Indique um número de meses de garantia válido (0 a 120).";

  const equipamento = String(entrada.equipamento ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 60);

  const dados = {
    marca,
    modelo,
    versao: texto(entrada.versao) || null,
    ano,
    preco,
    quilometragem,
    combustivel: texto(entrada.combustivel),
    caixa: texto(entrada.caixa) || null,
    cor: texto(entrada.cor) || null,
    cilindrada_cc: cilindrada,
    potencia_cv: potencia,
    segmento: segmento || null,
    garantia_meses: garantia,
    iva_dedutivel: Boolean(entrada.iva_dedutivel),
    descricao: texto(entrada.descricao) || null,
    equipamento,
    estado: texto(entrada.estado),
    destaque: Boolean(entrada.destaque),
  };
  return { erros, dados };
}

/** Valida um pedido de retoma/avaliação de viatura. Devolve { erros, dados }. */
export function validarPedidoRetoma(entrada) {
  const erros = {};
  validarBase(entrada, erros, { telefoneObrigatorio: true });

  const marcaViatura = texto(entrada.marca_viatura);
  if (!marcaViatura || marcaViatura.length > 60) {
    erros.marca_viatura = "Indique a marca da viatura (até 60 carateres).";
  }

  const modeloViatura = texto(entrada.modelo_viatura);
  if (!modeloViatura || modeloViatura.length > 80) {
    erros.modelo_viatura = "Indique o modelo da viatura (até 80 carateres).";
  }

  const anoBruto = texto(entrada.ano_viatura);
  const anoNum = Number(anoBruto);
  if (!anoBruto || !Number.isInteger(anoNum) || anoNum < 1950 || anoNum > 2100) {
    erros.ano_viatura = "Indique um ano entre 1950 e 2100.";
  }

  const kmBruto = texto(entrada.quilometragem_viatura);
  const kmNum = Number(kmBruto);
  if (!kmBruto || !Number.isInteger(kmNum) || kmNum < 0) {
    erros.quilometragem_viatura = "Indique a quilometragem (0 ou mais).";
  }

  const combustiveis = ["gasolina", "diesel", "hibrido", "hibrido_plug_in", "eletrico", "gpl", "outro"];
  const combustivelViatura = texto(entrada.combustivel_viatura);
  if (!combustiveis.includes(combustivelViatura)) {
    erros.combustivel_viatura = "Escolha o combustível da viatura.";
  }

  const descricao = texto(entrada.descricao);
  if (descricao.length > 2000) {
    erros.descricao = "A descrição pode ter no máximo 2000 carateres.";
  }

  const viaturaInteresseId = texto(entrada.viatura_interesse_id);
  if (viaturaInteresseId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(viaturaInteresseId)) {
    erros.viatura_interesse_id = "Escolha uma viatura válida.";
  }

  const dados = {
    nome: texto(entrada.nome),
    email: texto(entrada.email),
    telefone: texto(entrada.telefone),
    marca_viatura: marcaViatura,
    modelo_viatura: modeloViatura,
    ano_viatura: Number.isInteger(anoNum) ? anoNum : null,
    quilometragem_viatura: Number.isInteger(kmNum) ? kmNum : null,
    combustivel_viatura: combustivelViatura,
    descricao: descricao || null,
    viatura_interesse_id: viaturaInteresseId || null,
  };

  return { erros, dados };
}

