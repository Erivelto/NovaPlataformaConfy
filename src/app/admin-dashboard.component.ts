import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { PageTitleComponent } from './page-title.component';
import { LoginService } from './services/login.service';
import { environment } from '../environments/environment';

interface PessoaResumo {
  codigo: number;
  documento?: string;
  razao?: string;
  nome?: string;
  dataInclusao?: string;
  fisica?: boolean | number;
  excluido?: boolean;
}

interface PessoaCobranca {
  reference?: string;
  transacao?: string;
  status?: string;
  valorBruto?: number;
  dateVencimento?: string;
}

interface PessoaAssinatura {
  codigoPessoa: number;
  status?: string;
}

interface ChamadoResumo {
  id: number;
  status: string;
  mensagem?: string;
}

interface StatusAgendamento {
  execusao?: number;
  erro?: number;
  sucesso?: number;
  aguardando?: number;
}

interface DashboardKpi {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
  link?: string;
  loading?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, NzCardModule, NzGridModule, NzIconModule,
    NzSkeletonModule, PageTitleComponent
  ],
  template: `
    <div class="admin-dashboard">
      <app-page-title title="Painel Administrativo" subtitle="Indicadores operacionais da plataforma Contfy"></app-page-title>

      <div class="admin-banner">
        <i nz-icon nzType="crown" nzTheme="fill" class="banner-icon"></i>
        <div>
          <div class="banner-title">Área Administrativa</div>
          <div class="banner-sub">Bem-vindo, {{ adminName }}. Visão consolidada de clientes, cobrança e atendimento.</div>
        </div>
      </div>

      <div class="kpis-grid">
        <nz-card
          *ngFor="let k of kpis; trackBy: trackByKpi"
          class="kpi-card"
          nzBordered
          [class.clickable]="!!k.link"
          (click)="k.link && irPara(k.link)">
          <div class="kpi-icon"><i nz-icon [nzType]="k.icon" [style.color]="k.color"></i></div>
          <div class="kpi-label">{{ k.label }}</div>
          <ng-container *ngIf="loading">
            <nz-skeleton [nzActive]="true" [nzTitle]="{ width: '72px' }" [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </ng-container>
          <div class="kpi-value" [style.color]="k.color" *ngIf="!loading">{{ k.value }}</div>
          <div class="kpi-sub" *ngIf="k.sub && !loading">{{ k.sub }}</div>
        </nz-card>
      </div>
    </div>
  `,
  styles: [
    `.admin-dashboard { padding: 8px 4px; }`,
    `.admin-banner { display: flex; align-items: center; gap: 16px; padding: 18px 24px; margin: 14px 0 16px; background: linear-gradient(135deg, #fffbe6, #fff7cc); border: 1.5px solid #faad14; border-radius: 12px; box-shadow: 0 4px 16px rgba(250, 173, 20, .15); }`,
    `.banner-icon { font-size: 36px; color: #faad14; flex-shrink: 0; }`,
    `.banner-title { font-weight: 800; font-size: 1.05rem; color: #d48806; margin-bottom: 4px; }`,
    `.banner-sub { color: rgba(0, 0, 0, 0.55); font-size: 0.875rem; }`,
    `.kpis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }`,
    `.kpi-card { text-align: center; transition: box-shadow .15s ease, transform .15s ease; }`,
    `.kpi-card.clickable { cursor: pointer; }`,
    `.kpi-card.clickable:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, .1); transform: translateY(-1px); }`,
    `.kpi-icon { font-size: 24px; margin-bottom: 8px; }`,
    `.kpi-label { color: rgba(0, 0, 0, 0.45); font-size: 0.88rem; min-height: 2.4em; }`,
    `.kpi-value { font-size: 1.5rem; font-weight: 800; margin-top: 6px; line-height: 1.2; }`,
    `.kpi-sub { color: rgba(0, 0, 0, 0.35); font-size: 0.78rem; margin-top: 4px; }`
  ]
})
export class DashboardAdminComponent implements OnInit {
  private readonly api = environment.apiUrl;

