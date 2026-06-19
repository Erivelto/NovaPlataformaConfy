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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface StatusAgendamento {
  execusao: number;
  erro: number;
  sucesso: number;
  aguardando: number;
}

interface ListaStatusAgendamento {
  codigo: number;
  codigoPessoa: number;
  documento: string;
  razao: string;
  dataPrimeiraEmissao: string;
  valor: string;
  status: string;
}

interface CorpoEmissaoNota {
  codigo: number;
  codigoEmissaoNota: number;
  codigoPessoa: number;
  codigoTomador: number;
  descricao: string;
  valor: string;
  dataPrimeiraEmissao: string;
  repetir: boolean;
  codigoServico: string;
  excluido: boolean;
  status: string;
}

interface Pessoa {
  codigo: number;
  nome?: string;
  razao?: string;
  documento?: string;
  incricaoMunicipal?: string;
  descricaoAtividade?: string;
  cnae?: string;
}

interface TomadorEmissaoNota {
  codigo: number;
  documento?: string;
  razao?: string;
  nome?: string;
  email?: string;
  telefone?: string;
}

interface DadosEmissaoNota {
  codigo: number;
  codigoPessoa: number;
  usuario?: string;
  senha?: string;
  pessoaCodigoServico?: string;
  excluido?: boolean;
}

