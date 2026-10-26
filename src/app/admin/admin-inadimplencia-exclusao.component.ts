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
    <nz-alert
      *ngIf="!loading && total === 0"
      nzType="success"
      nzShowIcon
      nzMessage="Nenhum cliente com 2 ou mais mensalidades em aberto para exclusão."
      style="margin-bottom: 12px">
    </nz-alert>

    <nz-alert
      *ngIf="!loading && prazoExpiradoCount > 0"
      nzType="warning"
      nzShowIcon
      [nzMessage]="'Atenção: ' + prazoExpiradoCount + ' cliente(s) com prazo de 30 dias expirado — avaliar pagamento ou exclusão.'"
      style="margin-bottom: 12px">
    </nz-alert>

    <ng-container *ngIf="loading">
      <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 5 }"></nz-skeleton>
    </ng-container>

    <nz-table
      *ngIf="!loading && itens.length"
      [nzData]="itens"
      nzSize="small"
      nzBordered
      [nzPageSize]="10"
      [nzShowPagination]="itens.length > 10"
      [nzScroll]="{ x: '960px' }">
      <thead>
        <tr>
          <th nzWidth="100px" nzAlign="center">Codigo</th>
          <th>Razão Social</th>
          <th nzWidth="120px">Valor devido</th>
          <th nzWidth="90px" nzAlign="center">Mensalidades</th>
          <th nzWidth="160px">Situação</th>
          <th nzWidth="150px" nzAlign="center">Ação</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of itens" [class.row-expirado]="r.prazoExpirado">
          <td nzAlign="center" class="mono">{{ r.codigoPessoa }}</td>
          <td>{{ r.razao || '—' }}</td>
          <td>{{ r.valorDevido | currency:'BRL':'symbol':'1.2-2' }}</td>
          <td nzAlign="center"><nz-tag nzColor="red">{{ r.quantidadeMensalidades }}</nz-tag></td>
          <td>
            <nz-tag [nzColor]="corStatus(r.statusFluxo)">{{ labelStatus(r.statusFluxo) }}</nz-tag>
          </td>
          <td nzAlign="center">
            <button
              *ngIf="r.statusFluxo === 'Pendente'"
              nz-button
              nzType="primary"
              nzSize="small"
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
              nzType="default"
              nzSize="small"
              nzDanger
              [nzLoading]="acaoLoading === r.codigoPessoa"
              (click)="enviarAviso(r)">
              Enviar Aviso
            </button>
            <span *ngIf="r.statusFluxo === 'AvisoEnviado'" class="ok-enviado">
              <i nz-icon nzType="check-circle" nzTheme="fill" style="color:#52c41a"></i>
              Enviado {{ r.dataEnvioAviso | date:'dd/MM/yyyy' }}
            </span>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [`
    .mono { font-family: ui-monospace, monospace; font-size: 0.85rem; }
    .muted { color: rgba(0,0,0,.45); font-size: 0.82rem; }
    .row-expirado td { background: #fff7e6 !important; }
    .ok-enviado { font-size: 0.85rem; color: rgba(0,0,0,.65); }
  `]
})
export class AdminInadimplenciaExclusaoComponent implements OnInit {
  private readonly api = `${environment.apiUrl}/InadimplenciaExclusao`;

  loading = true;
  itens: LinhaInadimplencia[] = [];
  total = 0;
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
