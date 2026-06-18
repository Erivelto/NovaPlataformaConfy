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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface Chamado { id: number; codigoPessoa: number; atendente: string; solicitante: string; titulo: string; mensagem: string; dataCriacao: string; status: string; prioridade: number; tipo: string; razao?: string; }

@Component({
  selector: 'app-solicitacoes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule, NzModalModule,
    NzMessageModule, NzFormModule, NzSelectModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Solicitações" subtitle="Lista de chamados e solicitações dos clientes"></app-page-title>
      <div class="kpis">
        <nz-card class="kpi" *ngFor="let k of kpis">
          <div class="kpi-icon"><i nz-icon [nzType]="k.icon" [style.color]="k.color"></i></div>
          <div class="kpi-value" [style.color]="k.color" *ngIf="!loading">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </nz-card>
      </div>
      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <nz-input-group [nzPrefix]="pfx" style="max-width:320px">
            <input nz-input placeholder="Buscar por título, cliente..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
          <nz-select [(ngModel)]="statusFiltro" (ngModelChange)="filtrar()" style="width:160px" nzPlaceHolder="Todos os status">
            <nz-option nzValue="" nzLabel="Todos"></nz-option>
            <nz-option nzValue="N" nzLabel="Novo"></nz-option>
            <nz-option nzValue="A" nzLabel="Em Atendimento"></nz-option>
            <nz-option nzValue="C" nzLabel="Concluído"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" (click)="abrirNovo()"><i nz-icon nzType="plus"></i> Novo Chamado</button>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="10">
          <thead><tr>
            <th nzWidth="70px">ID</th><th>Título</th><th>Cliente</th>
            <th nzWidth="130px">Atendente</th><th nzWidth="130px">Data</th>
            <th nzWidth="100px" nzAlign="center">Status</th>
            <th nzWidth="90px" nzAlign="center">Prioridade</th>
            <th nzWidth="80px" nzAlign="center">Ação</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let c of listaFiltrada">
              <td>#{{ c.id }}</td><td>{{ c.titulo }}</td>
              <td>{{ c.razao || c.solicitante || '—' }}</td>
              <td>{{ c.atendente || '—' }}</td>
              <td>{{ c.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="statusColor(c.status)">{{ statusLabel(c.status) }}</nz-tag></td>
              <td nzAlign="center"><nz-tag [nzColor]="prioColor(c.prioridade)">{{ prioLabel(c.prioridade) }}</nz-tag></td>
              <td nzAlign="center">
                <button nz-button nzType="default" nzSize="small" (click)="abrir(c)" nz-tooltip nzTooltipTitle="Editar"><i nz-icon nzType="edit"></i></button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length===0"><td colspan="8" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhuma solicitação encontrada.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Modal edição -->
    <nz-modal [(nzVisible)]="editVisible" [nzTitle]="modalTitulo" [nzWidth]="600" [nzFooter]="ftEdit" (nzOnCancel)="editVisible=false">
      <ng-container *nzModalContent>
        <ng-container *ngIf="selecionado">
        <div class="detalhe"><label>Cliente</label><div>{{ selecionado.razao || selecionado.solicitante }}</div></div>
        <div class="detalhe"><label>Título</label><div>{{ selecionado.titulo }}</div></div>
        <div class="detalhe"><label>Mensagem</label><div style="white-space:pre-wrap">{{ selecionado.mensagem }}</div></div>
        <nz-form-item style="margin-top:16px"><nz-form-label [nzSpan]="24">Status</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="editStatus" style="width:100%">
              <nz-option nzValue="N" nzLabel="Novo"></nz-option>
              <nz-option nzValue="A" nzLabel="Em Atendimento"></nz-option>
              <nz-option nzValue="C" nzLabel="Concluído"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24">Resposta / Observação</nz-form-label>
          <nz-form-control [nzSpan]="24"><textarea nz-input [(ngModel)]="editResposta" [nzAutosize]="{minRows:3}"></textarea></nz-form-control>
        </nz-form-item>
        </ng-container>
      </ng-container>
      <ng-template #ftEdit>
        <button nz-button (click)="editVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvarEdicao()" [nzLoading]="salvando">Salvar</button>
      </ng-template>
    </nz-modal>

    <!-- Modal novo chamado -->
    <nz-modal [(nzVisible)]="novoVisible" nzTitle="Novo Chamado" [nzWidth]="560" [nzFooter]="ftNovo" (nzOnCancel)="novoVisible=false">
      <ng-container *nzModalContent>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Cliente</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="novoChamado.codigoPessoa" style="width:100%" nzShowSearch nzPlaceHolder="Selecione o cliente">
              <nz-option *ngFor="let p of pessoas" [nzValue]="p.codigo" [nzLabel]="p.razao || p.nome"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Título</nz-form-label><nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novoChamado.titulo" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Mensagem</nz-form-label><nz-form-control [nzSpan]="24"><textarea nz-input [(ngModel)]="novoChamado.mensagem" [nzAutosize]="{minRows:3}"></textarea></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24">Prioridade</nz-form-label>
          <nz-form-control [nzSpan]="24"><nz-select [(ngModel)]="novoChamado.prioridade" style="width:100%">
            <nz-option [nzValue]="1" nzLabel="Alta"></nz-option><nz-option [nzValue]="2" nzLabel="Média"></nz-option><nz-option [nzValue]="3" nzLabel="Normal"></nz-option>
          </nz-select></nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #ftNovo>
        <button nz-button (click)="novoVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvarNovo()" [nzLoading]="salvando">Abrir Chamado</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:130px;text-align:center}.kpi-icon{font-size:22px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.85rem}.kpi-value{font-size:1.35rem;font-weight:800;margin:4px 0}.detalhe{margin-bottom:12px}.detalhe label{font-weight:600;color:rgba(0,0,0,.55);font-size:.8rem;text-transform:uppercase;margin-bottom:4px;display:block}.detalhe div{background:#fafafa;border:1px solid #f0f0f0;border-radius:4px;padding:6px 10px}`]
})
export class SolicitacoesComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: Chamado[] = []; listaFiltrada: Chamado[] = [];
  filtro = ''; statusFiltro = ''; salvando = false;
  pessoas: any[] = [];
  editVisible = false; selecionado: Chamado | null = null; editStatus = 'A'; editResposta = '';
  get modalTitulo(): string { return this.selecionado ? 'Chamado #' + this.selecionado.id : 'Chamado'; }
  novoVisible = false; novoChamado = { codigoPessoa: 0, titulo: '', mensagem: '', prioridade: 3 };

  get kpis() {
    return [
      { label: 'Novos', icon: 'plus-circle', color: '#1890ff', value: this.lista.filter(c=>c.status==='N').length },
      { label: 'Em Atendimento', icon: 'clock-circle', color: '#fa8c16', value: this.lista.filter(c=>c.status==='A').length },
      { label: 'Concluídos', icon: 'check-circle', color: '#52c41a', value: this.lista.filter(c=>c.status==='C').length },
      { label: 'Total', icon: 'message', color: '#722ed1', value: this.lista.length }
    ];
  }
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      chamados: safe<Chamado>(this.http.get<Chamado[]>(`${this.api}/Chamado`, { headers: this.h })),
      pessoas:  safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ chamados, pessoas }) => {
      this.pessoas = pessoas as any[];
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      this.lista = (chamados as Chamado[]).map(c => ({ ...c, razao: pm.get(c.codigoPessoa)?.razao }));
      this.filtrar(); this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() {
    let l = [...this.lista];
    if (this.statusFiltro) l = l.filter(c => c.status === this.statusFiltro);
    const f = this.filtro.toLowerCase().trim();
    if (f) l = l.filter(c => (c.titulo||'').toLowerCase().includes(f)||(c.razao||'').toLowerCase().includes(f)||(c.atendente||'').toLowerCase().includes(f));
    this.listaFiltrada = l;
  }
  statusLabel(s: string) { return { N:'Novo', A:'Em Atendimento', C:'Concluído' }[s] || s; }
  statusColor(s: string) { return { N:'blue', A:'orange', C:'green' }[s] || 'default'; }
  prioLabel(p: number) { return { 1:'Alta', 2:'Média', 3:'Normal' }[p] || '—'; }
  prioColor(p: number) { return { 1:'red', 2:'orange', 3:'green' }[p] || 'default'; }
  abrir(c: Chamado) { this.selecionado = c; this.editStatus = c.status; this.editResposta = ''; this.editVisible = true; this.cdr.markForCheck(); }
  salvarEdicao() {
    if (!this.selecionado) return;
    this.salvando = true; this.cdr.markForCheck();
    const payload = { ...this.selecionado, status: this.editStatus };
    this.http.put(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => { this.selecionado!.status = this.editStatus; this.message.success('Chamado atualizado!'); this.salvando = false; this.editVisible = false; this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
    });
  }
  abrirNovo() { this.novoChamado = { codigoPessoa: 0, titulo: '', mensagem: '', prioridade: 3 }; this.novoVisible = true; this.cdr.markForCheck(); }
  salvarNovo() {
    if (!this.novoChamado.codigoPessoa || !this.novoChamado.titulo.trim()) { this.message.warning('Preencha o cliente e título.'); return; }
    this.salvando = true; this.cdr.markForCheck();
    const payload = { ...this.novoChamado, status: 'N', dataCriacao: new Date().toISOString() };
    this.http.post(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => { this.message.success('Chamado aberto!'); this.salvando = false; this.novoVisible = false; this.carregar(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
    });
  }
}