@Component({
  selector: 'app-agendamento-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzInputModule, NzMessageModule, NzModalModule,
    NzDividerModule, NzGridModule, NzPopconfirmModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Agendamento emissão NFE" subtitle="Monitoramento e interação dos agendamentos de nota fiscal do mês"></app-page-title>

      <div class="kpis">
        <nz-card class="kpi" *ngFor="let k of kpiStats; trackBy: trackByKpi">
          <div class="kpi-icon"><i nz-icon [nzType]="k.icon" [style.color]="k.color"></i></div>
          <div class="kpi-value" [style.color]="k.color" *ngIf="!loading">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <div class="toolbar">
          <nz-input-group [nzPrefix]="prefixIcon" style="max-width:320px">
            <input nz-input placeholder="Pesquisar..." [(ngModel)]="busca" (ngModelChange)="onBuscaChange()" />
          </nz-input-group>
          <ng-template #prefixIcon><i nz-icon nzType="search"></i></ng-template>
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          [nzData]="listaFiltrada"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="true"
          [nzPageSize]="10"
          [nzFrontPagination]="true"
          nzShowSizeChanger="false">
          <thead>
            <tr>
              <th nzWidth="80px">Código</th>
              <th nzWidth="100px">Cód. Cliente</th>
              <th nzWidth="140px">CNPJ</th>
              <th>Nome</th>
              <th nzWidth="110px">Data</th>
              <th nzWidth="100px" [nzSortFn]="sortValor">Valor</th>
              <th nzWidth="150px">Status</th>
              <th nzWidth="110px" nzAlign="center"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of listaFiltrada; trackBy: trackByCodigo" [style.color]="corStatus(item.status)">
              <td>{{ item.codigo }}</td>
              <td>{{ item.codigoPessoa }}</td>
              <td>{{ item.documento }}</td>
              <td>{{ item.razao }}</td>
              <td>{{ item.dataPrimeiraEmissao }}</td>
              <td>{{ item.valor }}</td>
              <td>{{ item.status }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" nzShape="round" (click)="abrirDetalhes(item)">
                  <i nz-icon nzType="edit"></i> Detalhes
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length === 0">
              <td colspan="8" class="empty">Nenhum agendamento encontrado.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-modal
      *ngIf="modalVisible"
      [(nzVisible)]="modalVisible"
      nzTitle="Interação ao Agendamento"
      [nzWidth]="900"
      [nzFooter]="ftDetalhe"
      (nzOnCancel)="fecharDetalhes()">
      <ng-container *nzModalContent>
        <ng-container *ngIf="carregandoDetalhe">
          <nz-skeleton [nzActive]="true" [nzParagraph]="{rows:10}"></nz-skeleton>
        </ng-container>

        <ng-container *ngIf="!carregandoDetalhe && detalhe">
          <h4 class="sec-title"><i nz-icon nzType="bank"></i> Empresa</h4>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12"><label class="fld-label">Nome</label><div class="fld-value">{{ detalhe.pessoa?.nome || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Razão Social</label><div class="fld-value">{{ detalhe.pessoa?.razao || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Documento</label><div class="fld-value">{{ detalhe.pessoa?.documento || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Inscrição Municipal</label><div class="fld-value">{{ detalhe.pessoa?.incricaoMunicipal || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Atividade</label><div class="fld-value">{{ detalhe.pessoa?.descricaoAtividade || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">CNAE</label><div class="fld-value">{{ detalhe.pessoa?.cnae || '—' }}</div></div>
          </div>

          <nz-divider></nz-divider>
          <h4 class="sec-title"><i nz-icon nzType="user"></i> Tomador</h4>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="8"><label class="fld-label">Documento</label><div class="fld-value">{{ detalhe.tomador?.documento || '—' }}</div></div>
            <div nz-col [nzSpan]="8"><label class="fld-label">Razão / Nome</label><div class="fld-value">{{ detalhe.tomador?.razao || detalhe.tomador?.nome || '—' }}</div></div>
            <div nz-col [nzSpan]="8"><label class="fld-label">E-mail</label><div class="fld-value">{{ detalhe.tomador?.email || '—' }}</div></div>
          </div>

          <nz-divider></nz-divider>
          <h4 class="sec-title"><i nz-icon nzType="file-text"></i> Emissão</h4>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="8"><label class="fld-label">Usuário Prefeitura</label><div class="fld-value">{{ detalhe.dadosEmissao?.usuario || '—' }}</div></div>
            <div nz-col [nzSpan]="8"><label class="fld-label">Código Prefeitura</label><div class="fld-value">{{ detalhe.dadosEmissao?.pessoaCodigoServico || '—' }}</div></div>
            <div nz-col [nzSpan]="8"><label class="fld-label">Status</label><div class="fld-value" [style.color]="corStatus(detalhe.statusLabel)">{{ detalhe.statusLabel }}</div></div>
            <div nz-col [nzSpan]="24"><label class="fld-label">Descrição</label><div class="fld-value">{{ detalhe.corpo?.descricao || '—' }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Data</label><div class="fld-value">{{ formatarData(detalhe.corpo?.dataPrimeiraEmissao) }}</div></div>
            <div nz-col [nzSpan]="12"><label class="fld-label">Valor</label><div class="fld-value">{{ detalhe.corpo?.valor || '—' }}</div></div>
          </div>

          <div *ngIf="detalhe.corpo?.status !== 'O'" class="erro-banner">
            <i nz-icon nzType="warning" nzTheme="fill"></i> Agendamento com erro ou pendente
          </div>
        </ng-container>
      </ng-container>

      <ng-template #ftDetalhe>
        <button nz-button (click)="fecharDetalhes()" [disabled]="acaoEmAndamento">Fechar</button>
        <ng-container *ngIf="detalhe?.corpo?.status !== 'O'">
          <button nz-button nzType="default" (click)="reenviarAgendamento()" [nzLoading]="acaoEmAndamento">Reenviar Agendamento</button>
          <button nz-button nzType="primary" (click)="emitidoManualmente()" [nzLoading]="acaoEmAndamento">Emitido Manualmente</button>
          <button
            nz-button
            nzType="primary"
            nzDanger
            nz-popconfirm
            nzPopconfirmTitle="Remover este agendamento?"
            (nzOnConfirm)="removerAgendamento()"
            [nzLoading]="acaoEmAndamento">
            Remover Agendamento
          </button>
        </ng-container>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 150px; text-align: center; }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; }
    .kpi-value { font-size: 1.4rem; font-weight: 800; margin: 4px 0; }
    .toolbar { margin-bottom: 12px; }
    .empty { text-align: center; padding: 32px; color: rgba(0,0,0,.45); }
    .sec-title { font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .fld-label { display: block; color: rgba(0,0,0,.45); font-size: .82rem; margin-bottom: 4px; }
    .fld-value { margin-bottom: 12px; word-break: break-word; }
    .erro-banner { margin-top: 16px; padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; color: #cf1322; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  `]
})
export class AgendamentoNfeComponent implements OnInit {
  private readonly api = environment.apiUrl;
  private buscaTimer?: ReturnType<typeof setTimeout>;

  loading = true;
  lista: ListaStatusAgendamento[] = [];
  listaFiltrada: ListaStatusAgendamento[] = [];
  busca = '';

  kpiStats: { label: string; value: number; icon: string; color: string }[] = [];

  modalVisible = false;
  carregandoDetalhe = false;
  acaoEmAndamento = false;
  detalhe: {
    corpo: CorpoEmissaoNota;
    pessoa?: Pessoa;
    tomador?: TomadorEmissaoNota;
    dadosEmissao?: DadosEmissaoNota;
    statusLabel: string;
  } | null = null;

  sortValor = (a: ListaStatusAgendamento, b: ListaStatusAgendamento) =>
    this.parseValor(a.valor) - this.parseValor(b.valor);

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  trackByKpi(_: number, k: { label: string }): string { return k.label; }
  trackByCodigo(_: number, item: ListaStatusAgendamento): number { return item.codigo; }

  carregar(): void {
    this.loading = true;
    const statusDefault: StatusAgendamento = { execusao: 0, erro: 0, sucesso: 0, aguardando: 0 };

    forkJoin({
      status: this.http.get<StatusAgendamento>(`${this.api}/CorpoEmissaoNota/RetornaStatusAgendamento`, { headers: this.h })
        .pipe(timeout(12000), catchError(() => of(statusDefault))),
      lista: this.http.get<ListaStatusAgendamento[]>(`${this.api}/CorpoEmissaoNota/RetornaStatusAgendamentoLista`, { headers: this.h })
        .pipe(timeout(12000), catchError(() => of([] as ListaStatusAgendamento[])))
    }).subscribe({
      next: ({ status, lista }) => {
        const s = status ?? statusDefault;
        this.kpiStats = [
          { label: 'Erro', value: s.erro ?? 0, icon: 'close-circle', color: '#ff4d4f' },
          { label: 'Executando', value: s.execusao ?? 0, icon: 'loading', color: '#d4a017' },
          { label: 'Sucesso', value: s.sucesso ?? 0, icon: 'check-circle', color: '#52c41a' },
          { label: 'Aguardando', value: s.aguardando ?? 0, icon: 'clock-circle', color: '#1890ff' }
        ];
        this.lista = lista.map((item: ListaStatusAgendamento | Record<string, unknown>) => this.normalizarItem(item));
        this.ordenarPorValor();
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Erro ao carregar agendamentos NFE.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onBuscaChange(): void {
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => {
      this.aplicarFiltro();
      this.cdr.markForCheck();
    }, 250);
  }

  aplicarFiltro(): void {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) {
      this.listaFiltrada = [...this.lista];
      return;
    }
    this.listaFiltrada = this.lista.filter(item =>
      [item.codigo, item.codigoPessoa, item.documento, item.razao, item.dataPrimeiraEmissao, item.valor, item.status]
        .some(v => String(v ?? '').toLowerCase().includes(termo))
    );
  }

  corStatus(status: string): string {
    switch (status) {
      case 'Sucesso': return '#389e0d';
      case 'Aguardando Execução': return '#4169e1';
      case 'Erro': return '#cf1322';
      case 'Executando': return '#B18904';
      default: return '#B18904';
    }
  }

  abrirDetalhes(item: ListaStatusAgendamento): void {
    this.modalVisible = true;
    this.carregandoDetalhe = true;
    this.detalhe = null;
    this.cdr.markForCheck();

    const codigo = item.codigo;
    this.http.get<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota/${codigo}`, { headers: this.h })
      .pipe(catchError(() => of(null)))
      .subscribe(corpo => {
        if (!corpo) {
          this.message.error('Agendamento não encontrado.');
          this.carregandoDetalhe = false;
          this.cdr.markForCheck();
          return;
        }

        forkJoin({
          pessoa: this.http.get<Pessoa>(`${this.api}/Pessoa/${corpo.codigoPessoa}`, { headers: this.h }).pipe(catchError(() => of(null))),
          tomadores: this.http.get<TomadorEmissaoNota[]>(`${this.api}/TomadorEmissaoNota/${corpo.codigoPessoa}`, { headers: this.h }).pipe(catchError(() => of([]))),
          dadosLista: this.http.get<DadosEmissaoNota[]>(`${this.api}/DadosEmissaoNota`, { headers: this.h }).pipe(catchError(() => of([])))
        }).subscribe(({ pessoa, tomadores, dadosLista }) => {
          const tomador = (tomadores || []).find(t => t.codigo === corpo.codigoTomador);
          const dadosEmissao = (dadosLista || []).find(d => d.codigoPessoa === corpo.codigoPessoa && !d.excluido);
          this.detalhe = {
            corpo,
            pessoa: pessoa || undefined,
            tomador,
            dadosEmissao,
            statusLabel: item.status
          };
          this.carregandoDetalhe = false;
          this.cdr.markForCheck();
        });
      });
  }

  fecharDetalhes(): void {
    this.modalVisible = false;
    this.detalhe = null;
    this.cdr.markForCheck();
  }

  reenviarAgendamento(): void {
    if (!this.detalhe?.corpo) return;
    this.acaoEmAndamento = true;
    const corpo = { ...this.detalhe.corpo, status: 'C', dataPrimeiraEmissao: new Date().toISOString() };
    this.http.put<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota`, corpo, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Agendamento reenviado.');
        this.acaoEmAndamento = false;
        this.fecharDetalhes();
        this.carregar();
      },
      error: () => {
        this.message.error('Erro ao reenviar agendamento.');
        this.acaoEmAndamento = false;
        this.cdr.markForCheck();
      }
    });
  }

  emitidoManualmente(): void {
    if (!this.detalhe?.corpo) return;
    const codigo = this.detalhe.corpo.codigo;
    const codigoPessoa = this.detalhe.corpo.codigoPessoa;
    this.acaoEmAndamento = true;

    this.http.get<boolean>(`${this.api}/NotaFiscal/AdicionarDeAgendamento/${codigo}`, { headers: this.h })
      .pipe(catchError(() => of(false)))
      .subscribe(ok => {
        if (!ok) {
          this.message.error('Não foi possível registrar a emissão manual.');
          this.acaoEmAndamento = false;
          this.cdr.markForCheck();
          return;
        }
        this.http.get<number>(`${this.api}/NotaFiscal/NotaFiscal/UltimaNfe/${codigoPessoa}`, { headers: this.h })
          .pipe(catchError(() => of(0)))
          .subscribe(ultimaNfe => {
            const corpo = {
              ...this.detalhe!.corpo,
              status: 'O',
              dataPrimeiraEmissao: new Date().toISOString(),
              codigoEmissaoNota: ultimaNfe || this.detalhe!.corpo.codigoEmissaoNota
            };
            this.http.put<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota`, corpo, { headers: this.h }).subscribe({
              next: () => {
                this.message.success('Agendamento marcado como emitido manualmente.');
                this.acaoEmAndamento = false;
                this.fecharDetalhes();
                this.carregar();
              },
              error: () => {
                this.message.error('Erro ao atualizar status do agendamento.');
                this.acaoEmAndamento = false;
                this.cdr.markForCheck();
              }
            });
          });
      });
  }

  removerAgendamento(): void {
    if (!this.detalhe?.corpo) return;
    this.acaoEmAndamento = true;
    this.http.delete(`${this.api}/CorpoEmissaoNota/${this.detalhe.corpo.codigo}`, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Agendamento removido.');
        this.acaoEmAndamento = false;
        this.fecharDetalhes();
        this.carregar();
      },
      error: () => {
        this.message.error('Erro ao remover agendamento.');
        this.acaoEmAndamento = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatarData(data?: string): string {
    if (!data) return '—';
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
  }

  private normalizarItem(item: any): ListaStatusAgendamento {
    return {
      codigo: item.codigo ?? item.Codigo,
      codigoPessoa: item.codigoPessoa ?? item.CodigoPessoa,
      documento: item.documento ?? item.Documento ?? '',
      razao: item.razao ?? item.Razao ?? '',
      dataPrimeiraEmissao: item.dataPrimeiraEmissao ?? item.DataPrimeiraEmissao ?? '',
      valor: item.valor ?? item.Valor ?? '',
      status: item.status ?? item.Status ?? ''
    };
  }

  private ordenarPorValor(): void {
    this.lista.sort((a, b) => this.parseValor(a.valor) - this.parseValor(b.valor));
  }

  private parseValor(valor: string): number {
    if (!valor) return 0;
    const n = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
}
