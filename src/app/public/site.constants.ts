export const SITE = {
  brandName: 'Contfy',
  tagline: 'Contabilidade online',
  whatsapp: '5511910473458',
  whatsappDisplay: '(11) 91047-3458',
  email: 'contato@contfy.com.br',
  atendimentoHorario: 'Segunda a sexta, em horário comercial',
  planoBasicoValor: 'R$ 199,90',
  copyrightYear: 2026,
  /** URL de embed (YouTube/Vimeo). Vazio exibe poster até o vídeo ser publicado. */
  platformDemoVideoEmbedUrl: 'https://www.youtube.com/embed/L3MGj3J8c88',
} as const;

/** Configuração do envio de WhatsApp para leads do site (api/PessoaAplicativo). */
export const LEAD_WHATSAPP = {
  codigoPessoa: 138,
  nomeDestinatario: 'Contfy',
  numeroDestinatario: '5511962626537',
  numeroRemetente: '5511996100268',
} as const;

export const HERO_COPY = {
  headline: 'Simplifique a contabilidade da sua empresa',
  lead:
    'Abra sua empresa, troque de contador e gerencie NF-e, impostos e documentos em uma plataforma digital — com acompanhamento de especialistas em Simples Nacional.',
  support:
    'Você solicita o serviço online, nossa equipe analisa seu perfil e, com o acesso liberado, passa a usar a plataforma Contfy com suporte por WhatsApp, telefone e e-mail.',
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
  {
    title: 'Escolha o serviço',
    desc: 'Defina se deseja abrir empresa ou mudar de contador. Cada fluxo tem etapas e documentos específicos.',
  },
  {
    title: 'Cadastro rápido',
    desc: 'Preencha o formulário em poucos minutos. Nossa equipe recebe sua solicitação e entra em contato para orientar os próximos passos.',
  },
  {
    title: 'Análise e ativação',
    desc: 'Validamos se o serviço se encaixa no perfil da sua empresa e conduzimos abertura ou transição com acompanhamento próximo.',
  },
  {
    title: 'Use a plataforma',
    desc: 'Com acesso liberado, você gerencia solicitações, documentos e rotinas contábeis em contabilcontfy.com.br.',
  },
] as const;

export const WHY_CONTFY = [
  {
    icon: 'desktop',
    title: 'Contabilidade digital de verdade',
    desc: 'NF-e, impostos, documentos e solicitações em um só lugar — disponível online, quando você precisar.',
  },
  {
    icon: 'customer-service',
    title: 'Suporte humano no processo',
    desc: 'Não é só software: você fala com a equipe Contfy por WhatsApp, telefone e e-mail em cada fase do atendimento.',
  },
  {
    icon: 'file',
    title: 'Processo transparente',
    desc: 'Fluxos claros de abertura e mudança de contador, com orientação documental e acompanhamento das etapas legais e fiscais.',
  },
  {
    icon: 'pie-chart',
    title: 'Foco em Simples Nacional',
    desc: 'Especialistas em empresas de serviços no Simples, com rotina pensada para quem quer menos burocracia e mais clareza.',
  },
] as const;

export const PLATFORM_FEATURES = [
  {
    title: 'Emissão de NF-e',
    desc: 'Solicite e acompanhe a emissão das notas fiscais sem depender de múltiplos canais de comunicação.',
  },
  {
    title: 'Impostos e Guias',
    desc: 'Consulte guias, histórico fiscal e acompanhe dívidas e parcelamentos com mais organização.',
  },
  {
    title: 'Documentos',
    desc: 'Arquivos da sua empresa centralizados na plataforma para consulta e envio quando precisar.',
  },
  {
    title: 'Solicitações',
    desc: 'Abra demandas direto na plataforma ou fale com a equipe pelos canais de atendimento.',
  },
  {
    title: 'Mensalidade',
    desc: 'Pagamento via boleto ou link online, com rotina financeira integrada ao seu dia a dia.',
  },
  {
    title: 'Dashboard',
    desc: 'Visão geral da situação da empresa para acompanhar pendências e rotinas com mais clareza.',
  },
] as const;

export interface PlanCard {
  id: string;
  title: string;
  badge?: string;
  featured?: boolean;
  price?: string;
  priceSuffix?: string;
  description: string;
  benefits: readonly string[];
  ctaLabel: string;
  ctaLink: string;
  ctaType: 'primary' | 'default';
}

