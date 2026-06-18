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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface Devedor {
  codigoPessoa: number;
  transacao: string;
  dateVencimento: string;
  valorBruto: number;
  status: string;
  razao?: string;
  documento?: string;
}

@Component({
  selector: 'app-devedores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule, NzMessageModule, NzAlertModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Devedores — Mês Atual" subtitle="Clientes com pagamento vencido no mês atual"></app-page-title>

      <div class="kpis">
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="team" style="color:#ff4d4f"></i></div>
          <div class="kpi-value red" *ngIf="!loading">{{ lista.length }}</div><div class="kpi-label">Devedores</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="dollar" style="color:#fa8c16"></i></div>
          <div class="kpi-value orange" *ngIf="!loading">{{ valorTotal | currency:'BRL':'symbol':'1.2-2' }}</div><div class="kpi-label">Total em Aberto</div></nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por razão social ou CNPJ..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
          <button nz-button nzType="primary" (click)="enviarCobranca()" [nzLoading]="enviando">
            <i nz-icon nzType="send"></i> Enviar Cobranças
          </button>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:6}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="10">
          <thead><tr>
            <th>Razão Social</th><th nzWidth="150px">CNPJ</th>
            <th nzWidth="130px">Vencimento</th><th nzWidth="130px">Valor</th>
            <th nzWidth="120px" nzAlign="center">Status</th>
            <th nzWidth="130px" nzAlign="center">Ação</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let d of listaFiltrada">
              <td>{{ d.razao || '—' }}</td>
              <td>{{ d.documento || '—' }}</td>
              <td>{{ d.dateVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ d.valorBruto | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center"><nz-tag nzColor="red">{{ statusLabel(d.status) }}</nz-tag></td>
              <td nzAlign="center">
                <button nz-button nzType="default" nzSize="small" [nzLoading]="marcando.has(d.transacao)" (click)="marcarPago(d)">
                  <i nz-icon nzType="check"></i> Marcar Pago
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum devedor encontrado.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:200px;text-align:center}.kpi-icon{font-size:24px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.88rem}.kpi-value{font-size:1.4rem;font-weight:800;margin:4px 0}.kpi-value.red{color:#ff4d4f}.kpi-value.orange{color:#fa8c16}`]
})
export class DevedoresComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; enviando = false; lista: Devedor[] = []; listaFiltrada: Devedor[] = [];
  filtro = ''; valorTotal = 0; marcando = new Set<string>();

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }
  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      cobrancas: safe<Devedor>(this.http.get<Devedor[]>(`${this.api}/PessoaCobranca/ObterPagamentoVencidoMesAtual`, { headers: this.h })),
      pessoas:   safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ cobrancas, pessoas }) => {
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      this.lista = (cobrancas as Devedor[]).map(c => ({ ...c, razao: pm.get(c.codigoPessoa)?.razao, documento: pm.get(c.codigoPessoa)?.documento }));
      this.valorTotal = this.lista.reduce((s, d) => s + (d.valorBruto || 0), 0);
      this.listaFiltrada = [...this.lista]; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }

  filtrar() {
    const f = this.filtro.toLowerCase().trim();
    this.listaFiltrada = f ? this.lista.filter(d => (d.razao||'').toLowerCase().includes(f) || (d.documento||'').includes(f)) : [...this.lista];
  }

  statusLabel(s: string): string {
    const m: any = { paid:'Pago', waiting:'Aguardando', settled:'Pago', canceled:'Cancelado', unpaid:'Devedor', cancel:'Cancelando', expired:'Expirado' };
    return m[s?.toLowerCase()] || s || '—';
  }

  marcarPago(d: Devedor) {
    this.marcando.add(d.transacao); this.cdr.markForCheck();
    const payload = { ...d, status: 'settled', dataPagamento: new Date().toISOString() };
    this.http.put(`${this.api}/PessoaCobranca`, payload, { headers: this.h }).subscribe({
      next: () => { d.status = 'paid'; this.marcando.delete(d.transacao); this.message.success('Marcado como pago.'); this.cdr.markForCheck(); },
      error: (e) => { this.marcando.delete(d.transacao); this.message.error(`Erro (${e.status})`); this.cdr.markForCheck(); }
    });
  }

  enviarCobranca() {
    this.enviando = true; this.cdr.markForCheck();
    this.http.get(`${this.api}/PessoaCobranca/EnviarVencidosCobrancaMesAtual`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Cobranças enviadas com sucesso!'); this.enviando = false; this.carregar(); },
      error: (e) => { this.message.error(`Erro ao enviar cobranças (${e.status})`); this.enviando = false; this.cdr.markForCheck(); }
    });
  }
}
