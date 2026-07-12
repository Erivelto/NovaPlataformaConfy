export const SITE = {
  brandName: 'Contfy',
  tagline: 'Contabilidade online',
  whatsapp: '5511910473458',
  whatsappDisplay: '(11) 91047-3458',
  email: 'contato@contfy.com.br',
  emailSuporte: 'suporte@contfy.com.br',
  planoBasicoValor: 'R$ 199,90',
  copyrightYear: 2026,
  /** URL de embed (YouTube/Vimeo). Vazio exibe poster até o vídeo ser publicado. */
  platformDemoVideoEmbedUrl: 'https://www.youtube.com/embed/_ikACNWyU94',
} as const;

export const MEDIA = {
  logo: '/Logo.png',
  logoMark: '/assets/site/favicon.png',
  logoFooter: '/Logo.png',
  heroDecor: '/assets/site/hero-decor.png',
  heroPerson: '/assets/site/hero-person.png',
  startup: '/assets/site/startup.jpg',
  favicon: '/logoIcon.ico',
} as const;

export const TRUST_ITEMS = [
  'Atendimento em várias regiões',
  'Plataforma Online 24h',
  'Especialistas em Simples Nacional',
  'Suporte Humano (Seg a Sex)',
] as const;

export const FUNNEL_STEPS = [
  { title: 'Escolha o serviço', desc: 'Abrir empresa ou mudar de contador' },
  { title: 'Cadastro rápido', desc: 'Formulário simples em contfy.com.br' },
  { title: 'Ativação', desc: 'Nossa equipe valida e cria seu acesso' },
  { title: 'Use a plataforma', desc: 'Acesso liberado após análise — login em contabilcontfy.com.br' },
] as const;

export const PLATFORM_FEATURES = [
  { title: 'Emissão de NF-e', desc: 'Solicite e acompanhe a emissão das notas fiscais' },
  { title: 'Impostos e Guias', desc: 'Guias e histórico fiscal, administração de dívidas e parcelamento' },
  { title: 'Documentos', desc: 'Na plataforma são armazenados arquivos da sua empresa para seu acesso!' },
  { title: 'Solicitações', desc: 'Direto na plataforma ou Canal direto com a equipe' },
  { title: 'Mensalidade', desc: 'Será via Boletos ou link de pagamentos online' },
  { title: 'Dashboard', desc: 'Visão clara geral de como sua empresa está!' },
] as const;

export interface ProcessoFluxoStep {
  title: string;
  intro?: string;
  items: readonly string[];
}

export const ABERTURA_EMPRESA_FLUXO: readonly ProcessoFluxoStep[] = [
  {
    title: 'Planejamento e Definição Inicial',
    intro: 'Antes de preencher qualquer documento, defina a estrutura básica do negócio:',
    items: [
      'Modelo de negócios: atividade principal e secundárias (CNAE)',
      'Porte da empresa: MEI (faturamento até R$ 81 mil/ano), ME (até R$ 360 mil/ano) ou EPP (até R$ 4,8 milhões/ano)',
      'Regime jurídico: SLU (Sociedade Limitada Unipessoal), Sociedade Limitada (com sócios), entre outros',
      'Regime tributário: Simples Nacional, Lucro Presumido ou Lucro Real',
    ],
  },
  {
    title: 'Consulta de Viabilidade',
    intro: 'Realizada online pelo portal da Junta Comercial do seu Estado (integrado à Redesim):',
    items: [
      'Viabilidade de endereço: avalia se a prefeitura permite a atividade no local escolhido',
      'Viabilidade de nome: verifica se já existe empresa com nome idêntico ou muito parecido',
    ],
  },
  {
    title: 'Coleta de Dados e Registro (DBE)',
    intro: 'Após a aprovação da viabilidade, inicia-se a fase de registro:',
    items: [
      'Preenchimento do DBE: criação do Documento Básico de Entrada no site da Receita Federal',
      'Contrato Social: elaboração das regras da empresa (capital social, cotas e deveres dos sócios)',
      'Protocolo na Junta Comercial: envio digital do contrato assinado eletronicamente (via Gov.br)',
      'Emissão do CNPJ: com o deferimento da Junta, o número do CNPJ é gerado automaticamente',
    ],
  },
  {
    title: 'Inscrições Fiscais',
    intro: 'Para operar legalmente e emitir notas fiscais:',
    items: [
      'Inscrição Municipal: obrigatória para todas as empresas (feita na Prefeitura)',
      'Inscrição Estadual: obrigatória para comércio, indústria e transporte intermunicipal/interestadual (Secretaria de Fazenda do Estado)',
    ],
  },
  {
    title: 'Certificado Digital e Emissão de Notas',
    items: [
      'Certificado Digital (e-CNPJ): necessário para assinar documentos digitais e acessar sistemas do governo',
      'Credenciamento para notas fiscais: liberação nos sistemas da Prefeitura (serviços) ou do Estado (comércio) para começar a faturar',
    ],
  },
] as const;

export const MUDAR_CONTADOR_FLUXO: readonly ProcessoFluxoStep[] = [
  {
    title: 'Notificação de Rescisão',
    intro: 'Comunique formalmente o escritório atual sobre a decisão:',
    items: [
      'Formalização por escrito: envie e-mail ou notificação com aviso de recebimento (AR)',
      'Solicitação de distrato: peça a elaboração do Termo de Rescisão do Contrato de Prestação de Serviços',
    ],
  },
  {
    title: 'Transição de Documentos (Termo de Transferência)',
    intro: 'Os contadores interagem para transferir a responsabilidade técnica e o histórico da empresa:',
    items: [
      'Obrigações do antigo contador: emissão do Termo de Transferência de Responsabilidade Técnica',
      'Envio de arquivos: livros contábeis, balancetes, histórico de funcionários e declarações transmitidas (SPED, DCTF, DEFIS, etc.)',
    ],
  },
  {
    title: 'Alteração da Responsabilidade Técnica',
    intro: 'O novo contador assume formalmente a empresa perante o governo:',
    items: [
      'Junta Comercial e Receita: atualização do cadastro com o CRC do novo profissional',
      'Prefeitura e Estado: vinculação do novo contador nos sistemas de nota fiscal e órgãos fiscais',
    ],
  },
  {
    title: 'Auditoria de Entrada (Check-up)',
    intro: 'O novo escritório faz uma varredura para garantir que a empresa está regular:',
    items: [
      'Situação fiscal: emissão de certidões negativas de débitos (CND) federais, estaduais e municipais',
      'Conferência de pendências: verificação de guias em aberto ou obrigações acessórias não transmitidas',
    ],
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: 'Como acesso a plataforma após contratar?',
    a: 'Após o cadastro, você receberá orientações por e-mail. Quando o acesso estiver liberado, entre em contabilcontfy.com.br/entrar com seu e-mail e senha.',
  },
  {
    q: 'Quanto tempo leva a abertura de empresa?',
    a: 'O prazo varia conforme a prefeitura e documentação. Nossa equipe acompanha cada etapa e mantém você informado pela plataforma e WhatsApp.',
  },
  {
    q: 'Posso trocar de contador estando no Simples Nacional?',
    a: 'Sim. A Contfy cuida da transição com segurança, incluindo a comunicação com o contador anterior quando necessário.',
  },
] as const;
