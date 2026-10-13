/*
 * Conteúdo comercial do stand. Tudo o que aparece no site e que depende do negócio
 * (nome, textos, contactos) está aqui, para ser alterado sem mexer no restante código.
 *
 * Os valores abaixo são PROVISÓRIOS. Os contactos estão vazios de propósito:
 * só aparecem no site depois de preenchidos com dados reais.
 */
export const SITE = {
  // Nome oficial do stand
  nome: "SuperAuto Sport",

  // Frase de apresentação mostrada na página inicial
  apresentacao:
    "Automóveis de gama média-alta selecionados com garantia, transparência e acompanhamento personalizado.",

  // Imagem de fundo da página inicial (caminho ou URL). Vazio = fundo gráfico por omissão.
  heroImagem: "",

  // Blocos da secção de serviços. Remova todos para esconder a secção.
  servicos: [
    {
      titulo: "Informação completa",
      texto: "Cada viatura tem preço, quilometragem, equipamento e galeria de fotografias.",
    },
    {
      titulo: "Pesquisa à medida",
      texto: "Filtre por marca, modelo, preço, ano, combustível e quilometragem.",
    },
  ],

  // Contactos reais do stand.
  contactos: {
    telefone: "918 894 947",
    email: "geral@superautosport.pt",
    morada: "Avenida Fontes Pereira de Melo, 4100-248 Porto",
    horario: "Dias úteis: 09:30 – 13:00 | 14:30 – 19:00 · Sábado: 10:00 – 13:00 | 14:30 – 17:00",
  },

  // WhatsApp (número internacional)
  whatsapp: "351918894947",

  // Redes sociais. Campos vazios não são apresentados.
  redesSociais: {
    facebook: "",
    instagram: "",
  },

  // Serviços detalhados para a página de serviços
  servicosDetalhados: [
    {
      icone: "financiamento",
      titulo: "Financiamento",
      texto: "Soluções de financiamento à medida, com ou sem entrada. Tratamos de todo o processo.",
      ligacao: "contactos.html",
    },
    {
      icone: "garantia",
      titulo: "Garantia",
      texto: "Todas as nossas viaturas incluem garantia. Conduzir com confiança.",
    },
    {
      icone: "retoma",
      titulo: "Retoma e compra de viaturas",
      texto: "Avaliamos a sua viatura e apresentamos uma proposta justa. Rápido e sem compromisso.",
      ligacao: "retoma.html",
    },
    {
      icone: "aconselhamento",
      titulo: "Aconselhamento",
      texto: "Ajudamos a encontrar a viatura ideal para as suas necessidades e orçamento.",
      ligacao: "contactos.html",
    },
  ],

  // Página Sobre Nós (conteúdo provisório)
  sobre: {
    titulo: "Sobre nós",
    introducao: "Somos um stand automóvel dedicado à comercialização de viaturas de qualidade, com foco na transparência e na satisfação de cada cliente.",
    valores: [
      {
        titulo: "Transparência",
        texto: "Informação completa e honesta sobre cada viatura.",
      },
      {
        titulo: "Qualidade",
        texto: "Viaturas rigorosamente selecionadas e inspecionadas.",
      },
      {
        titulo: "Confiança",
        texto: "Garantia e acompanhamento após a compra.",
      },
    ],
    nota: "(Conteúdo provisório — a ser personalizado com a identidade do stand.)",
  },

  // Perguntas frequentes
  faq: [
    {
      pergunta: "As viaturas têm garantia?",
      resposta: "Sim. Todas as viaturas incluem garantia. As condições específicas dependem da viatura e serão comunicadas antes da compra.",
    },
    {
      pergunta: "Posso pedir um test drive?",
      resposta: "Sim. Pode solicitar um test drive através da nossa página de contactos. Entraremos em contacto para combinar os detalhes.",
    },
    {
      pergunta: "Aceitam retomas?",
      resposta: "Sim. Avaliamos a sua viatura e apresentamos uma proposta. Pode solicitar uma avaliação na página de retoma.",
    },
    {
      pergunta: "O financiamento é possível?",
      resposta: "Sim. Disponibilizamos soluções de financiamento à medida. Contacte-nos para saber mais.",
    },
    {
      pergunta: "Fazem entregas?",
      resposta: "As condições de entrega dependem da localização. Contacte-nos para mais informações.",
    },
  ],

  // Mapa (URL de embed do Google Maps). Vazio = mapa não aparece.
  mapaUrl: "",
};
