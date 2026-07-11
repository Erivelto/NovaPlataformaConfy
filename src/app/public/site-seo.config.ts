import { FAQ_ITEMS, SITE } from './site.constants';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_DESCRIPTION =
  'Abra sua empresa, mude de contador e gerencie NF-e, impostos e documentos na plataforma digital Contfy. Contabilidade online com suporte humano.';

function homeJsonLd(baseUrl: string): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'AccountingService',
      name: SITE.brandName,
      url: baseUrl,
      logo: `${baseUrl}/Logo.png`,
      image: `${baseUrl}/assets/site/hero-person.png`,
      telephone: `+${SITE.whatsapp}`,
      email: SITE.email,
      areaServed: { '@type': 'Country', name: 'Brasil' },
      description: DEFAULT_DESCRIPTION,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.brandName,
      url: baseUrl,
      inLanguage: 'pt-BR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}

export function getSeoForPath(path: string, baseUrl: string): PageSeo {
  const normalized = path.split('?')[0].split('#')[0] || '/';
  const cleanBase = baseUrl.replace(/\/$/, '');

  const pages: Record<string, PageSeo> = {
    '/': {
      title: 'Contfy — Contabilidade Online',
      description: DEFAULT_DESCRIPTION,
      path: '/',
      image: '/assets/site/hero-person.png',
      jsonLd: homeJsonLd(cleanBase),
    },
    '/planos': {
      title: 'Planos e serviços de contabilidade',
      description:
        'Conheça os planos Contfy: abertura de empresa, mudança de contador e plano básico a partir de R$ 199,90/mês para Simples Nacional.',
      path: '/planos',
    },
    '/abrir-empresa': {
      title: 'Abrir minha empresa',
      description:
        'Solicite a abertura da sua empresa com a Contfy. Processo online, suporte especializado e acompanhamento em todas as etapas.',
      path: '/abrir-empresa',
    },
    '/mudar-contador': {
      title: 'Mudar de contador',
      description:
        'Troque de contador com segurança para a Contfy. Transição no Simples Nacional com onboarding e acesso à plataforma digital.',
      path: '/mudar-contador',
    },
    '/contato': {
      title: 'Contato',
      description:
        `Fale com a Contfy por WhatsApp ${SITE.whatsappDisplay}, e-mail ${SITE.email} ou acesse a plataforma digital.`,
      path: '/contato',
    },
    '/contratar/sucesso': {
      title: 'Cadastro recebido',
      description: 'Recebemos sua solicitação. Em breve a equipe Contfy entrará em contato.',
      path: '/contratar/sucesso',
      noindex: true,
    },
  };

  return pages[normalized] ?? {
    title: 'Contfy — Contabilidade Online',
    description: DEFAULT_DESCRIPTION,
    path: normalized,
  };
}
