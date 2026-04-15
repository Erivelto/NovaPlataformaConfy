import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';

interface CobrancaItem {
  codigo: number;
  transacao: string;
  dataTransacao: string;
  dateVencimento: string;
  dataPagamento: string;
  status: string;
  valorBruto: number;
  valorLiquido: number;
  urlBoleto: string;
  codigoHash: string;
}

@Component({
  selector: 'app-mensalidade',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzButtonModule,
    NzSkeletonModule,
    PageTitleComponent
  ],
  template: `
    <div class="mensalidade">
      <app-page-title title="Mensalidade" subtitle="Acompanhe suas mensalidades e situação financeira"></app-page-title>

      <nz-card nzTitle="Mensalidades" style="margin-top:16px">
        <nz-alert
          *ngIf="erro"
          nzType="error"
          [nzMessage]="erro"
          nzShowIcon
          style="margin-bottom:12px">
        </nz-alert>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 5 }"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          [nzData]="lista"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="lista.length > 10">
          <thead>
            <tr>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Pagamento</th>
              <th nzAlign="center">Status</th>
              <th nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of lista">
              <td>{{ item.valorBruto | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ item.dateVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ item.dataPagamento | date:'dd/MM/yyyy' }}</td>
              <td nzAlign="center">
                <nz-tag [nzColor]="statusCor(item.status)">{{ statusLabel(item.status) }}</nz-tag>
              </td>
              <td nzAlign="center">
                <a *ngIf="!isPago(item.status)" nz-button nzType="default" nzSize="small" [href]="item.urlBoleto" target="_blank">
                  <i nz-icon nzType="file-text"></i> Boleto
                </a>
              </td>
            </tr>
            <tr *ngIf="lista.length === 0">
              <td colspan="5" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px 0;">
                Nenhuma mensalidade encontrada.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .mensalidade { padding: 8px 4px; }
  `]
})
export class MensalidadeComponent implements OnInit {
  private readonly apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/PessoaCobranca/ObterPagamentoTresUltimos';

  lista: CobrancaItem[] = [];
  loading = true;
  erro = '';

  private codigoPessoa = 0;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.codigoPessoa = pessoa.codigo;
    this.carregar();
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  carregar(): void {
    this.loading = true;
    this.erro = '';
    this.http.get<CobrancaItem[]>(
      `${this.apiUrl}/${this.codigoPessoa}`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        this.lista = Array.isArray(res) ? res : [res];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar as mensalidades (${err.status}). Tente novamente.`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isPago(status: string): boolean {
    return status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'settled';
  }

  statusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':       return 'Pago';
      case 'settled':    return 'Pago';
      case 'waiting':    return 'Aguardando';
      case 'unpaid':     return 'Atrasado';
      case 'canceled':   return 'Cancelando';
      case 'cancel':     return 'Cancelando';
      case 'expired':    return 'Expirado';
      case 'identified': return 'Identificado';
      default: return status ?? '-';
    }
  }

  statusCor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'settled':    return 'green';
      case 'waiting':    return 'gold';
      case 'unpaid':     return 'red';
      case 'canceled':
      case 'cancel':     return 'orange';
      case 'expired':    return 'volcano';
      case 'identified': return 'blue';
      default: return 'default';
    }
  }
}
