import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtDate } from '../utils/excel-export.helpers';
import { ArquivoService } from '../services/arquivo.service';
import { environment } from '../../environments/environment';

interface Prolabore { codigo: number; codigoPessoa: number; tipo: string; status: string; nomeArquivo?: string; dateVencimento?: string; mes?: number; ano?: number; razao?: string; }

@Component({
  selector: 'app-gestao-pessoal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule, NzMessageModule,
    NzModalModule, NzFormModule, NzSelectModule, NzUploadModule, PageTitleComponent, ExportExcelButtonComponent],
  template: `
    <div class="page">
      <app-page-title title="Gestão Pessoal" subtitle="Gerenciamento de Pró-Labore e GPS/SEFIP dos clientes"></app-page-title>
      <nz-card>
        <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por razão social ou tipo..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
          <app-export-excel-button [data]="$any(listaFiltrada)" [columns]="exportColumns" fileName="gestao-pessoal" />
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="10">
          <thead><tr>
            <th>Razão Social</th><th nzWidth="130px">Tipo</th>
            <th nzWidth="100px">Mês/Ano</th><th nzWidth="130px">Vencimento</th>
            <th nzWidth="110px" nzAlign="center">Status</th>
            <th nzWidth="180px" nzAlign="center">Ações</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of listaFiltrada">
              <td>{{ p.razao || '—' }}</td>
              <td>{{ p.tipo }}</td>
              <td>{{ p.mes ? (p.mes|number:'2.0') + '/' + p.ano : '—' }}</td>
              <td>{{ p.dateVencimento ? (p.dateVencimento | date:'dd/MM/yyyy') : '—' }}</td>
              <td nzAlign="center">
                <nz-tag [nzColor]="p.status==='Enviado'?'green':p.status==='Pendente'?'orange':'default'">{{ p.status || '—' }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button *ngIf="p.nomeArquivo" nz-button nzType="default" nzSize="small" nz-tooltip nzTooltipTitle="Baixar arquivo" (click)="baixar(p)" style="margin-right:4px">
                  <i nz-icon nzType="download"></i>
                </button>
                <button *ngIf="p.status !== 'Enviado'" nz-button nzType="primary" nzSize="small" nz-tooltip nzTooltipTitle="Enviar guia" [nzLoading]="enviando.has(p.codigo)" (click)="enviarGuia(p)" style="margin-right:4px">
                  <i nz-icon nzType="mail"></i>
                </button>
                <button nz-button nzDanger nzSize="small" nz-tooltip nzTooltipTitle="Excluir" [nzLoading]="excluindo.has(p.codigo)" (click)="excluir(p)">
                  <i nz-icon nzType="delete"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum registro de gestão pessoal encontrado.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`.page{padding:8px 4px}`]
})
export class GestaoPessoalComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: Prolabore[] = []; listaFiltrada: Prolabore[] = [];
  filtro = ''; enviando = new Set<number>(); excluindo = new Set<number>();

  readonly exportColumns: ExcelExportColumn<Prolabore>[] = [
    { key: 'razao', title: 'Razão Social' },
    { key: 'tipo', title: 'Tipo' },
    { key: 'mes', title: 'Mês/Ano', format: (_v, row) => row.mes ? `${String(row.mes).padStart(2, '0')}/${row.ano}` : '' },
    { key: 'dateVencimento', title: 'Vencimento', format: fmtDate },
    { key: 'status', title: 'Status' }
  ];

  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private message: NzMessageService, private arquivoService: ArquivoService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      pessoas: safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h })),
      status:  safe<any>(this.http.get<any[]>(`${this.api}/Pessoa/Status`, { headers: this.h }))
    }).subscribe({ next: ({ pessoas, status }) => {
      const sm = new Map<number, any>(); (status as any[]).forEach(p => sm.set(p.codigo, p));
      const ativos = (pessoas as any[]).filter(p => (sm.get(p.codigo) ?? p).prolaboreAtivo === true);
      const agora = new Date();
      const mes = agora.getMonth() + 1; const ano = agora.getFullYear();
      this.lista = ativos.map(p => ({ codigo: p.codigo, codigoPessoa: p.codigo, tipo: 'GPS 2003', status: 'Pendente', mes, ano, razao: p.razao || p.nome }));
      this.listaFiltrada = [...this.lista]; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() { const f = this.filtro.toLowerCase().trim(); this.listaFiltrada = f ? this.lista.filter(p => (p.razao||'').toLowerCase().includes(f)||(p.tipo||'').toLowerCase().includes(f)) : [...this.lista]; }
  baixar(p: Prolabore) { if (p.nomeArquivo) this.arquivoService.abrir(p.codigoPessoa, p.nomeArquivo); }
  enviarGuia(p: Prolabore) {
    this.enviando.add(p.codigo); this.cdr.markForCheck();
    this.http.get(`${this.api}/PessoaProlabore/${p.codigo}`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Guia enviada!'); p.status = 'Enviado'; this.enviando.delete(p.codigo); this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.enviando.delete(p.codigo); this.cdr.markForCheck(); }
    });
  }
  excluir(p: Prolabore) {
    this.excluindo.add(p.codigo); this.cdr.markForCheck();
    this.http.delete(`${this.api}/PessoaProlabore/${p.codigo}`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Excluído.'); this.lista = this.lista.filter(x => x.codigo !== p.codigo); this.filtrar(); this.excluindo.delete(p.codigo); this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.excluindo.delete(p.codigo); this.cdr.markForCheck(); }
    });
  }
}
