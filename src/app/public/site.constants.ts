export const SITE = {
  brandName: 'Contfy',
  tagline: 'Contabilidade online',
  whatsapp: '5511910473458',
  whatsappDisplay: '(11) 91047-3458',
  email: 'contato@contfy.com.br',
  emailSuporte: 'suporte@contfy.com.br',
  planoBasicoValor: 'R$ 199,90',
  copyrightYear: 2026,
} as const;

export const MEDIA = {
  logo: '/Logo.png',
  logoFooter: '/Logo.png',
  heroDecor: '/assets/site/hero-decor.png',
  heroPerson: '/assets/site/hero-person.png',
  startup: '/assets/site/startup.jpg',
  favicon: '/logoIcon.ico',
} as const;

export const TRUST_ITEMS = [
  'Atendimento em São Paulo',
  'Plataforma digital 24h',
  'Especialistas MEI e PJ',
  'Suporte humano',
] as const;

export const FUNNEL_STEPS = [
  { title: 'Escolha o serviço', desc: 'Abrir empresa ou mudar de contador' },
  { title: 'Cadastro rápido', desc: 'Formulário simples em contfy.com.br' },
  { title: 'Ativação', desc: 'Nossa equipe valida e cria seu acesso' },
  { title: 'Use a plataforma', desc: 'Login em contfy.com.br/entrar' },
] as const;

export const PLATFORM_FEATURES = [
  { title: 'Emissão de NF-e', desc: 'Solicite e acompanhe notas fiscais' },
  { title: 'Impostos e DAS', desc: 'Guias e histórico fiscal' },
  { title: 'Documentos', desc: 'Arquivos da contabilidade' },
  { title: 'Solicitações', desc: 'Canal direto com a equipe' },
  { title: 'Mensalidade', desc: 'Boletos e pagamentos online' },
  { title: 'Relatórios', desc: 'Visão clara do seu negócio' },
] as const;

export const FAQ_ITEMS = [
  {
    q: 'Como acesso a plataforma após contratar?',
    a: 'Após o cadastro, você receberá orientações por e-mail. Quando o acesso estiver liberado, entre em contfy.com.br/entrar com seu e-mail e senha.',
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
