import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { NovaSolicitacaoNfeComponent } from '../components/nova-solicitacao-nfe.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtCurrency, fmtDate } from '../utils/excel-export.helpers';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

interface EmissaoNfe {
  Codigo?: number;
  codigo?: number;
  Descricao?: string;
  descricao?: string;
  DataPrimeiraEmissao?: string;
  dataPrimeiraEmissao?: string;
  Valor?: any;
  valor?: any;
  repetir?: boolean;
  CodigoEmissaoNota?: number;
  codigoEmissaoNota?: number;
  Status?: string;
  status?: string;
  CodigoPessoa?: number;
  codigoPessoa?: number;
}

interface NfeRow {
  codigo: number;
  descricao: string;
  data: string;
  valor: number;
  repetir: boolean;
  codigoEmissaoNota: number;
  status: string;
  executado: boolean;
}

@Component({
  selector: 'app-solicitacao-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule, NzTableModule, NzButtonModule, NzTagModule,
    NzAlertModule, NzIconModule, NzPopconfirmModule,
    NzSkeletonModule,
    PageTitleComponent, ExportExcelButtonComponent, NovaSolicitacaoNfeComponent
  ],
  providers: [NzMessageService],
  template: `
    <div class="sol-nfe">
      <app-page-title title="Solicitação Emissão NFe" subtitle="Gerencie suas solicitações de emissão de notas fiscais"></app-page-title>

      <nz-alert
        nzType="warning"
        nzMessage="Atenção!"
        nzDescription="As solicitações são executadas de tempos em tempos, assim que sua nota for gerada você será avisado por nossos canais."
        nzShowIcon
        style="margin-bottom:16px">
      </nz-alert>

      <nz-card>
        <div style="margin-bottom:16px;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">
          <app-export-excel-button [data]="$any(rows)" [columns]="exportColumns" fileName="solicitacao-nfe" />
          <app-nova-solicitacao-nfe
            [codigoPessoa]="codigoPessoa"
            buttonLabel="Nova Solicitação"
            (criada)="carregar()" />
        </div>

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
          [nzData]="rows"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="rows.length > 5"
          [nzPageSize]="5">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Valor</th>
              <th>Nº da Nota</th>
              <th>Status</th>
              <th style="width:100px"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of rows; trackBy: trackByRow">
              <td>{{ item.codigo }}</td>
              <td>{{ item.descricao }}</td>
              <td>{{ item.data | date:'dd/MM/yyyy' }}</td>
              <td>{{ item.valor | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ item.codigoEmissaoNota || '-' }}</td>
              <td>
                <nz-tag [nzColor]="item.executado ? 'green' : 'orange'">
                  {{ item.executado ? 'Executado com Sucesso' : 'Aguardando execução' }}
                </nz-tag>
              </td>
              <td>
                <button
                  *ngIf="item.status === 'C'"
                  nz-button nzType="primary" nzDanger nzSize="small"
                  nz-popconfirm nzPopconfirmTitle="Confirmar exclusão?"
                  (nzOnConfirm)="excluir(item.codigo)">
                  <i nz-icon nzType="delete"></i> Excluir
                </button>
              </td>
            </tr>
            <tr *ngIf="rows.length === 0">
              <td colspan="7" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px">
                Nenhuma solicitação encontrada. Clique em "Nova Solicitação" para criar.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .sol-nfe { padding: 8px 4px; }
  `]
})
export class SolicitacaoNfeComponent implements OnInit {
  private readonly apiBase = environment.apiUrl;

  loading = true;
  erro = '';
  lista: EmissaoNfe[] = [];
  rows: NfeRow[] = [];

  readonly exportColumns: ExcelExportColumn<NfeRow>[] = [
    { key: 'codigo', title: 'Código' },
    { key: 'descricao', title: 'Descrição' },
    { key: 'data', title: 'Data', format: fmtDate },
    { key: 'valor', title: 'Valor', format: fmtCurrency },
    { key: 'codigoEmissaoNota', title: 'Nº da Nota', format: v => (v ? String(v) : '-') },
    { key: 'executado', title: 'Status', format: v => v ? 'Executado com Sucesso' : 'Aguardando execução' }
  ];

  codigoPessoa = 0;

  constructor(private http: HttpClient, private loginService: LoginService, private msg: NzMessageService, private router: Router, private cdr: ChangeDetectorRef) {}

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
    this.http.get<EmissaoNfe[]>(`${this.apiBase}/CorpoEmissaoNota/Agendamento/${this.codigoPessoa}`, { headers: this.headers }).subscribe({
      next: (data) => {
        const arr: EmissaoNfe[] = Array.isArray(data) ? data : [];
        const sorted = arr.sort((a, b) => (b.Codigo ?? b.codigo ?? 0) - (a.Codigo ?? a.codigo ?? 0));
        this.lista = sorted;
        this.rows = sorted.map(i => ({
          codigo: i.Codigo ?? i.codigo ?? 0,
          descricao: i.Descricao ?? i.descricao ?? '',
          data: i.DataPrimeiraEmissao ?? i.dataPrimeiraEmissao ?? '',
          valor: this.parseBrl(i.Valor ?? i.valor),
          repetir: i.repetir ?? false,
          codigoEmissaoNota: i.CodigoEmissaoNota ?? i.codigoEmissaoNota ?? 0,
          status: i.Status ?? i.status ?? '',
          executado: (i.CodigoEmissaoNota ?? i.codigoEmissaoNota ?? 0) !== 0
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar solicitações (${err.status}). Tente novamente.`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  trackByRow(_index: number, item: NfeRow): number { return item.codigo; }

  private parseBrl(value: any): number {
    if (value == null) return 0;
    const str = String(value);
    if (str.includes(',')) {
      // BRL format: "1.250,00"
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(str) || 0;
  }

  excluir(codigo: number): void {
    this.http.delete(`${this.apiBase}/CorpoEmissaoNota/${codigo}`, { headers: this.headers }).subscribe({
      next: () => {
        this.msg.success('Solicitação excluída com sucesso!');
        this.rows = this.rows.filter(i => i.codigo !== codigo);
        this.lista = this.lista.filter(i => (i.Codigo ?? i.codigo) !== codigo);
        this.cdr.markForCheck();
      },
      error: () => {
        this.msg.error('Erro ao excluir solicitação.');
      }
    });
  }
}
