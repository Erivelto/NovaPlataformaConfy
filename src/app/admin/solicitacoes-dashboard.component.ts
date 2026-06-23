import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtDateTime } from '../utils/excel-export.helpers';
import { environment } from '../../environments/environment';

interface Chamado { id: number; codigoPessoa: number; atendente: string; solicitante: string; titulo: string; status: string; prioridade: number; dataCriacao: string; sLATempo?: number; razao?: string; }

@Component({
  selector: 'app-solicitacoes-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzSkeletonModule, NzStatisticModule, NzDividerModule, PageTitleComponent, ExportExcelButtonComponent],
  template: `
    <div class="page">
      <app-page-title title="Dashboard de Solicitações" subtitle="Visão geral do atendimento e SLA"></app-page-title>

      <div class="kpis" *ngIf="!loading">
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.novos" nzTitle="Novos" [nzValueStyle]="{ color: '#1890ff' }"><ng-template #nzPrefix><i nz-icon nzType="plus-circle"></i></ng-template></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.emAtendimento" nzTitle="Em Atendimento" [nzValueStyle]="{ color: '#fa8c16' }"><ng-template #nzPrefix><i nz-icon nzType="clock-circle"></i></ng-template></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.concluidos" nzTitle="Concluídos" [nzValueStyle]="{ color: '#52c41a' }"><ng-template #nzPrefix><i nz-icon nzType="check-circle"></i></ng-template></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.slaVencido" nzTitle="SLA Vencido" [nzValueStyle]="{ color: '#ff4d4f' }"><ng-template #nzPrefix><i nz-icon nzType="exclamation-circle"></i></ng-template></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.alta" nzTitle="Alta Prioridade" [nzValueStyle]="{ color: '#ff4d4f' }"><ng-template #nzPrefix><i nz-icon nzType="fire"></i></ng-template></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.media" nzTitle="Média Prioridade" [nzValueStyle]="{ color: '#fa8c16' }"></nz-statistic></nz-card>
        <nz-card class="kpi-card"><nz-statistic [nzValue]="stats.normal" nzTitle="Normal" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic></nz-card>
      </div>
      <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:3}"></nz-skeleton></ng-container>

      <nz-divider nzText="Chamados Recentes"></nz-divider>

      <div style="margin-bottom:12px;display:flex;justify-content:flex-end" *ngIf="!loading">
        <app-export-excel-button [data]="$any(lista)" [columns]="exportColumns" fileName="solicitacoes-dashboard" />
      </div>

      <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
      <nz-table *ngIf="!loading" [nzData]="lista" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="10">
        <thead><tr>
          <th nzWidth="70px">ID</th><th>Título</th><th>Cliente</th>
          <th nzWidth="130px">Atendente</th><th nzWidth="130px">Abertura</th>
          <th nzWidth="100px" nzAlign="center">Status</th>
          <th nzWidth="90px" nzAlign="center">Prio.</th>
          <th nzWidth="90px" nzAlign="center">SLA</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let c of lista">
            <td>#{{ c.id }}</td><td>{{ c.titulo }}</td>
            <td>{{ c.razao || c.solicitante || '—' }}</td>
            <td>{{ c.atendente || '—' }}</td>
            <td>{{ c.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</td>
            <td nzAlign="center"><nz-tag [nzColor]="statusColor(c.status)">{{ statusLabel(c.status) }}</nz-tag></td>
            <td nzAlign="center"><nz-tag [nzColor]="prioColor(c.prioridade)">{{ prioLabel(c.prioridade) }}</nz-tag></td>
            <td nzAlign="center">
              <nz-tag *ngIf="c.sLATempo && c.sLATempo < 0" nzColor="red">Vencido</nz-tag>
              <nz-tag *ngIf="!c.sLATempo || c.sLATempo >= 0" nzColor="green">OK</nz-tag>
            </td>
          </tr>
          <tr *ngIf="lista.length===0"><td colspan="8" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Sem chamados.</td></tr>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin:12px 0}`]
})
export class SolicitacoesDashboardComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: Chamado[] = [];
  stats = { novos:0, emAtendimento:0, concluidos:0, slaVencido:0, alta:0, media:0, normal:0 };

  readonly exportColumns: ExcelExportColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'titulo', title: 'Título' },
    { key: 'razao', title: 'Cliente', format: (_v, row) => {
      const c = row as unknown as Chamado;
      return c.razao || c.solicitante || '';
    }},
    { key: 'atendente', title: 'Atendente' },
    { key: 'dataCriacao', title: 'Abertura', format: fmtDateTime },
    { key: 'status', title: 'Status', format: v => this.statusLabel(String(v ?? '')) },
    { key: 'prioridade', title: 'Prio.', format: v => this.prioLabel(Number(v)) },
    { key: 'sLATempo', title: 'SLA', format: v => (v != null && Number(v) < 0) ? 'Vencido' : 'OK' }
  ];

  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      chamados: safe<Chamado>(this.http.get<Chamado[]>(`${this.api}/Chamado`, { headers: this.h })),
      pessoas:  safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ chamados, pessoas }) => {
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      this.lista = (chamados as Chamado[]).map(c => ({ ...c, razao: pm.get(c.codigoPessoa)?.razao }));
      this.stats = {
        novos: this.lista.filter(c => c.status==='N').length,
        emAtendimento: this.lista.filter(c => c.status==='A').length,
        concluidos: this.lista.filter(c => c.status==='C').length,
        slaVencido: this.lista.filter(c => c.sLATempo && c.sLATempo < 0).length,
        alta: this.lista.filter(c => c.prioridade===1).length,
        media: this.lista.filter(c => c.prioridade===2).length,
        normal: this.lista.filter(c => c.prioridade===3).length
      };
      this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  statusLabel(s: string) { return { N:'Novo', A:'Atendimento', C:'Concluído' }[s]||s; }
  statusColor(s: string) { return { N:'blue', A:'orange', C:'green' }[s]||'default'; }
  prioLabel(p: number) { return { 1:'Alta', 2:'Média', 3:'Normal' }[p]||'—'; }
  prioColor(p: number) { return { 1:'red', 2:'orange', 3:'green' }[p]||'default'; }
}