  adminName = 'Admin';
  loading = true;
  kpis: DashboardKpi[] = [];

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private loginService: LoginService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    if (!usuario || !usuario.isAdmin) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.adminName = usuario.email?.split('@')[0] || usuario.nome || 'Admin';
    this.inicializarKpis();
    this.carregar();
  }

  trackByKpi = (_: number, k: DashboardKpi) => k.label;

  irPara(path: string): void {
    this.router.navigate([path]);
  }

  private inicializarKpis(): void {
    this.kpis = [
      { label: 'Clientes Novos', value: '—', icon: 'user-add', color: '#1890ff', sub: 'Online · Física', link: '/administrativo/clientes' },
      { label: 'Quantidade de Clientes', value: '—', icon: 'team', color: '#52c41a', sub: 'Online · Física', link: '/administrativo/clientes' },
      { label: 'Ticket Médio Faturamento', value: '—', icon: 'dollar', color: '#722ed1', sub: 'mensalidades pagas no mês' },
      { label: 'Chamados Abertos sem Interação', value: '—', icon: 'message', color: '#fa8c16', sub: 'status novo', link: '/administrativo/solicitacoes' },
      { label: 'Certificados Vencidos', value: '—', icon: 'safety-certificate', color: '#ff4d4f', sub: 'certificados digitais', link: '/administrativo/clientes' },
      { label: 'Agendamento NFE Pendente', value: '—', icon: 'schedule', color: '#eb2f96', sub: 'aguardando, executando ou erro' },
      { label: 'Devedores Mês Atual', value: '—', icon: 'warning', color: '#ff4d4f', sub: 'valor em débito no mês', link: '/administrativo/devedores' },
      { label: 'Devedores Geral', value: '—', icon: 'alert', color: '#cf1322', sub: 'valor total em débito', link: '/administrativo/devedores-anterior' }
    ];
  }

  private carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const safe = <T>(obs: ReturnType<HttpClient['get']>) =>
      obs.pipe(timeout(15000), catchError(() => of(null as T | null)));

    forkJoin({
      status: safe<PessoaResumo[]>(this.http.get<PessoaResumo[]>(`${this.api}/Pessoa/Status`, { headers: this.headers })),
      assinaturas: safe<PessoaAssinatura[]>(this.http.get<PessoaAssinatura[]>(`${this.api}/PessoaAssinatura/PessoaAssinatura`, { headers: this.headers })),
      cobrancas: safe<PessoaCobranca[]>(this.http.get<PessoaCobranca[]>(`${this.api}/PessoaCobranca`, { headers: this.headers })),
      chamados: safe<ChamadoResumo[]>(this.http.get<ChamadoResumo[]>(`${this.api}/Chamado`, { headers: this.headers })),
      agendamento: safe<StatusAgendamento>(this.http.get<StatusAgendamento>(`${this.api}/CorpoEmissaoNota/RetornaStatusAgendamento`, { headers: this.headers })),
      devedoresMes: safe<PessoaCobranca[]>(this.http.get<PessoaCobranca[]>(`${this.api}/PessoaCobranca/ObterPagamentoVencidoMesAtual`, { headers: this.headers })),
      devedoresGeral: safe<PessoaCobranca[]>(this.http.get<PessoaCobranca[]>(`${this.api}/PessoaCobranca/ObterPagamentoVencido`, { headers: this.headers })),
      pessoas: safe<PessoaResumo[]>(this.http.get<PessoaResumo[]>(`${this.api}/Pessoa`, { headers: this.headers })),
      certificados: safe<number>(this.http.get<number>(`${this.api}/Pessoa/CertificadosVencidos/Contagem`, { headers: this.headers }))
    }).subscribe({
      next: (res) => {
        const todasPessoas = ((res.status as PessoaResumo[] | null) || []).filter(p => !p.excluido);
        const clientesOnline = todasPessoas.filter(p => this.isOnline(p));
        const clientesFisica = todasPessoas.filter(p => this.isFisica(p));
        const cobrancas = (res.cobrancas as PessoaCobranca[] | null) || [];
        const assinaturas = (res.assinaturas as PessoaAssinatura[] | null) || [];
        const chamados = ((res.chamados as ChamadoResumo[] | null) || []).filter(c => !c.mensagem?.includes('[Solicitação excluída pelo cliente]'));

        const refsCobranca = new Set(cobrancas.filter(c => c.reference).map(c => this.normDoc(c.reference!)));
        const pessoasComAssinatura = new Set(assinaturas.filter(a => a.status === 'Ativo').map(a => a.codigoPessoa));

        const isClienteNovo = (p: PessoaResumo) => {
          const doc = this.normDoc(p.documento || '');
          const semCobranca = !doc || !refsCobranca.has(doc);
          const semAssinatura = !pessoasComAssinatura.has(p.codigo);
          return semCobranca && semAssinatura;
        };

        const novosOnline = clientesOnline.filter(isClienteNovo).length;
        const novosFisica = clientesFisica.filter(isClienteNovo).length;
        const totalNovos = novosOnline + novosFisica;
        const qtdOnline = clientesOnline.length;
        const qtdFisica = clientesFisica.length;
        const totalClientes = qtdOnline + qtdFisica;

        const ticketMedio = this.calcularTicketMedio(cobrancas);
        const chamadosSemInteracao = chamados.filter(c => c.status === 'N').length;
        const ag = res.agendamento as StatusAgendamento | null;
        const agendamentoPendente = (ag?.aguardando || 0) + (ag?.execusao || 0) + (ag?.erro || 0);
        const listaDevedoresMes = (res.devedoresMes as PessoaCobranca[] | null) || [];
        const listaDevedoresGeral = (res.devedoresGeral as PessoaCobranca[] | null) || [];
        const pessoas = (res.pessoas as PessoaResumo[] | null) || [];
        const valorDevidoMes = this.calcularValorDevido(listaDevedoresMes);
        const devedoresGeralResumo = this.calcularDevedoresGeralAnterior(listaDevedoresGeral, pessoas);
        const clientesDevedoresMes = this.contarDevedores(listaDevedoresMes);

        this.kpis = [
          { label: 'Clientes Novos', value: totalNovos, icon: 'user-add', color: '#1890ff', sub: `Online: ${novosOnline} · Física: ${novosFisica}`, link: '/administrativo/clientes' },
          { label: 'Quantidade de Clientes', value: totalClientes, icon: 'team', color: '#52c41a', sub: `Online: ${qtdOnline} · Física: ${qtdFisica}`, link: '/administrativo/clientes' },
          { label: 'Ticket Médio Faturamento', value: this.fmtMoeda(ticketMedio), icon: 'dollar', color: '#722ed1', sub: 'mensalidades pagas no mês' },
          { label: 'Chamados Abertos sem Interação', value: chamadosSemInteracao, icon: 'message', color: '#fa8c16', sub: 'status novo', link: '/administrativo/solicitacoes' },
          { label: 'Certificados Vencidos', value: (res.certificados as number | null) ?? 0, icon: 'safety-certificate', color: '#ff4d4f', sub: 'certificados digitais', link: '/administrativo/clientes' },
          { label: 'Agendamento NFE Pendente', value: agendamentoPendente, icon: 'schedule', color: '#eb2f96', sub: 'aguardando, executando ou erro' },
          { label: 'Devedores Mês Atual', value: this.fmtMoeda(valorDevidoMes), icon: 'warning', color: '#ff4d4f', sub: `${clientesDevedoresMes} cliente(s) · ${listaDevedoresMes.length} débito(s)`, link: '/administrativo/devedores' },
          { label: 'Devedores Geral', value: this.fmtMoeda(devedoresGeralResumo.valor), icon: 'alert', color: '#cf1322', sub: `${devedoresGeralResumo.clientes} cliente(s) · ${devedoresGeralResumo.debitos} débito(s)`, link: '/administrativo/devedores-anterior' }
        ];

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private calcularTicketMedio(cobrancas: PessoaCobranca[]): number {
    const agora = new Date();
    const mes = agora.getMonth();
    const ano = agora.getFullYear();
    const pagas = cobrancas.filter(c => {
      if (!c.transacao?.trim()) return false;
      const st = (c.status || '').toLowerCase();
      if (st !== 'paga' && st !== 'paid') return false;
      const venc = c.dateVencimento ? new Date(c.dateVencimento) : null;
      if (!venc || isNaN(venc.getTime())) return false;
      return venc.getMonth() === mes && venc.getFullYear() === ano;
    });
    if (!pagas.length) return 0;
    const total = pagas.reduce((s, c) => s + Number(c.valorBruto || 0), 0);
    return total / pagas.length;
  }

  private calcularValorDevido(lista: PessoaCobranca[]): number {
    return lista.reduce((s, d) => s + Number(d.valorBruto || 0), 0);
  }

  /** Mesma regra da página devedores-anterior: join com Pessoa e só clientes com 2+ débitos. */
  private calcularDevedoresGeralAnterior(
    cobrancas: PessoaCobranca[],
    pessoas: PessoaResumo[]
  ): { valor: number; clientes: number; debitos: number } {
    const pm = new Map<string, PessoaResumo>();
    pessoas.forEach(p => { if (p.documento) pm.set(p.documento, p); });

    const grupos = new Map<number, { valorTotal: number; qtdDebitos: number }>();
    for (const c of cobrancas) {
      const pessoa = pm.get(c.reference || '');
      if (!pessoa?.codigo) continue;
      const grupo = grupos.get(pessoa.codigo) || { valorTotal: 0, qtdDebitos: 0 };
      grupo.valorTotal += Number(c.valorBruto || 0);
      grupo.qtdDebitos++;
      grupos.set(pessoa.codigo, grupo);
    }

    const elegiveis = [...grupos.values()].filter(g => g.qtdDebitos > 1);
    return {
      valor: elegiveis.reduce((s, g) => s + g.valorTotal, 0),
      clientes: elegiveis.length,
      debitos: elegiveis.reduce((s, g) => s + g.qtdDebitos, 0)
    };
  }

  private contarDevedores(lista: PessoaCobranca[]): number {
    const refs = new Set<string>();
    lista.forEach(d => {
      const ref = this.normDoc(d.reference || '');
      if (ref) refs.add(ref);
    });
    return refs.size || lista.length;
  }

  private isFisica(p: PessoaResumo): boolean {
    const f = p.fisica as boolean | number | undefined;
    return f === true || f === 1;
  }

  private isOnline(p: PessoaResumo): boolean {
    return !this.isFisica(p);
  }

  private normDoc(doc: string): string {
    return (doc || '').replace(/\D/g, '');
  }

  private fmtMoeda(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