export const PLAN_CARDS: readonly PlanCard[] = [
  {
    id: 'abertura',
    title: 'Abertura de empresa',
    description: 'Constituição com suporte completo, do planejamento inicial ao credenciamento para emitir notas.',
    benefits: [
      'Orientação sobre CNAE, porte e regime tributário',
      'Acompanhamento na viabilidade e registro',
      'Suporte nas inscrições municipal e estadual',
      'Orientação sobre certificado digital',
    ],
    ctaLabel: 'Solicitar abertura',
    ctaLink: '/abrir-empresa',
    ctaType: 'default',
  },
  {
    id: 'basico',
    title: 'Plano Básico',
    badge: 'Mais popular',
    featured: true,
    price: 'R$ 199,90',
    priceSuffix: '/mês',
    description: 'Contabilidade digital para empresa de serviços no Simples Nacional.',
    benefits: [
      'Até 2 sócios, sem funcionário',
      'Plataforma online 24h',
      'Emissão de NF-e e gestão de impostos',
      'Suporte por WhatsApp, telefone e e-mail',
    ],
    ctaLabel: 'Contratar agora',
    ctaLink: '/mudar-contador',
    ctaType: 'primary',
  },
  {
    id: 'mudanca',
    title: 'Mudança de contador',
    description: 'Transição segura para a Contfy, com condução da rescisão, transferência e regularização fiscal.',
    benefits: [
      'Comunicação e distrato com contador anterior',
      'Transferência de responsabilidade técnica',
      'Check-up fiscal de entrada',
      'Onboarding na plataforma digital',
    ],
    ctaLabel: 'Mudar de contador',
    ctaLink: '/mudar-contador',
    ctaType: 'default',
  },
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
    a: 'O prazo varia conforme a prefeitura, a Junta Comercial e a documentação enviada. Nossa equipe acompanha cada etapa e mantém você informado pela plataforma e WhatsApp.',
  },
  {
    q: 'Posso trocar de contador estando no Simples Nacional?',
    a: 'Sim. A Contfy cuida da transição com segurança, incluindo a comunicação com o contador anterior e a transferência da responsabilidade técnica quando necessário.',
  },
  {
    q: 'Preciso ter CNPJ para solicitar abertura de empresa?',
    a: 'Não. No fluxo de abertura você informa seus dados de contato e nossa equipe orienta cada fase até a emissão do CNPJ.',
  },
  {
    q: 'Quais documentos são solicitados na abertura?',
    a: 'Durante o processo podem ser necessários IPTU do endereço, CNH ou RG, certificado digital, razão social, descrição das atividades e dados de contato. A equipe solicita cada item na hora certa.',
  },
  {
    q: 'O que preciso para mudar de contador?',
    a: 'Em geral: CNH ou RG, certificado digital e senhas de acesso aos portais estadual e municipal. A Contfy conduz a rescisão, a transferência e o check-up fiscal de entrada.',
  },
  {
    q: 'Como funciona o suporte da Contfy?',
    a: 'Você pode abrir solicitações na plataforma ou falar com a equipe por WhatsApp, telefone e e-mail, de segunda a sexta em horário comercial.',
  },
  {
    q: 'A plataforma funciona no celular?',
    a: 'Sim. O site institucional e a plataforma foram pensados para uso em desktop e dispositivos móveis.',
  },
  {
    q: 'Como é feito o pagamento da mensalidade?',
    a: 'A mensalidade pode ser paga via boleto ou link de pagamento online, conforme orientação da equipe Contfy.',
  },
  {
    q: 'O que acontece depois que envio o formulário?',
    a: 'Recebemos sua solicitação, analisamos se o serviço é adequado ao perfil da empresa e entramos em contato para dar sequência ao processo de abertura ou mudança de contador.',
  },
  {
    q: 'Preciso assistir à demonstração antes de contratar?',
    a: 'Recomendamos conhecer a plataforma em /plataforma para entender os recursos. O cadastro na plataforma é liberado pela equipe após análise do seu caso.',
  },
  {
    q: 'O Plano Básico atende empresas com funcionário?',
    a: 'O Plano Básico é indicado para empresa de serviços no Simples Nacional, com até 2 sócios e sem funcionário. Para outros perfis, fale com a equipe para avaliarmos a melhor opção.',
  },
] as const;
