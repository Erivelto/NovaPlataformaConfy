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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface Devedor {
  codigo: number;
  reference: string;       // CNPJ da pessoa (chave do join)
  transacao: string;
  dateVencimento: string;
  valorBruto: number;
  status: string;
  // Enriquecidos via join com /Pessoa
  codigoPessoa?: number;
  razao?: string;
  documento?: string;
}

@Component({
  selector: 'app-devedores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule, NzMessageModule,
    NzDividerModule, NzPopconfirmModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Clientes Devedores — Mês Atual"></app-page-title>

      <!-- Tile total (igual ao legado) -->
      <div class="tiles-row">
        <div class="tile-stats">
          <div class="count red" *ngIf="!loading">{{ valorTotal | currency:'BRL':'symbol':'1.2-2' }}</div>
          <nz-skeleton *ngIf="loading" [nzActive]="true" [nzTitle]="{width:'120px'}" [nzParagraph]="false"></nz-skeleton>
          <h3>Total</h3>
        </div>
      </div>

      <!-- Barra de pesquisa -->
      <div style="margin:12px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <nz-input-group [nzPrefix]="pfx" style="max-width:360px">
          <input nz-input placeholder="Buscar razão social ou CNPJ..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
        </nz-input-group>
        <ng-template #pfx><span nz-icon nzType="search"></span></ng-template>
        <span style="color:rgba(0,0,0,.45);font-size:.88rem" *ngIf="!loading">
          {{ listaFiltrada.length }} registro(s)
        </span>
      </div>

      <!-- Tabela -->
      <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
      <nz-table *ngIf="!loading"
        [nzData]="listaFiltrada"
        nzBordered
        nzSize="small"
        [nzShowPagination]="true"
        [nzPageSize]="15"
        [nzScroll]="{x:'900px'}">
        <thead>
          <tr>
            <th nzWidth="80px" [nzSortFn]="sortCodigo">Codigo</th>
            <th nzWidth="155px">CNPJ</th>
            <th>Razão Social</th>
            <th nzWidth="100px" [nzSortFn]="sortValor">Valor</th>
            <th nzWidth="120px" [nzSortFn]="sortVenc">Vencimento</th>
            <th nzWidth="160px" nzAlign="center"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of listaFiltrada" class="row-devedor">
            <td><span class="cod">{{ d.codigoPessoa }}</span></td>
            <td>{{ d.documento || '—' }}</td>
            <td>{{ d.razao || '—' }}</td>
            <td>{{ d.valorBruto | number:'1.2-2' }}</td>
            <td>{{ d.dateVencimento | date:'dd/MM/yyyy' }}</td>
            <td nzAlign="center">
              <button nz-button nzType="primary" nzSize="small"
                nz-popconfirm nzPopconfirmTitle="Confirmar pagamento?"
                nzOkText="Confirmar" nzCancelText="Cancelar"
                (nzOnConfirm)="marcarPago(d)"
                [nzLoading]="marcando.has(d.transacao)"
                class="btn-pago">
                <span nz-icon nzType="check"></span> Marcar como pago
              </button>
            </td>
          </tr>
          <tr *ngIf="listaFiltrada.length===0">
            <td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">
              Nenhum devedor encontrado.
            </td>
          </tr>
        </tbody>
      </nz-table>

      <!-- Rodapé: Enviar cobrança (igual ao legado) -->
      <nz-divider></nz-divider>
      <div class="footer-cobranca">
        <h2 style="color:#ff4d4f;margin-bottom:12px">Enviar cobrança</h2>
        <button nz-button nzType="primary" nzSize="large" (click)="enviarCobranca()" [nzLoading]="enviando" class="btn-whats">
          <span nz-icon nzType="message"></span> Enviar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .tiles-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
    .tile-stats { background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px 32px; min-width: 180px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .tile-stats .count { font-size: 2rem; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .tile-stats .count.red { color: #ff4d4f; }
    .tile-stats h3 { color: rgba(0,0,0,.55); font-size: .95rem; margin: 0; font-weight: 500; }
    .row-devedor td { color: #ff4d4f !important; font-weight: 500; }
    .row-devedor .cod { font-weight: 700; }
    .btn-pago { background: #52c41a; border-color: #52c41a; color: #fff; border-radius: 20px; }
    .btn-pago:hover { background: #73d13d; border-color: #73d13d; }
    .footer-cobranca { padding: 8px 0 24px; }
    .btn-whats { background: #25d366; border-color: #25d366; color: #fff; border-radius: 6px; }
    .btn-whats:hover { background: #1ebe57; border-color: #1ebe57; }
  `]
})
export class DevedoresComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; enviando = false; lista: Devedor[] = []; listaFiltrada: Devedor[] = [];
  filtro = ''; valorTotal = 0; marcando = new Set<string>();

  sortCodigo = (a: Devedor, b: Devedor) => (a.codigoPessoa ?? 0) - (b.codigoPessoa ?? 0);
  sortValor   = (a: Devedor, b: Devedor) => (a.valorBruto || 0) - (b.valorBruto || 0);
  sortVenc    = (a: Devedor, b: Devedor) => new Date(a.dateVencimento).getTime() - new Date(b.dateVencimento).getTime();

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
      // join: PessoaCobranca.Reference == Pessoa.Documento (CNPJ)
      const pm = new Map<string, any>();
      (pessoas as any[]).forEach(p => {
        if (p.documento) pm.set(p.documento, p);
      });
      this.lista = (cobrancas as Devedor[])
        .map(c => {
          const p = pm.get(c.reference);
          return { ...c, codigoPessoa: p?.codigo, razao: p?.razao, documento: c.reference };
        })
        .filter(c => c.codigoPessoa); // só devedores com pessoa encontrada (igual ao legado)
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
