import { SITE } from "../site-config.js";
import { montarLayout } from "../ui/layout.js";
import { esc } from "../ui/format.js";

montarLayout("");

const contentor = document.getElementById("area-privacidade");
const nome = esc(SITE.nome || "Stand Automóvel");
const emailContacto = SITE.contactos?.email ? esc(SITE.contactos.email) : "geral@stand.exemplo.pt";
const telefoneContacto = SITE.contactos?.telefone ? esc(SITE.contactos.telefone) : "+351 000 000 000";
const moradaContacto = SITE.contactos?.morada ? esc(SITE.contactos.morada) : "Portugal";

if (contentor) {
  contentor.innerHTML = `
    <h1>Política de Privacidade</h1>

    <div class="nota-provisoria" role="note">
      <strong>Texto Provisório:</strong> Esta política de privacidade é um modelo genérico e indicativo para efeitos de demonstração. Os seus termos devem ser revistos e adaptados em conformidade com as operações reais de tratamento de dados de ${nome} e a assessoria jurídica aplicável.
    </div>

    <p>A privacidade e a confidencialidade dos dados dos nossos utilizadores são valores fundamentais para ${nome}. Esta Política de Privacidade explica de que forma recolhemos, utilizamos, tratamos e protegemos os seus dados pessoais ao navegar no nosso sítio web ou ao solicitar informações e serviços relativos ao nosso catálogo de viaturas, em respeito pelo Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento (UE) 2016/679) e pela legislação portuguesa de proteção de dados pessoais.</p>

    <h2>1. Dados Pessoais Recolhidos</h2>
    <p>Os dados pessoais tratados são recolhidos diretamente junto do utilizador aquando da submissão de pedidos através dos formulários do sítio web ou mediante contactos telefónicos e por correio eletrónico:</p>
    <ul>
      <li><strong>Dados de identificação e contacto:</strong> Nome completo, endereço de correio eletrónico (email) e número de telefone;</li>
      <li><strong>Dados relativos a pedidos:</strong> Viatura de interesse, preferências de test drive (data e período pretendido) e notas ou mensagens adicionais remetidas pelo utilizador;</li>
      <li><strong>Dados de navegação técnica:</strong> Informações técnicas recolhidas automaticamente, tais como endereço IP aproximado, identificadores de dispositivo, tipo de navegador e estatísticas de utilização anónimas.</li>
    </ul>

    <h2>2. Finalidade e Licitude do Tratamento</h2>
    <p>Os seus dados pessoais são recolhidos e processados para finalidades legítimas e transparentes:</p>
    <ul>
      <li>Resposta a pedidos de esclarecimento, cotação e informação comercial geral;</li>
      <li>Organização e marcação de sessões de test drive e visitas presenciais às viaturas em parque;</li>
      <li>Elaboração de propostas preliminares de financiamento ou avaliação indicativa de retoma solicitadas pelo titular;</li>
      <li>Cumprimento de exigências legais, fiscais e regulamentares que recaiam sobre o stand;</li>
      <li>Garantia da integridade técnica, segurança e prevenção de fraudes informáticas no sítio web.</li>
    </ul>

    <h2>3. Prazo de Conservação dos Dados</h2>
    <p>Os dados pessoais são armazenados apenas durante o período necessário ao cumprimento das finalidades que motivaram a sua recolha ou pelo tempo exigido pela legislação em vigor:</p>
    <ul>
      <li><strong>Contactos e pedidos de informação:</strong> Mantidos por um período máximo de 12 meses a contar da última interação, após o qual são eliminados salvo manifestação expressa de interesse em futuras viaturas;</li>
      <li><strong>Pedidos que culminem em compra e venda:</strong> Mantidos durante o período legal obrigatório para fins fiscais e contratuais (até 10 anos);</li>
      <li><strong>Registos de segurança:</strong> Mantidos por um período não superior a 6 meses.</li>
    </ul>

    <h2>4. Direitos do Titular dos Dados</h2>
    <p>Nos termos da legislação de proteção de dados aplicável, é garantido ao titular dos dados o exercício dos seguintes direitos:</p>
    <ul>
      <li><strong>Direito de acesso:</strong> Obter confirmação dos dados tratados e aceder a uma cópia dos mesmos;</li>
      <li><strong>Direito de retificação:</strong> Solicitar a atualização ou retificação de dados incorretos ou desatualizados;</li>
      <li><strong>Direito ao apagamento («direito a ser esquecido»):</strong> Solicitar a eliminação dos seus dados quando estes deixem de ser necessários para as finalidades para as quais foram recolhidos;</li>
      <li><strong>Direito à limitação do tratamento:</strong> Requerer a suspensão temporária do tratamento em circunstâncias específicas previstas na lei;</li>
      <li><strong>Direito de oposição:</strong> Opor-se a qualquer momento ao tratamento de dados baseado no interesse legítimo;</li>
      <li><strong>Direito à portabilidade:</strong> Obter os dados num formato estruturado e legível por máquina para transmissão a outro responsável;</li>
      <li><strong>Direito de reclamação:</strong> Apresentar reclamação junto da autoridade de controlo nacional (Comissão Nacional de Proteção de Dados — CNPD, através do sítio cnpd.pt).</li>
    </ul>

    <h2>5. Cookies e Tecnologias Semelhantes</h2>
    <p>Este sítio web utiliza apenas mecanismos técnicos e de armazenamento local (como armazenamento de viaturas favoritas no navegador do utilizador) essenciais para proporcionar uma experiência fluida de navegação. Não são utilizados cookies de segmentação comportamental ou rastreadores de publicidade de terceiros sem aviso prévio e consentimento explícito.</p>

    <h2>6. Contacto do Responsável pelo Tratamento</h2>
    <p>Para exercer os seus direitos ou esclarecer qualquer questão relativa a esta Política de Privacidade, pode contactar o responsável pelo tratamento através dos seguintes canais:</p>
    <ul>
      <li><strong>Responsável:</strong> ${nome}</li>
      <li><strong>Email:</strong> ${emailContacto}</li>
      <li><strong>Telefone:</strong> ${telefoneContacto}</li>
      <li><strong>Morada:</strong> ${moradaContacto}</li>
    </ul>
  `;
}
