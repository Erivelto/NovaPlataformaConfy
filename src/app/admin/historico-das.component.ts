import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface DasItem { codigo: number; codigoPessoa: number; periodo: string; valorTributado: string; valorTributo: string; status: string; nomeArquivo: string; statusContfy?: string; razao?: string; prefeitura?: string; }

@Component({
  selector: 'app-historico-das',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzMessageModule, NzStatisticModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Relatório DAS" subtitle="Histórico de DAS — Impostos e Obrigações"></app-page-title>
      <div class="kpis">
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="file-done" style="color:#52c41a"></i></div>
          <div class="kpi-value green" *ngIf="!loading">{{ totalPago }}</div><div class="kpi-label">Pagos</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="clock-circle" style="color:#fa8c16"></i></div>
          <div class="kpi-value orange" *ngIf="!loading">{{ totalPendente }}</div><div class="kpi-label">Pendentes</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="team" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ lista.length }}</div><div class="kpi-label">Total Registros</div></nz-card>
      </div>
      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por razão, CNPJ, prefeitura ou período..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
          <button nz-button nzType="primary" (click)="enviarDas()" [nzLoading]="enviando">
            <i nz-icon nzType="send"></i> Enviar DAS Pendentes
          </button>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="small" [nzShowPagination]="true" [nzPageSize]="15">
          <thead><tr>
            <th>Razão Social</th><th nzWidth="110px">Período</th>
            <th nzWidth="130px">Prefeitura</th>
            <th nzWidth="130px">Val. Tributado</th>
            <th nzWidth="120px">Val. Tributo</th>
            <th nzWidth="100px" nzAlign="center">Status</th>
            <th nzWidth="120px" nzAlign="center">Ação</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let d of listaFiltrada">
              <td>{{ d.razao || '—' }}</td>
              <td>{{ d.periodo }}</td>
              <td>{{ d.prefeitura || '—' }}</td>
              <td>{{ parseBrl(d.valorTributado) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ d.valorTributo || '—' }}</td>
              <td nzAlign="center">
                <nz-tag [nzColor]="d.status === 'Pago' ? 'green' : 'orange'">{{ d.status || 'Pendente' }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button nz-button nzType="default" nzSize="small" (click)="abrirBoleto(d)" nz-tooltip nzTooltipTitle="Visualizar boleto">
                  <i nz-icon nzType="file-text"></i>
                </button>
                <button *ngIf="d.status !== 'Pago'" nz-button nzSize="small" style="margin-left:4px" [nzLoading]="enviandoUnico.has(d.codigo)" (click)="enviarUnico(d)" nz-tooltip nzTooltipTitle="Enviar DAS">
                  <i nz-icon nzType="mail"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:150px;text-align:center}.kpi-icon{font-size:24px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.88rem}.kpi-value{font-size:1.4rem;font-weight:800;margin:4px 0}.kpi-value.green{color:#52c41a}.kpi-value.orange{color:#fa8c16}.kpi-value.primary{color:#1890ff}`]
})
export class HistoricoDasComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; enviando = false; lista: DasItem[] = []; listaFiltrada: DasItem[] = [];
  filtro = ''; totalPago = 0; totalPendente = 0; enviandoUnico = new Set<number>();
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      das:     safe<DasItem>(this.http.get<DasItem[]>(`${this.api}/DAS`, { headers: this.h })),
      pessoas: safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h })),
      emissao: safe<any>(this.http.get<any[]>(`${this.api}/DadosEmissaoNota`, { headers: this.h }))
    }).subscribe({ next: ({ das, pessoas, emissao }) => {
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      const em = new Map<number, any>(); (emissao as any[]).forEach(e => em.set(e.codigoPessoa, e));
      this.lista = (das as DasItem[]).map(d => ({ ...d, razao: pm.get(d.codigoPessoa)?.razao, prefeitura: em.get(d.codigoPessoa)?.prefeitura }));
      this.totalPago = this.lista.filter(d => d.status === 'Pago').length;
      this.totalPendente = this.lista.filter(d => d.status !== 'Pago').length;
      this.listaFiltrada = [...this.lista]; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() {
    const f = this.filtro.toLowerCase().trim();
    this.listaFiltrada = f ? this.lista.filter(d => (d.razao||'').toLowerCase().includes(f)||(d.prefeitura||'').toLowerCase().includes(f)||(d.periodo||'').includes(f)) : [...this.lista];
  }
  parseBrl(v: any): number { if (!v) return 0; if (typeof v === 'number') return v; const s = String(v); return s.includes(',') ? parseFloat(s.replace(/\./g,'').replace(',','.')) : parseFloat(s)||0; }
  abrirBoleto(d: DasItem) { if (d.nomeArquivo) window.open(`https://armazenamento.contfy.com.br/Arquivos/Resultado?diretorioCompleto=${d.codigoPessoa}&nomeArquivo=${d.nomeArquivo}`, '_blank'); }
  enviarDas() { this.enviando = true; this.cdr.markForCheck(); this.http.get(`${this.api}/DAS/ObterListaEnvio`, { headers: this.h }).subscribe({ next: () => { this.message.success('Envio iniciado!'); this.enviando = false; this.carregar(); }, error: (e) => { this.message.error(`Erro (${e.status})`); this.enviando = false; this.cdr.markForCheck(); }}); }
  enviarUnico(d: DasItem) { this.enviandoUnico.add(d.codigo); this.cdr.markForCheck(); this.http.get(`${this.api}/DAS/ObterPorCodigo/Codigo/${d.codigo}`, { headers: this.h }).subscribe({ next: () => { this.message.success('DAS enviado!'); this.enviandoUnico.delete(d.codigo); this.cdr.markForCheck(); }, error: (e) => { this.message.error(`Erro (${e.status})`); this.enviandoUnico.delete(d.codigo); this.cdr.markForCheck(); }}); }
}
