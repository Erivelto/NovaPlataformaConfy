import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { LoginService } from '../services/login.service';
import { ArquivoService } from '../services/arquivo.service';
import { environment } from '../../environments/environment';
import { catchError, of, timeout } from 'rxjs';

interface PessoaUpload {
  codigo: number;
  codigoPessoa: number;
  tipo: string;
  arquivo: string;
  dataCriacao?: string;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule,
    NzTableModule,
    NzTagModule,
    NzAlertModule,
    NzIconModule,
    NzSkeletonModule,
    NzButtonModule,
    PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="documentos">
      <app-page-title title="Documentos Empresa" subtitle="Consulte os documentos anexados à sua conta"></app-page-title>

      <nz-card [nzExtra]="exportTpl">
        <ng-template #exportTpl>
          <app-export-excel-button [data]="$any(documentos)" [columns]="exportColumns" fileName="documentos-empresa" />
        </ng-template>
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
          [nzData]="documentos"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="documentos.length > 10"
          [nzPageSize]="10">
          <thead>
            <tr>
              <th nzWidth="80px">Código</th>
              <th>Tipo</th>
              <th nzWidth="160px" nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of documentos">
              <td>{{ d.codigo }}</td>
              <td><nz-tag>{{ d.tipo }}</nz-tag></td>
              <td nzAlign="center">
                <button nz-button nzType="link" nzSize="small" (click)="abrirDocumento(d)">
                  <i nz-icon nzType="download"></i> Baixar
                </button>
              </td>
            </tr>
            <tr *ngIf="documentos.length === 0">
              <td colspan="3" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">
                Nenhum documento anexado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .documentos { padding: 8px 4px; }
  `]
})
export class DocumentosComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  erro = '';
  documentos: PessoaUpload[] = [];

  readonly exportColumns: ExcelExportColumn<PessoaUpload>[] = [
    { key: 'codigo', title: 'Código' },
    { key: 'tipo', title: 'Tipo' }
  ];

  private codigoPessoa = 0;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private arquivoService: ArquivoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
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

    this.http.get<any[]>(`${this.api}/PessoaUpload/ObterPorCodigo/${this.codigoPessoa}`, { headers: this.headers })
      .pipe(timeout(10000), catchError(() => of(null)))
      .subscribe(lista => {
        if (lista === null) {
          this.erro = 'Erro ao carregar documentos. Tente novamente.';
          this.documentos = [];
        } else {
          this.documentos = (lista || []).map(item => this.mapDocumento(item));
        }
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  abrirDocumento(d: PessoaUpload): void {
    if (!d.arquivo) {
      this.message.warning('Arquivo não encontrado.');
      return;
    }
    this.arquivoService.abrir(d.codigoPessoa, d.arquivo, d.tipo);
  }

  private mapDocumento(raw: any): PessoaUpload {
    return {
      codigo: raw.codigo ?? raw.Codigo,
      codigoPessoa: raw.codigoPessoa ?? raw.CodigoPessoa,
      tipo: raw.tipo ?? raw.Tipo ?? '',
      arquivo: String(raw.arquivo ?? raw.Arquivo ?? ''),
      dataCriacao: raw.dataCriacao ?? raw.DataCriacao
    };
  }
}
