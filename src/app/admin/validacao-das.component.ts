import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface DasAcumulado { codigoPessoa: number; tipo: string; periodo: string; valorTributado?: string; valorTributo?: string; status?: string; razao?: string; }

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  E: { label: 'Erro', color: 'red', desc: 'DAS com status "Não concluído"' },
  A: { label: 'Atenção', color: 'orange', desc: 'Variação ≥ 50% entre períodos' },
  O: { label: 'Normal', color: 'green', desc: 'Variação ≤ 10%' },
  V: { label: 'Incompleto', color: 'gold', desc: 'Sem dados de acumulado' },
  Z: { label: 'Zerado', color: 'default', desc: 'Valor tributado = 0' }
};

@Component({
  selector: 'app-validacao-das',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzAlertModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title [title]="pageTitle" [subtitle]="pageSubtitle"></app-page-title>
      <nz-alert *ngIf="statusInfo" [nzType]="alertType" [nzMessage]="pageSubtitle" nzShowIcon style="margin:12px 0"></nz-alert>
      <nz-card>
        <div style="margin-bottom:12px">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por razão social ou período..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="15">
          <thead><tr>
            <th>Razão Social</th><th nzWidth="110px">Período</th>
            <th nzWidth="140px">Val. Tributado</th><th nzWidth="120px">Val. Tributo</th>
            <th nzWidth="100px" nzAlign="center">Status</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let d of listaFiltrada">
              <td>{{ d.razao || '—' }}</td><td>{{ d.periodo }}</td>
              <td>{{ d.valorTributado || '—' }}</td><td>{{ d.valorTributo || '—' }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="statusTagColor">{{ statusTagLabel }}</nz-tag></td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="5" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum registro para este filtro.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`.page{padding:8px 4px}`]
})
export class ValidacaoDasComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: DasAcumulado[] = []; listaFiltrada: DasAcumulado[] = [];
  filtro = ''; statusParam = 'E';
  get statusInfo() { return STATUS_LABELS[this.statusParam]; }
  get alertType(): any { const m: any = { E:'error', A:'warning', O:'success', V:'warning', Z:'info' }; return m[this.statusParam]||'info'; }
  get pageTitle(): string { return 'Validação DAS — ' + (this.statusInfo ? this.statusInfo.label : ''); }
  get pageSubtitle(): string { return this.statusInfo ? this.statusInfo.desc : ''; }
  get statusTagColor(): string { return this.statusInfo ? this.statusInfo.color : 'default'; }
  get statusTagLabel(): string { return this.statusInfo ? this.statusInfo.label : ''; }
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.route.queryParams.subscribe(p => { this.statusParam = p['status'] || 'E'; this.carregar(); });
  }
  carregar() {
    this.loading = true; this.cdr.markForCheck();
    const agora = new Date(); const mes = agora.getMonth(); const ano = agora.getFullYear();
    const mesFmt = String(mes === 0 ? 12 : mes).padStart(2,'0');
    const anoFmt = mes === 0 ? ano - 1 : ano;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      das:     safe<DasAcumulado>(this.http.get<DasAcumulado[]>(`${this.api}/DAS/DASHitorico/${mesFmt}-${anoFmt}`, { headers: this.h })),
      pessoas: safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ das, pessoas }) => {
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      let filtrados = (das as DasAcumulado[]);
      switch (this.statusParam) {
        case 'E': filtrados = filtrados.filter(d => d.status && d.status.toLowerCase().includes('não concluido')); break;
        case 'Z': filtrados = filtrados.filter(d => !parseFloat(d.valorTributado||'0')); break;
        case 'V': filtrados = filtrados.filter(d => !d.tipo); break;
        case 'A': filtrados = filtrados.filter(d => d.tipo === 'A'); break;
        case 'O': filtrados = filtrados.filter(d => d.tipo === 'O'); break;
      }
      this.lista = filtrados.map(d => ({ ...d, razao: pm.get(d.codigoPessoa)?.razao }));
      this.listaFiltrada = [...this.lista]; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() { const f = this.filtro.toLowerCase().trim(); this.listaFiltrada = f ? this.lista.filter(d => (d.razao||'').toLowerCase().includes(f)||(d.periodo||'').includes(f)) : [...this.lista]; }
}
