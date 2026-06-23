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

interface Pessoa {
  codigo: number; documento: string; nome: string; razao: string;
  dataInclusao: string; fisica: boolean; numeroWhats?: string;
  prefeitura?: string; isNovo?: boolean; isTop5?: boolean;
}

@Component({
  selector: 'app-clientes-fisica',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule, NzModalModule,
    NzMessageModule, NzFormModule, NzSelectModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Clientes Física" subtitle="Clientes Pessoa Física na Plataforma"></app-page-title>
      <div class="kpis">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="user" style="color:#52c41a"></i></div>
          <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="{width:'50px'}" [nzParagraph]="{rows:0}"></nz-skeleton></ng-container>
          <div class="kpi-value green" *ngIf="!loading">{{ clientes.length }}</div>
          <div class="kpi-label">Clientes Ativos</div>
        </nz-card>
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="heart" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ clientesNovos }}</div>
          <div class="kpi-label">Clientes Novos</div>
        </nz-card>
        <nz-card class="kpi kpi-action" nzBordered (click)="abrirModalAdicionar()">
          <div class="kpi-icon"><i nz-icon nzType="plus-circle" style="color:#722ed1"></i></div>
          <div class="kpi-value purple"><button nz-button nzType="primary" nzShape="round" nzSize="small"><i nz-icon nzType="plus"></i></button></div>
          <div class="kpi-label">Novo Cliente</div>
        </nz-card>
      </div>
      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px">
          <nz-input-group [nzPrefix]="pfx" style="max-width:380px">
            <input nz-input placeholder="Buscar por CPF, nome ou código..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
        </div>
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table
          #clientesTable
          *ngIf="!loading"
          [nzData]="clientesFiltrados"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="clientesFiltrados.length > 15"
          [nzPageSize]="15"
          [nzFrontPagination]="true"
          [(nzPageIndex)]="pageIndex">
          <thead><tr>
            <th nzWidth="80px">Código</th><th nzWidth="140px">CPF</th><th>Nome</th>
            <th nzWidth="130px">Data Cadastro</th><th nzWidth="70px" nzAlign="center">Editar</th><th nzWidth="80px" nzAlign="center">Cancelar</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let c of clientesTable.data">
              <td>
                <nz-tag *ngIf="c.isTop5" nzColor="green" style="font-size:10px;border-radius:8px">⭐ NOVO</nz-tag>
                <nz-tag *ngIf="c.isNovo && !c.isTop5" nzColor="blue" style="font-size:10px">NOVO</nz-tag>
                {{ c.codigo }}
              </td>
              <td>{{ c.documento || '—' }}</td>
              <td>{{ c.razao || c.nome || '—' }}</td>
              <td>{{ c.dataInclusao | date:'dd/MM/yyyy' }}</td>
              <td nzAlign="center"><button nz-button nzType="primary" nzSize="small" (click)="editar(c)"><i nz-icon nzType="edit"></i></button></td>
              <td nzAlign="center"><button nz-button nzDanger nzSize="small" (click)="abrirCancelamento(c)"><i nz-icon nzType="close-circle"></i></button></td>
            </tr>
            <tr *ngIf="clientesFiltrados.length===0"><td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum cliente encontrado.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-modal [(nzVisible)]="cancelVisible" nzTitle="Cancelamento" [nzWidth]="460" [nzFooter]="ftCancel" (nzOnCancel)="cancelVisible=false">
      <ng-container *nzModalContent>
        <p *ngIf="selecionado"><strong>{{ selecionado.razao || selecionado.nome }}</strong></p>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Motivo do cancelamento</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="cancelMotivo" nzPlaceHolder="Selecione o motivo" style="width:100%">
              <nz-option *ngFor="let m of motivosCancelamento" [nzValue]="m" [nzLabel]="m"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #ftCancel>
        <button nz-button (click)="cancelVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzDanger (click)="salvarCancelamento()" [nzLoading]="salvando">Cancelar</button>
      </ng-template>
    </nz-modal>

    <nz-modal [(nzVisible)]="adicionarVisible" nzTitle="Novo Cliente Física" [nzWidth]="500" [nzFooter]="ftAdd" (nzOnCancel)="adicionarVisible=false">
      <ng-container *nzModalContent>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>CPF</nz-form-label><nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novo.cnpj" placeholder="000.000.000-00" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24">Celular</nz-form-label><nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novo.celular" placeholder="(00) 00000-0000" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>E-mail</nz-form-label><nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novo.email" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Nome</nz-form-label><nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novo.razao" /></nz-form-control></nz-form-item>
      </ng-container>
      <ng-template #ftAdd>
        <button nz-button (click)="adicionarVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvarNovo()" [nzLoading]="salvando">Salvar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:160px;text-align:center}.kpi-icon{font-size:24px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.88rem;margin-top:4px}.kpi-value{font-size:1.5rem;font-weight:800;margin:4px 0}.kpi-value.green{color:#52c41a}.kpi-value.primary{color:#1890ff}.kpi-value.purple{color:#722ed1}.kpi-action{cursor:pointer}`]
})
export class ClientesFisicaComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; clientes: Pessoa[] = []; clientesFiltrados: Pessoa[] = [];
  filtro = ''; pageIndex = 1; clientesNovos = 0; salvando = false;
  cancelVisible = false; selecionado: Pessoa | null = null; cancelMotivo = '';
  readonly motivosCancelamento = [
    'Mudança de Contabilidade',
    'Inadimplente',
    'Fora do Simples',
    'Fechamento da Empresa'
  ];
  adicionarVisible = false; novo = { cnpj: '', celular: '', email: '', razao: '' };

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }
  constructor(private http: HttpClient, private router: Router, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      pessoas: safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa`, { headers: this.h })),
      status:  safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa/Status`, { headers: this.h }))
    }).subscribe({ next: ({ pessoas, status }) => {
      const sm = new Map<number, Pessoa>(); (status as Pessoa[]).filter(p => p.fisica).forEach(p => sm.set(p.codigo, p));
      const agora = new Date();
      this.clientes = (pessoas as Pessoa[]).filter(p => p.fisica).map(p => {
        const diff = (agora.getTime() - new Date(p.dataInclusao).getTime()) / 86400000;
        return { ...(sm.get(p.codigo) ?? p), isNovo: diff < 30, isTop5: false };
      });
      // Ordena: mais recentes primeiro
      this.clientes.sort((a, b) => new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime());
      // Marca os 5 primeiros com até 60 dias de cadastro como destaque
      this.clientes.slice(0, 5).forEach(p => {
        const diff = (agora.getTime() - new Date(p.dataInclusao).getTime()) / 86400000;
        p.isTop5 = diff <= 60;
      });
      this.clientesNovos = this.clientes.filter(c => (agora.getTime() - new Date(c.dataInclusao).getTime()) / 86400000 < 60).length;
      this.clientesFiltrados = [...this.clientes]; this.pageIndex = 1; this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  filtrar() {
    const f = this.filtro.toLowerCase().trim();
    const base = f
      ? this.clientes.filter(c => (c.razao||c.nome||'').toLowerCase().includes(f) || (c.documento||'').includes(f) || String(c.codigo).includes(f))
      : [...this.clientes];
    this.clientesFiltrados = base.sort((a, b) => new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime());
    this.pageIndex = 1;
    this.cdr.markForCheck();
  }
  editar(c: Pessoa): void { this.router.navigate(['/administrativo/cliente', c.codigo, 'editar']); }
  abrirCancelamento(c: Pessoa) { this.selecionado = c; this.cancelMotivo = ''; this.cancelVisible = true; this.cdr.markForCheck(); }
  salvarCancelamento() {
    if (!this.cancelMotivo.trim()) { this.message.warning('Selecione o motivo do cancelamento.'); return; }
    this.salvando = true; this.cdr.markForCheck();
    const codigo = this.selecionado!.codigo;
    this.http.put(`${this.api}/Pessoa/Cancelar`, {
      codigo,
      motivoExcluido: this.cancelMotivo
    }, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Cancelado com sucesso.');
        this.clientes = this.clientes.filter(c => c.codigo !== codigo);
        this.filtrar();
        this.salvando = false;
        this.cancelVisible = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.message.error(`Erro ao cancelar (${e.status ?? 'sem resposta'}).`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }
  abrirModalAdicionar() { this.novo = { cnpj: '', celular: '', email: '', razao: '' }; this.adicionarVisible = true; this.cdr.markForCheck(); }
  salvarNovo() {
    if (!this.novo.cnpj.trim() || !this.novo.email.trim() || !this.novo.razao.trim()) { this.message.warning('Preencha CPF, e-mail e nome.'); return; }
    this.salvando = true; this.cdr.markForCheck();
    const params = new URLSearchParams({ cnpj: this.novo.cnpj.trim(), nome: this.novo.razao.trim(), email: this.novo.email.trim(), celular: this.novo.celular.trim() });
    this.http.get(`${this.api}/Contratacao/MudarDeContadorFisica?${params}`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Cliente adicionado!'); this.salvando = false; this.adicionarVisible = false; this.carregar(); this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
    });
  }
}
