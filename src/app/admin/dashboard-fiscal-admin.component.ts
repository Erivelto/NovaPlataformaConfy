import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface NotaFiscal {
  codigo: number;
  codigoPessoa: number;
  dataEmissao: string;
  valorTotal: number;
  excluido: boolean;
}

interface PessoaResumo {
  codigo: number;
  razao?: string;
  nome?: string;
  documento?: string;
}

interface MesReceita {
  nome: string;
  valor: number;
  pct: number;
}

@Component({
  selector: 'app-dashboard-fiscal-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSkeletonModule, NzMessageModule, NzDividerModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <button nz-button nzType="default" (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
        <app-page-title
          title="Receitas"
          [subtitle]="nomeCliente ? nomeCliente : 'Carregando cliente...'">
        </app-page-title>
        <button nz-button nzType="default" (click)="carregar()" [nzLoading]="loading">
          <i nz-icon nzType="reload"></i> Atualizar
        </button>
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading">
        <nz-card class="chart-card" nzTitle="Sua Evolução de receita">
          <div class="chart-wrap" *ngIf="meses.length; else semDados">
            <div class="chart-bars">
              <div *ngFor="let m of meses" class="bar-col">
                <div class="bar-val">{{ m.valor | currency:'BRL':'symbol':'1.0-0' }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="m.pct"></div>
                </div>
                <div class="bar-label">{{ m.nome }}</div>
              </div>
            </div>
          </div>
          <ng-template #semDados>
            <div class="empty-chart">Nenhuma nota fiscal emitida no ano atual.</div>
          </ng-template>
        </nz-card>

        <div class="tiles-row">
          <div class="tile-card">
            <div class="tile-count">{{ receitaMesAtual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita de {{ mesAtualNome }}</div>
          </div>
          <div class="tile-card green">
            <div class="tile-count">{{ receitaAnual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita total {{ anoAtual }}</div>
          </div>
          <div class="tile-card blue">
            <div class="tile-count">{{ receitaAnoAnterior | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita total {{ anoAtual - 1 }}</div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 8px 12px 40px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
    }
    .page-header app-page-title { flex: 1; min-width: 200px; }

    .chart-card { margin-bottom: 16px; }
    .chart-wrap { padding: 8px 4px 0; overflow-x: auto; }
    .chart-bars {
      display: flex; align-items: flex-end; gap: 10px;
      min-height: 280px; padding: 0 4px 4px;
    }
    .bar-col {
      flex: 1; min-width: 52px; max-width: 90px;
      display: flex; flex-direction: column; align-items: center;
    }
    .bar-val {
      font-size: .68rem; color: rgba(0,0,0,.55);
      margin-bottom: 6px; text-align: center; line-height: 1.2;
      min-height: 28px;
    }
    .bar-track {
      width: 100%; height: 200px; background: #f5f5f5;
      border-radius: 4px 4px 0 0; display: flex; align-items: flex-end;
      border: 1px solid #f0f0f0;
    }
    .bar-fill {
      width: 100%; background: linear-gradient(180deg, #52c41a 0%, #389e0d 100%);
      border-radius: 4px 4px 0 0; min-height: 2px;
      transition: height .4s ease;
    }
    .bar-label {
      margin-top: 8px; font-size: .72rem; color: rgba(0,0,0,.55);
      text-align: center; white-space: nowrap;
    }
    .empty-chart {
      text-align: center; padding: 48px 16px;
      color: rgba(0,0,0,.35); font-style: italic;
    }

    .tiles-row {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
    }
    @media (max-width: 900px) { .tiles-row { grid-template-columns: 1fr; } }

    .tile-card {
      background: #fff; border-radius: 8px; padding: 22px 24px;
      border-left: 4px solid #d9d9d9;
      box-shadow: 0 1px 6px rgba(0,0,0,.07);
    }
    .tile-card.green { border-left-color: #52c41a; }
    .tile-card.blue  { border-left-color: #1890ff; }
    .tile-count { font-size: 1.6rem; font-weight: 800; line-height: 1.2; }
    .tile-label { font-size: .85rem; color: rgba(0,0,0,.45); margin-top: 6px; }
  `]
})
export class DashboardFiscalAdminComponent implements OnInit {
  private readonly api = environment.apiUrl;

  pessoaCodigo = 0;
  nomeCliente = '';
  loading = true;

  mesAtualNome = '';
  anoAtual = new Date().getFullYear();
  receitaMesAtual = 0;
  receitaAnual = 0;
  receitaAnoAnterior = 0;
  meses: MesReceita[] = [];

  private readonly nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const culture = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
    this.mesAtualNome = culture.format(new Date());
    this.mesAtualNome = this.mesAtualNome.charAt(0).toUpperCase() + this.mesAtualNome.slice(1);

    this.route.paramMap.subscribe(params => {
      const id = +(params.get('pessoaCodigo') || 0);
      const qId = +(this.route.snapshot.queryParamMap.get('pessoaCodigo') || 0);
      this.pessoaCodigo = id || qId;
      if (!this.pessoaCodigo) {
        this.message.error('Cliente não informado.');
        this.router.navigate(['/administrativo/clientes']);
        return;
      }
      this.carregar();
    });
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    forkJoin({
      notas: this.http.get<NotaFiscal[]>(`${this.api}/NotaFiscal/CodigoPessoa/${this.pessoaCodigo}`, { headers: this.h })
        .pipe(timeout(20000), catchError(() => of([] as NotaFiscal[]))),
      pessoa: this.http.get<PessoaResumo>(`${this.api}/Pessoa/${this.pessoaCodigo}`, { headers: this.h })
        .pipe(timeout(10000), catchError(() => of(null)))
    }).subscribe(({ notas, pessoa }) => {
      this.nomeCliente = pessoa?.razao || pessoa?.nome || `Cliente #${this.pessoaCodigo}`;
      this.calcularReceitas(notas || []);
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private calcularReceitas(notas: NotaFiscal[]): void {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const ativas = notas.filter(n => n.excluido !== true && n.dataEmissao);
    const parseData = (d: string) => new Date(d);

    const soma = (lista: NotaFiscal[]) => lista.reduce((t, n) => t + (n.valorTotal || 0), 0);

    this.receitaMesAtual = soma(ativas.filter(n => {
      const dt = parseData(n.dataEmissao);
      return dt.getFullYear() === ano && dt.getMonth() + 1 === mesAtual;
    }));

    this.receitaAnual = soma(ativas.filter(n => parseData(n.dataEmissao).getFullYear() === ano));
    this.receitaAnoAnterior = soma(ativas.filter(n => parseData(n.dataEmissao).getFullYear() === ano - 1));

    const valoresMes = this.nomesMes.map((nome, i) => {
      const valor = soma(ativas.filter(n => {
        const dt = parseData(n.dataEmissao);
        return dt.getFullYear() === ano && dt.getMonth() === i;
      }));
      return { nome, valor, pct: 0 };
    });

    const max = Math.max(...valoresMes.map(m => m.valor), 1);
    this.meses = valoresMes.map(m => ({ ...m, pct: Math.round((m.valor / max) * 100) }));
  }

  voltar(): void {
    if (history.length > 1) {
      history.back();
    } else {
      this.router.navigate(['/administrativo/cliente', this.pessoaCodigo, 'editar']);
    }
  }
}
