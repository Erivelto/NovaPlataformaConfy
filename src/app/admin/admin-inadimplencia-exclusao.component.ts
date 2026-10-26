import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../environments/environment';

interface LinhaInadimplencia {
  codigoPessoa: number;
  documento: string;
  razao: string;
  valorDevido: number;
  quantidadeMensalidades: number;
  statusFluxo: string;
  dataAprovacao?: string;
  usuarioAprovacao?: string;
  dataEnvioAviso?: string;
  usuarioEnvio?: string;
  dataLimiteRegularizacao?: string;
  prazoExpirado: boolean;
  diasRestantesPrazo?: number;
}

interface ListaResponse {
  itens: LinhaInadimplencia[];
  total: number;
  prazoExpirado: number;
  podeAprovar: boolean;
}

@Component({
  selector: 'app-admin-inadimplencia-exclusao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzTableModule, NzButtonModule, NzTagModule, NzIconModule,
    NzSkeletonModule, NzAlertModule, NzToolTipModule, NzMessageModule
  ],
  template: `
    <section *ngIf="loading || total > 0" class="inadimp-hero" [class.inadimp-hero--loading]="loading">
      <header class="inadimp-hero__head">
        <div class="inadimp-hero__icon-wrap">
          <i nz-icon nzType="warning" nzTheme="fill"></i>
        </div>
        <div class="inadimp-hero__titles">
          <h2 class="inadimp-hero__title">Ação urgente — inadimplência (2+ mensalidades)</h2>
          <p class="inadimp-hero__sub">
            Mesma base de <strong>Devedores Geral</strong>. Gilvan aprova; depois qualquer analista envia aviso de 30 dias (e-mail e WhatsApp).
          </p>
        </div>
        <div *ngIf="!loading && total > 0" class="inadimp-hero__stats">
          <span class="inadimp-stat inadimp-stat--clientes">
            <span class="inadimp-stat__n">{{ total }}</span>
            <span class="inadimp-stat__l">cliente(s)</span>
          </span>
          <span class="inadimp-stat inadimp-stat--valor">
            <span class="inadimp-stat__n">{{ valorTotal | currency:'BRL':'symbol':'1.0-0' }}</span>
            <span class="inadimp-stat__l">em aberto</span>
          </span>
        </div>
      </header>

      <nz-alert
        *ngIf="!loading && prazoExpiradoCount > 0"
        nzType="error"
        nzShowIcon
        class="inadimp-alert"
        [nzMessage]="prazoExpiradoCount + ' cliente(s) com prazo de 30 dias expirado — regularizar pagamento ou excluir.'">
      </nz-alert>

      <div *ngIf="loading" class="inadimp-loading">
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 4 }"></nz-skeleton>
      </div>

      <div *ngIf="!loading && itens.length" class="inadimp-table-wrap">
        <nz-table
          [nzData]="itens"
          nzSize="middle"
          [nzPageSize]="10"
          [nzShowPagination]="itens.length > 10"
          [nzScroll]="{ x: '960px' }"
          class="inadimp-table">
          <thead>
            <tr>
              <th nzWidth="100px" nzAlign="center">Codigo</th>
              <th>Razão Social</th>
              <th nzWidth="130px">Valor devido</th>
              <th nzWidth="100px" nzAlign="center">Mensalidades</th>
              <th nzWidth="170px">Situação</th>
              <th nzWidth="160px" nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of itens" [class.row-expirado]="r.prazoExpirado" [class.row-pendente]="r.statusFluxo === 'Pendente'">
              <td nzAlign="center" class="mono codigo-cell">{{ r.codigoPessoa }}</td>
              <td class="razao-cell">{{ r.razao || '—' }}</td>
              <td class="valor-cell">{{ r.valorDevido | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center"><nz-tag class="tag-mensal" nzColor="error">{{ r.quantidadeMensalidades }}</nz-tag></td>
              <td>
                <nz-tag [nzColor]="corStatus(r.statusFluxo)">{{ labelStatus(r.statusFluxo) }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button
                  *ngIf="r.statusFluxo === 'Pendente'"
                  nz-button
                  nzType="primary"
                  nzSize="small"
                  class="btn-aprovar"
                  [disabled]="!podeAprovar || acaoLoading === r.codigoPessoa"
                  [nzLoading]="acaoLoading === r.codigoPessoa"
                  nz-tooltip
                  [nzTooltipTitle]="podeAprovar ? 'Aprovar exclusão por inadimplência' : 'Somente gilvan@contfy.com pode aprovar'"
                  (click)="aprovar(r)">
                  Aprovar
                </button>
                <button
                  *ngIf="r.statusFluxo === 'Aprovado'"
                  nz-button
                  nzType="primary"
                  nzDanger
                  nzSize="small"
                  [nzLoading]="acaoLoading === r.codigoPessoa"
                  (click)="enviarAviso(r)">
                  Enviar Aviso
                </button>
                <span *ngIf="r.statusFluxo === 'AvisoEnviado'" class="ok-enviado">
                  <i nz-icon nzType="check-circle" nzTheme="fill"></i>
                  Enviado {{ r.dataEnvioAviso | date:'dd/MM/yyyy' }}
                </span>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .inadimp-hero {
      border-radius: 14px;
      overflow: hidden;
      border: 2px solid #ff4d4f;
      background: linear-gradient(165deg, #fff1f0 0%, #fff 38%, #fff5f5 100%);
      box-shadow: 0 8px 28px rgba(207, 19, 34, 0.18), 0 0 0 1px rgba(255, 77, 79, 0.12);
      animation: inadimp-pulse 2.8s ease-in-out infinite;
    }

    @keyframes inadimp-pulse {
      0%, 100% { box-shadow: 0 8px 28px rgba(207, 19, 34, 0.18), 0 0 0 1px rgba(255, 77, 79, 0.12); }
      50% { box-shadow: 0 10px 32px rgba(207, 19, 34, 0.28), 0 0 0 3px rgba(255, 77, 79, 0.22); }
    }

    .inadimp-hero--loading { animation: none; }

    .inadimp-hero__head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 14px 20px;
      padding: 18px 20px 14px;
      background: linear-gradient(90deg, #cf1322, #ff4d4f 55%, #ff7875);
      color: #fff;
    }

    .inadimp-hero__icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }

    .inadimp-hero__titles { flex: 1; min-width: 200px; }

    .inadimp-hero__title {
      margin: 0 0 6px;
      font-size: 1.12rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }

    .inadimp-hero__sub {
      margin: 0;
      font-size: 0.84rem;
      line-height: 1.45;
      opacity: 0.95;
    }

    .inadimp-hero__sub strong { font-weight: 700; }

    .inadimp-hero__stats {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }

    .inadimp-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 88px;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.95);
      color: #cf1322;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .inadimp-stat__n { font-size: 1.15rem; font-weight: 800; line-height: 1.2; }
    .inadimp-stat__l { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; }

    .inadimp-alert { margin: 12px 16px 0; border-radius: 8px; }

    .inadimp-loading { padding: 16px 20px 20px; }

    .inadimp-table-wrap {
      padding: 12px 16px 16px;
    }

    :host ::ng-deep .inadimp-table .ant-table-thead > tr > th {
      background: #820014 !important;
      color: #fff !important;
      font-weight: 700;
      border-bottom: none !important;
    }

    :host ::ng-deep .inadimp-table .ant-table-tbody > tr > td {
      border-color: #ffccc7;
    }

    :host ::ng-deep .inadimp-table .ant-table-tbody > tr:hover > td {
      background: #fff2f0 !important;
    }

    .mono { font-family: ui-monospace, monospace; font-weight: 700; }
    .codigo-cell { color: #cf1322; font-size: 0.95rem; }
    .razao-cell { font-weight: 600; }
    .valor-cell { font-weight: 700; color: #a8071a; }

    .row-expirado td { background: #fff7e6 !important; }
    .row-pendente td { background: #fffbe6 !important; }

    .ok-enviado { font-size: 0.85rem; color: #389e0d; font-weight: 600; }
    .ok-enviado i { margin-right: 4px; }

    :host ::ng-deep .btn-aprovar:not([disabled]) {
      background: #cf1322;
      border-color: #cf1322;
    }

    :host ::ng-deep .tag-mensal.ant-tag { font-weight: 700; font-size: 0.9rem; }
  `]
})
export class AdminInadimplenciaExclusaoComponent implements OnInit {
  private readonly api = `${environment.apiUrl}/InadimplenciaExclusao`;

