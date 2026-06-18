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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface AgendamentoDAS { id?: number; codigoPessoa: number; mes: number; ano: number; status?: string; razao?: string; }

@Component({
  selector: 'app-agendamento-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzMessageModule, NzModalModule,
    NzFormModule, NzSelectModule, NzDatePickerModule, NzDividerModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Agendamento NFE" subtitle="Gerencie os agendamentos de emissão de Nota Fiscal"></app-page-title>

      <!-- KPIs -->
      <div class="kpis">
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="schedule" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ lista.length }}</div><div class="kpi-label">Agendamentos</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="check-circle" style="color:#52c41a"></i></div>
          <div class="kpi-value green" *ngIf="!loading">{{ concluidos }}</div><div class="kpi-label">Concluídos</div></nz-card>
        <nz-card class="kpi"><div class="kpi-icon"><i nz-icon nzType="clock-circle" style="color:#fa8c16"></i></div>
          <div class="kpi-value orange" *ngIf="!loading">{{ pendentes }}</div><div class="kpi-label">Pendentes</div></nz-card>
        <nz-card class="kpi kpi-action" nzBordered (click)="abrirModal()">
          <div class="kpi-icon"><i nz-icon nzType="plus-circle" style="color:#722ed1"></i></div>
          <div class="kpi-value purple"><button nz-button nzType="primary" nzShape="round" nzSize="small"><i nz-icon nzType="plus"></i></button></div>
          <div class="kpi-label">Novo Agendamento</div>
        </nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
        <nz-table *ngIf="!loading" [nzData]="lista" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="15">
          <thead><tr>
            <th>Razão Social</th>
            <th nzWidth="110px" nzAlign="center">Mês/Ano</th>
            <th nzWidth="120px" nzAlign="center">Status</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let a of lista">
              <td>{{ a.razao || '—' }}</td>
              <td nzAlign="center">{{ a.mes | number:'2.0' }}/{{ a.ano }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="a.status==='Concluido'?'green':'orange'">{{ a.status || 'Agendado' }}</nz-tag></td>
            </tr>
            <tr *ngIf="lista.length===0"><td colspan="3" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum agendamento encontrado.</td></tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-modal [(nzVisible)]="modalVisible" nzTitle="Novo Agendamento DAS" [nzWidth]="480" [nzFooter]="ftModal" (nzOnCancel)="modalVisible=false">
      <ng-container *nzModalContent>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Cliente</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="novoAg.codigoPessoa" style="width:100%" nzShowSearch nzPlaceHolder="Selecione o cliente">
              <nz-option *ngFor="let p of pessoas" [nzValue]="p.codigo" [nzLabel]="p.razao||p.nome"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <div style="display:flex;gap:12px">
          <nz-form-item style="flex:1"><nz-form-label [nzSpan]="24" nzRequired>Mês</nz-form-label>
            <nz-form-control [nzSpan]="24"><nz-select [(ngModel)]="novoAg.mes" style="width:100%">
              <nz-option *ngFor="let m of meses" [nzValue]="m.v" [nzLabel]="m.l"></nz-option>
            </nz-select></nz-form-control>
          </nz-form-item>
          <nz-form-item style="flex:1"><nz-form-label [nzSpan]="24" nzRequired>Ano</nz-form-label>
            <nz-form-control [nzSpan]="24"><nz-select [(ngModel)]="novoAg.ano" style="width:100%">
              <nz-option *ngFor="let a of anos" [nzValue]="a" [nzLabel]="a"></nz-option>
            </nz-select></nz-form-control>
          </nz-form-item>
        </div>
      </ng-container>
      <ng-template #ftModal>
        <button nz-button (click)="modalVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvar()" [nzLoading]="salvando">Agendar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`.page{padding:8px 4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.kpi{flex:1;min-width:150px;text-align:center}.kpi-icon{font-size:24px;margin-bottom:6px}.kpi-label{color:rgba(0,0,0,.45);font-size:.88rem}.kpi-value{font-size:1.4rem;font-weight:800;margin:4px 0}.kpi-value.primary{color:#1890ff}.kpi-value.green{color:#52c41a}.kpi-value.orange{color:#fa8c16}.kpi-value.purple{color:#722ed1}.kpi-action{cursor:pointer}`]
})
export class AgendamentoNfeComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: AgendamentoDAS[] = []; pessoas: any[] = [];
  salvando = false; modalVisible = false;
  get concluidos(): number { return this.lista.filter(a => a.status === 'Concluido').length; }
  get pendentes(): number { return this.lista.filter(a => a.status !== 'Concluido').length; }
  novoAg: AgendamentoDAS = { codigoPessoa: 0, mes: new Date().getMonth() + 1, ano: new Date().getFullYear() };
  meses = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ v: m, l: m.toString().padStart(2,'0') + ' — ' + ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m-1] }));
  anos: number[] = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(8000), catchError(() => of([] as T[])));
    forkJoin({
      agendamentos: safe<AgendamentoDAS>(this.http.get<AgendamentoDAS[]>(`${this.api}/DAS/AgendamentoDAS/Lista`, { headers: this.h })),
      pessoas:      safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({ next: ({ agendamentos, pessoas }) => {
      this.pessoas = pessoas as any[];
      const pm = new Map<number, any>(); (pessoas as any[]).forEach(p => pm.set(p.codigo, p));
      this.lista = (agendamentos as AgendamentoDAS[]).map(a => ({ ...a, razao: pm.get(a.codigoPessoa)?.razao }));
      this.loading = false; this.cdr.markForCheck();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }
  abrirModal() { this.novoAg = { codigoPessoa: 0, mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }; this.modalVisible = true; this.cdr.markForCheck(); }
  salvar() {
    if (!this.novoAg.codigoPessoa) { this.message.warning('Selecione um cliente.'); return; }
    this.salvando = true; this.cdr.markForCheck();
    this.http.post(`${this.api}/DAS/AgendamentoDAS/Cadastro`, this.novoAg, { headers: this.h }).subscribe({
      next: () => { this.message.success('Agendamento criado!'); this.salvando = false; this.modalVisible = false; this.carregar(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
    });
  }
}
