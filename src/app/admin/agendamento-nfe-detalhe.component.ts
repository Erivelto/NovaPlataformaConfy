import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

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
  fantasia?: string;
  incrMunicipal?: string;
  logradouro?: string;
  numeroLogradouro?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  email?: string;
}

interface DadosEmissaoNota {
  codigo: number;
  codigoPessoa: number;
  usuario?: string;
  senha?: string;
  prefeitura?: string;
  codigoPrefeitura?: string;
  pessoaCodigoServico?: unknown;
  excluido?: boolean;
}

@Component({
  selector: 'app-agendamento-nfe-detalhe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule,
    NzCardModule, NzButtonModule, NzIconModule, NzSkeletonModule,
    NzCollapseModule, NzGridModule, NzDividerModule, NzAlertModule,
    NzPopconfirmModule, NzMessageModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <app-page-title
          title="Interação ao Agendamento"
          [subtitle]="subtitulo">
        </app-page-title>
        <button nz-button (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 12 }"></nz-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading && corpo">
        <nz-card nzTitle="Empresa" [nzExtra]="empresaExtra">
          <ng-template #empresaExtra><span class="card-sub">Dados cadastrais</span></ng-template>
          <div nz-row [nzGutter]="[16, 8]">
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Nome Fantasia</label><div class="fld-value">{{ pessoa?.nome || '—' }}</div></div>
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Razão Social</label><div class="fld-value">{{ pessoa?.razao || '—' }}</div></div>
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">CNPJ</label><div class="fld-value">{{ pessoa?.documento || '—' }}</div></div>
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Inscrição Municipal</label><div class="fld-value">{{ pessoa?.incricaoMunicipal || '—' }}</div></div>
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Atividade</label><div class="fld-value">{{ pessoa?.descricaoAtividade || '—' }}</div></div>
            <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">CNAE</label><div class="fld-value">{{ pessoa?.cnae || '—' }}</div></div>
          </div>
        </nz-card>

        <nz-collapse class="panels" [nzBordered]="true">
          <nz-collapse-panel nzHeader="Tomador" [nzActive]="true">
            <div nz-row [nzGutter]="[16, 8]">
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Documento</label><div class="fld-value">{{ tomador?.documento || '—' }}</div></div>
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Fantasia</label><div class="fld-value">{{ tomador?.fantasia || '—' }}</div></div>
              <div nz-col [nzSpan]="8" [nzXs]="24"><label class="fld-label">Razão</label><div class="fld-value">{{ tomador?.razao || '—' }}</div></div>
              <div nz-col [nzSpan]="4" [nzXs]="24"><label class="fld-label">Inscr. Municipal</label><div class="fld-value">{{ tomador?.incrMunicipal || '—' }}</div></div>
              <div nz-col [nzSpan]="16" [nzXs]="24"><label class="fld-label">Logradouro</label><div class="fld-value">{{ tomador?.logradouro || '—' }}</div></div>
              <div nz-col [nzSpan]="8" [nzXs]="24"><label class="fld-label">Número</label><div class="fld-value">{{ tomador?.numeroLogradouro || '—' }}</div></div>
              <div nz-col [nzSpan]="8" [nzXs]="24"><label class="fld-label">Complemento</label><div class="fld-value">{{ tomador?.complemento || '—' }}</div></div>
              <div nz-col [nzSpan]="8" [nzXs]="24"><label class="fld-label">Bairro</label><div class="fld-value">{{ tomador?.bairro || '—' }}</div></div>
              <div nz-col [nzSpan]="8" [nzXs]="24"><label class="fld-label">Cidade</label><div class="fld-value">{{ tomador?.cidade || '—' }}</div></div>
              <div nz-col [nzSpan]="4" [nzXs]="24"><label class="fld-label">UF</label><div class="fld-value">{{ tomador?.uf || '—' }}</div></div>
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">CEP</label><div class="fld-value">{{ tomador?.cep || '—' }}</div></div>
              <div nz-col [nzSpan]="10" [nzXs]="24"><label class="fld-label">E-mail</label><div class="fld-value">{{ tomador?.email || '—' }}</div></div>
            </div>
          </nz-collapse-panel>

          <nz-collapse-panel nzHeader="Dados Emissão" [nzActive]="true">
            <div nz-row [nzGutter]="[16, 8]">
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Prefeitura</label><div class="fld-value">{{ dadosEmissao?.prefeitura || '—' }}</div></div>
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Usuário</label><div class="fld-value">{{ dadosEmissao?.usuario || '—' }}</div></div>
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Senha</label><div class="fld-value">{{ dadosEmissao?.senha || '—' }}</div></div>
              <div nz-col [nzSpan]="6" [nzXs]="24"><label class="fld-label">Código Prefeitura</label><div class="fld-value">{{ codigoPrefeitura || '—' }}</div></div>
              <div nz-col [nzSpan]="24"><label class="fld-label">Descrição</label><div class="fld-value fld-block">{{ corpo.descricao || '—' }}</div></div>
              <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Data</label><div class="fld-value">{{ formatarData(corpo.dataPrimeiraEmissao) }}</div></div>
              <div nz-col [nzSpan]="12" [nzXs]="24"><label class="fld-label">Valor</label><div class="fld-value">{{ corpo.valor || '—' }}</div></div>
            </div>
          </nz-collapse-panel>
        </nz-collapse>

        <ng-container *ngIf="corpo.status !== 'O'">
          <nz-alert
            nzType="error"
            nzShowIcon
            nzMessage="Agendamento com erro"
            nzDescription="Utilize as ações abaixo para reenviar, marcar como emitido manualmente ou remover o agendamento."
            style="margin-top:16px">
          </nz-alert>

          <div class="acoes">
            <button nz-button nzType="default" (click)="reenviarAgendamento()" [nzLoading]="acaoEmAndamento">
              Reenviar Agendamento
            </button>
            <button nz-button nzType="primary" (click)="emitidoManualmente()" [nzLoading]="acaoEmAndamento">
              Emitido Manualmente
            </button>
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
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .page-header app-page-title { flex: 1; min-width: 220px; }
    .card-sub { color: rgba(0,0,0,.45); font-size: .85rem; }
    .panels { margin-top: 14px; }
    .fld-label { display: block; color: rgba(0,0,0,.55); font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
    .fld-value { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 6px 10px; min-height: 34px; margin-bottom: 8px; word-break: break-word; }
    .fld-block { white-space: pre-wrap; min-height: 60px; }
    .acoes { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  `]
})
export class AgendamentoNfeDetalheComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  acaoEmAndamento = false;
  codigo = 0;
  statusLista = '';
  corpo: CorpoEmissaoNota | null = null;
  pessoa: Pessoa | null = null;
  tomador: TomadorEmissaoNota | null = null;
  dadosEmissao: DadosEmissaoNota | null = null;

  get subtitulo(): string {
    if (!this.corpo) return 'Carregando agendamento...';
    const parts = [`Código #${this.corpo.codigo}`];
    if (this.statusLista) parts.push(this.statusLista);
    return parts.join(' · ');
  }

  get codigoPrefeitura(): string {
    const d = this.dadosEmissao;
    if (!d) return '';
    if (d.codigoPrefeitura) return d.codigoPrefeitura;
    const svc = d.pessoaCodigoServico;
    if (typeof svc === 'string') return svc;
    if (Array.isArray(svc) && svc.length) {
      const first = svc[0] as Record<string, unknown>;
      return String(first?.['codigoServico'] ?? first?.['CodigoServico'] ?? first?.['codigo'] ?? first?.['Codigo'] ?? '');
    }
    return '';
  }

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.codigo = +this.route.snapshot.paramMap.get('codigo')!;
    this.statusLista = this.route.snapshot.queryParamMap.get('status') || '';
    if (!this.codigo) {
      this.message.error('Código do agendamento inválido.');
      this.voltar();
      return;
    }
    this.carregar();
  }

  voltar(): void {
    this.router.navigate(['/administrativo/agendamento-nfe']);
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.http.get<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota/${this.codigo}`, { headers: this.h })
      .pipe(timeout(12000), catchError(() => of(null)))
      .subscribe(rawCorpo => {
        const corpo = rawCorpo ? this.mapCorpo(rawCorpo) : null;
        if (!corpo) {
          this.message.error('Agendamento não encontrado.');
          this.loading = false;
          this.voltar();
          return;
        }
        this.corpo = corpo;

        forkJoin({
          pessoa: this.http.get<Pessoa>(`${this.api}/Pessoa/${corpo.codigoPessoa}`, { headers: this.h }).pipe(catchError(() => of(null))),
          tomadores: this.http.get<TomadorEmissaoNota[]>(`${this.api}/TomadorEmissaoNota/${corpo.codigoPessoa}`, { headers: this.h }).pipe(catchError(() => of([]))),
          dadosLista: this.http.get<DadosEmissaoNota[]>(`${this.api}/DadosEmissaoNota`, { headers: this.h }).pipe(catchError(() => of([])))
        }).subscribe(({ pessoa, tomadores, dadosLista }) => {
          this.pessoa = pessoa ? this.mapPessoa(pessoa) : null;
          const listaTomador = (tomadores || []).map(t => this.mapTomador(t));
          this.tomador = listaTomador.find(t => t.codigo === corpo.codigoTomador) || null;
          const listaDados = (dadosLista || []).map(d => this.mapDadosEmissao(d));
          this.dadosEmissao = listaDados.find(d => d.codigoPessoa === corpo.codigoPessoa && !d.excluido) || null;
          this.loading = false;
          this.cdr.markForCheck();
        });
      });
  }

  reenviarAgendamento(): void {
    if (!this.corpo) return;
    this.acaoEmAndamento = true;
    this.cdr.markForCheck();
    const payload = { ...this.corpo, status: 'C', dataPrimeiraEmissao: new Date().toISOString() };
    this.http.put<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota`, payload, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Agendamento reenviado.');
        this.acaoEmAndamento = false;
        this.voltar();
      },
      error: () => {
        this.message.error('Erro ao reenviar agendamento.');
        this.acaoEmAndamento = false;
        this.cdr.markForCheck();
      }
    });
  }

  emitidoManualmente(): void {
    if (!this.corpo) return;
    const codigo = this.corpo.codigo;
    const codigoPessoa = this.corpo.codigoPessoa;
    this.acaoEmAndamento = true;
    this.cdr.markForCheck();

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
            const payload = {
              ...this.corpo!,
              status: 'O',
              dataPrimeiraEmissao: new Date().toISOString(),
              codigoEmissaoNota: ultimaNfe || this.corpo!.codigoEmissaoNota
            };
            this.http.put<CorpoEmissaoNota>(`${this.api}/CorpoEmissaoNota`, payload, { headers: this.h }).subscribe({
              next: () => {
                this.message.success('Agendamento marcado como emitido manualmente.');
                this.acaoEmAndamento = false;
                this.voltar();
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
    if (!this.corpo) return;
    this.acaoEmAndamento = true;
    this.cdr.markForCheck();
    this.http.delete(`${this.api}/CorpoEmissaoNota/${this.corpo.codigo}`, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Agendamento removido.');
        this.acaoEmAndamento = false;
        this.voltar();
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
    return d.toLocaleString('pt-BR');
  }

  private mapCorpo(raw: unknown): CorpoEmissaoNota {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo']),
      codigoEmissaoNota: Number(r['codigoEmissaoNota'] ?? r['CodigoEmissaoNota'] ?? 0),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa']),
      codigoTomador: Number(r['codigoTomador'] ?? r['CodigoTomador']),
      descricao: String(r['descricao'] ?? r['Descricao'] ?? ''),
      valor: String(r['valor'] ?? r['Valor'] ?? ''),
      dataPrimeiraEmissao: String(r['dataPrimeiraEmissao'] ?? r['DataPrimeiraEmissao'] ?? ''),
      repetir: Boolean(r['repetir'] ?? r['Repetir']),
      codigoServico: String(r['codigoServico'] ?? r['CodigoServico'] ?? ''),
      excluido: Boolean(r['excluido'] ?? r['Excluido']),
      status: String(r['status'] ?? r['Status'] ?? '')
    };
  }

  private mapPessoa(raw: unknown): Pessoa {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo']),
      nome: String(r['nome'] ?? r['Nome'] ?? ''),
      razao: String(r['razao'] ?? r['Razao'] ?? ''),
      documento: String(r['documento'] ?? r['Documento'] ?? ''),
      incricaoMunicipal: String(r['incricaoMunicipal'] ?? r['IncricaoMunicipal'] ?? ''),
      descricaoAtividade: String(r['descricaoAtividade'] ?? r['DescricaoAtividade'] ?? ''),
      cnae: String(r['cnae'] ?? r['CNAE'] ?? '')
    };
  }

  private mapTomador(raw: unknown): TomadorEmissaoNota {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo']),
      documento: String(r['documento'] ?? r['Documento'] ?? ''),
      razao: String(r['razao'] ?? r['Razao'] ?? ''),
      fantasia: String(r['fantasia'] ?? r['Fantasia'] ?? ''),
      incrMunicipal: String(r['incrMunicipal'] ?? r['IncrMunicipal'] ?? ''),
      logradouro: String(r['logradouro'] ?? r['Logradouro'] ?? ''),
      numeroLogradouro: String(r['numeroLogradouro'] ?? r['NumeroLogradouro'] ?? ''),
      complemento: String(r['complemento'] ?? r['Complemento'] ?? ''),
      bairro: String(r['bairro'] ?? r['Bairro'] ?? ''),
      cidade: String(r['cidade'] ?? r['Cidade'] ?? ''),
      uf: String(r['uf'] ?? r['UF'] ?? ''),
      cep: String(r['cep'] ?? r['CEP'] ?? ''),
      email: String(r['email'] ?? r['Email'] ?? '')
    };
  }

  private mapDadosEmissao(raw: unknown): DadosEmissaoNota {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo']),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa']),
      usuario: String(r['usuario'] ?? r['Usuario'] ?? ''),
      senha: String(r['senha'] ?? r['Senha'] ?? ''),
      prefeitura: String(r['prefeitura'] ?? r['Prefeitura'] ?? ''),
      codigoPrefeitura: String(r['codigoPrefeitura'] ?? r['CodigoPrefeitura'] ?? ''),
      pessoaCodigoServico: r['pessoaCodigoServico'] ?? r['PessoaCodigoServico'],
      excluido: Boolean(r['excluido'] ?? r['Excluido'])
    };
  }
}
