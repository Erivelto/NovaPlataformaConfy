import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PageTitleComponent } from '../page-title.component';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

interface NotaFiscal {
  numeroNFE: number;
  dataEmissao: string;
  cancelada?: boolean;
  dataCancelamento?: string | null;
  valorTotal?: number;
  valor?: string | number;
  tomador?: string;
  descricao?: string;
}

@Component({
  selector: 'app-notas-fiscais',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzModalModule,
    NzSkeletonModule, NzDividerModule, NzButtonModule,
    PageTitleComponent
  ],
  template: `
    <div class="notas-fiscais">
      <app-page-title title="Notas Fiscais" subtitle="Consulte suas notas fiscais emitidas"></app-page-title>

      <nz-card>
        <nz-alert
          *ngIf="erro"
          nzType="error"
          [nzMessage]="erro"
          nzShowIcon
          style="margin-bottom:12px">
        </nz-alert>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 6 }"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          [nzData]="notas"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="notas.length > 10"
          [nzPageSize]="10">
          <thead>
            <tr>
              <th nzWidth="120px">Nº da Nota</th>
              <th nzWidth="140px">Data de Emissão</th>
              <th>Valor</th>
              <th nzWidth="140px">Status</th>
              <th nzWidth="80px"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of notas" [class.row-cancelada]="item.cancelada">
              <td>{{ item.numeroNFE }}</td>
              <td>{{ item.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valor) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="item.cancelada ? 'red' : 'green'">
                  {{ item.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
              <td>
                <button nz-button nzSize="small" (click)="verDetalhe(item)">
                  <i nz-icon nzType="eye"></i> Ver
                </button>
              </td>
            </tr>
            <tr *ngIf="notas.length === 0">
              <td colspan="5" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px">
                Nenhuma nota fiscal encontrada.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Modal de detalhe -->
    <nz-modal
      [(nzVisible)]="detalheVisible"
      nzTitle="Detalhes da Nota Fiscal"
      [nzWidth]="620"
      [nzFooter]="null"
      (nzOnCancel)="detalheVisible = false">
      <ng-container *nzModalContent>
        <ng-container *ngIf="notaSelecionada">
          <div class="detalhe-grid">
            <div class="detalhe-row">
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="number"></i> Nº da Nota</label>
                <div class="detalhe-value">{{ notaSelecionada.numeroNFE }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="calendar"></i> Data de Emissão</label>
                <div class="detalhe-value">{{ notaSelecionada.dataEmissao | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="dollar"></i> Valor</label>
                <div class="detalhe-value">{{ parseBrl(notaSelecionada.valor) | currency:'BRL':'symbol':'1.2-2' }}</div>
              </div>
            </div>
            <div class="detalhe-row">
              <div class="detalhe-field" style="flex:0 0 auto">
                <label class="detalhe-label"><i nz-icon nzType="info-circle"></i> Status</label>
                <div class="detalhe-value">
                  <nz-tag [nzColor]="notaSelecionada.cancelada ? 'red' : 'green'">
                    {{ notaSelecionada.cancelada ? 'Cancelada' : 'Emitida' }}
                  </nz-tag>
                </div>
              </div>
              <div class="detalhe-field" style="flex:2">
                <label class="detalhe-label"><i nz-icon nzType="user"></i> Tomador</label>
                <div class="detalhe-value">{{ notaSelecionada.tomador || '—' }}</div>
              </div>
            </div>
            <nz-divider></nz-divider>
            <div class="detalhe-field">
              <label class="detalhe-label"><i nz-icon nzType="file-text"></i> Descrição dos Serviços</label>
              <div class="detalhe-value detalhe-descricao">{{ notaSelecionada.descricao || '—' }}</div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .notas-fiscais { padding: 8px 4px; }
    .row-cancelada td { color: #cf1322 !important; }

    /* Detalhe */
    .detalhe-grid { display: flex; flex-direction: column; gap: 16px; }
    .detalhe-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .detalhe-field { flex: 1; min-width: 140px; }
    .detalhe-label { display: block; font-weight: 600; color: rgba(0,0,0,0.55); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .4px; }
    .detalhe-value {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      padding: 6px 10px;
      color: rgba(0,0,0,0.85);
      min-height: 34px;
    }
    .detalhe-descricao { white-space: pre-wrap; min-height: 80px; }
  `]
})
export class NotasFiscaisComponent implements OnInit {
  private readonly apiBase = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api';

  loading = true;
  erro = '';
  notas: NotaFiscal[] = [];

  detalheVisible = false;
  notaSelecionada: NotaFiscal | null = null;

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
    this.http.get<NotaFiscal[]>(`${this.apiBase}/CorpoEmissaoNota/NotasFiscais/${this.codigoPessoa}`, { headers: this.headers }).subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        this.notas = raw.map((n: any) => ({
          ...n,
          cancelada: n.cancelada ?? !!n.dataCancelamento,
          valor: n.valorTotal ?? n.valor ?? 0
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar notas fiscais (${err.status}). Tente novamente.`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }

  verDetalhe(nota: NotaFiscal): void {
    this.notaSelecionada = nota;
    this.detalheVisible = true;
  }
}
