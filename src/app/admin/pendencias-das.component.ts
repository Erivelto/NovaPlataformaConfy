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
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface Pendencia { codigoPessoa: number; tipo: string; valor: string; apuracao: string; status: string; razao?: string; }

@Component({
  selector: 'app-pendencias-das',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Pendências Clientes DAS" subtitle="Clientes com pendências de DAS consolidadas"></app-page-title>
      <div class="kpis">
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="warning" style="color:#fa8c16"></i></div>
          <div class="kpi-value orange" *ngIf="!loading">{{ lista.length }}</div><div class="kpi-label">Total Pendências</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="team" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ clientesUnicos }}</div><div class="kpi-label">Clientes Afetados</div></nz-card>
      </div>
      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por razão social, tipo ou apuração..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="15">
          <thead><tr>
            <th>Razão Social</th><th nzWidth="110px">Apuração</th>
            <th nzWidth="140px">Tipo</th><th nzWidth="130px">Valor</th>
            <th nzWidth="110px" nzAlign="center">Status</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of listaFiltrada">
              <td>{{ p.razao || '—' }}</td><td>{{ p.apuracao }}</td><td>{{ p.tipo }}</td>
              <td>{{ p.valor }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="p.status === 'Resolvido' ? 'green' : 'orange'">{{ p.status || 'Pendente' }}</nz-tag></td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="5" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhuma pendência encontrada.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:180px;text-align:center}.kpi-icon{font-size:24px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.88rem}.kpi-value{font-size:1.4rem;font-weight:800;margin:4px 0}.kpi-value.orange{color:#fa8c16}.kpi-value.primary{color:#1890ff}`]
})
export class PendenciasDasComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: Pendencia[] = []; listaFiltrada: Pendencia[] = []; filtro = ''; clientesUnicos = 0;
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      pendencias: safe<Pendencia>(this.http.get<Pendencia[]>(`${this.api}/Pendencia/GetListaConsolidado`, { headers: this.h })),
      pessoas:    safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ pendencias, pessoas }) => {
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      this.lista = (pendencias as Pendencia[]).map(p => ({ ...p, razao: pm.get(p.codigoPessoa)?.razao }));
      this.clientesUnicos = new Set(this.lista.map(p => p.codigoPessoa)).size;
      this.listaFiltrada = [...this.lista]; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() { const f = this.filtro.toLowerCase().trim(); this.listaFiltrada = f ? this.lista.filter(p => (p.razao||'').toLowerCase().includes(f)||(p.tipo||'').toLowerCase().includes(f)||(p.apuracao||'').includes(f)) : [...this.lista]; }
}