  loading = true;
  itens: LinhaInadimplencia[] = [];
  total = 0;
  valorTotal = 0;
  prazoExpiradoCount = 0;
  podeAprovar = false;
  acaoLoading = 0;

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.get<ListaResponse>(this.api, { headers: this.h })
      .pipe(timeout(60000), catchError(() => of(null)))
      .subscribe(res => {
        if (!res) {
          this.message.error('Erro ao carregar inadimplência para exclusão.');
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.itens = res.itens || [];
        this.total = res.total ?? this.itens.length;
        this.valorTotal = this.itens.reduce((s, x) => s + Number(x.valorDevido || 0), 0);
        this.prazoExpiradoCount = res.prazoExpirado ?? 0;
        this.podeAprovar = !!res.podeAprovar;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  aprovar(r: LinhaInadimplencia): void {
    this.acaoLoading = r.codigoPessoa;
    this.cdr.markForCheck();
    this.http.post<LinhaInadimplencia>(`${this.api}/${r.codigoPessoa}/Aprovar`, {}, { headers: this.h })
      .pipe(catchError(err => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.error);
        this.message.error(msg || 'Falha ao aprovar.');
        return of(null);
      }))
      .subscribe(linha => {
        this.acaoLoading = 0;
        if (linha) {
          this.atualizarLinha(linha);
          this.message.success('Aprovado. Agora qualquer analista pode enviar o aviso.');
        }
        this.cdr.markForCheck();
      });
  }

  enviarAviso(r: LinhaInadimplencia): void {
    this.acaoLoading = r.codigoPessoa;
    this.cdr.markForCheck();
    this.http.post<any>(`${this.api}/${r.codigoPessoa}/EnviarAviso`, {}, { headers: this.h })
      .pipe(catchError(err => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.error);
        this.message.error(msg || 'Falha ao enviar aviso.');
        return of(null);
      }))
      .subscribe(res => {
        this.acaoLoading = 0;
        if (res) {
          const linha = res.linha ?? res;
          this.atualizarLinha(linha);
          if (res.aviso) this.message.warning(res.aviso);
          else this.message.success('Aviso enfileirado (e-mail e WhatsApp). Prazo de 30 dias registrado.');
          this.carregar();
        }
        this.cdr.markForCheck();
      });
  }

  private atualizarLinha(linha: LinhaInadimplencia): void {
    const i = this.itens.findIndex(x => x.codigoPessoa === linha.codigoPessoa);
    if (i >= 0) this.itens[i] = { ...this.itens[i], ...linha };
    this.valorTotal = this.itens.reduce((s, x) => s + Number(x.valorDevido || 0), 0);
  }

  labelStatus(s: string): string {
    switch (s) {
      case 'Aprovado': return 'Aprovado';
      case 'AvisoEnviado': return 'Aviso enviado';
      default: return 'Aguardando aprovação';
    }
  }

  corStatus(s: string): string {
    switch (s) {
      case 'Aprovado': return 'blue';
      case 'AvisoEnviado': return 'green';
      default: return 'gold';
    }
  }
}
