import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

interface NotaFiscal {
  numeroNFE: number;
  dataEmissao: string;
  cancelada?: boolean;
  dataCancelamento?: string | null;
  valorTotal?: number;
  valor?: string | number;
  tomador?: string;
  descricao?: string;
}

@Component({
  selector: 'app-notas-fiscais',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzModalModule,
    NzSkeletonModule, NzDividerModule, NzButtonModule,
    NzFormModule, NzInputModule,
    PageTitleComponent
  ],
  template: `
    <div class="notas-fiscais">
      <app-page-title title="Notas Fiscais" subtitle="Consulte suas notas fiscais emitidas"></app-page-title>

      <nz-card>
        <nz-alert
          *ngIf="erro"
          nzType="error"
          [nzMessage]="erro"
          nzShowIcon
          style="margin-bottom:12px">
        </nz-alert>

        <div style="margin-bottom:12px; text-align:right;">
          <button nz-button nzType="primary" (click)="abrirAdicionarModal()">
            <i nz-icon nzType="plus"></i> Adic. Total NF
          </button>
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 6 }"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          [nzData]="notas"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="notas.length > 10"
          [nzPageSize]="10">
          <thead>
            <tr>
              <th nzWidth="120px">Nº da Nota</th>
              <th nzWidth="140px">Data de Emissão</th>
              <th>Valor</th>
              <th nzWidth="140px">Status</th>
              <th nzWidth="80px"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of notas" [class.row-cancelada]="item.cancelada">
              <td>{{ item.numeroNFE }}</td>
              <td>{{ item.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valor) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="item.cancelada ? 'red' : 'green'">
                  {{ item.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
              <td>
                <button nz-button nzSize="small" (click)="verDetalhe(item)">
                  <i nz-icon nzType="eye"></i> Ver
                </button>
              </td>
            </tr>
            <tr *ngIf="notas.length === 0">
              <td colspan="5" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px">
                Nenhuma nota fiscal encontrada.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Modal de detalhe -->
    <nz-modal
      [(nzVisible)]="detalheVisible"
      nzTitle="Detalhes da Nota Fiscal"
      [nzWidth]="620"
      [nzFooter]="null"
      (nzOnCancel)="detalheVisible = false">
      <ng-container *nzModalContent>
        <ng-container *ngIf="notaSelecionada">
          <div class="detalhe-grid">
            <div class="detalhe-row">
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="number"></i> Nº da Nota</label>
                <div class="detalhe-value">{{ notaSelecionada.numeroNFE }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="calendar"></i> Data de Emissão</label>
                <div class="detalhe-value">{{ notaSelecionada.dataEmissao | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="dollar"></i> Valor</label>
                <div class="detalhe-value">{{ parseBrl(notaSelecionada.valor) | currency:'BRL':'symbol':'1.2-2' }}</div>
              </div>
            </div>
            <div class="detalhe-row">
              <div class="detalhe-field" style="flex:0 0 auto">
                <label class="detalhe-label"><i nz-icon nzType="info-circle"></i> Status</label>
                <div class="detalhe-value">
                  <nz-tag [nzColor]="notaSelecionada.cancelada ? 'red' : 'green'">
                    {{ notaSelecionada.cancelada ? 'Cancelada' : 'Emitida' }}
                  </nz-tag>
                </div>
              </div>
              <div class="detalhe-field" style="flex:2">
                <label class="detalhe-label"><i nz-icon nzType="user"></i> Tomador(Cliente)</label>
                <div class="detalhe-value">{{ notaSelecionada.tomador || '—' }}</div>
              </div>
            </div>
            <nz-divider></nz-divider>
            <div class="detalhe-field">
              <label class="detalhe-label"><i nz-icon nzType="file-text"></i> Descrição dos Serviços</label>
              <div class="detalhe-value detalhe-descricao">{{ notaSelecionada.descricao || '—' }}</div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </nz-modal>

    <!-- Modal Adic. Total NF -->
    <nz-modal
      [(nzVisible)]="adicionarVisible"
      nzTitle="Adicionar Total NF"
      [nzWidth]="440"
      [nzFooter]="footerAdicionar"
      (nzOnCancel)="fecharAdicionarModal()">
      <ng-container *nzModalContent>
        <nz-alert
          nzType="warning"
          nzMessage="Atenção"
          nzDescription="Por favor, revise o valor informado antes de finalizar a inclusão, pois esses dados serão enviados à Receita Federal. Em caso de erro ou dúvidas, entre em contato conosco imediatamente."
          nzShowIcon
          style="margin-bottom:16px">
        </nz-alert>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Mês/Ano</nz-form-label>
          <nz-form-control [nzSpan]="24" nzExtra="Formato: MM/AAAA">
            <input
              nz-input
              placeholder="MM/AAAA"
              [(ngModel)]="adicionarMesAno"
              maxlength="7"
              (input)="formatarMesAno($event)" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Valor</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input
              nz-input
              [value]="adicionarValor"
              (input)="onAdicionarValorInput($event)"
              placeholder="R$ 0,00"
              inputmode="numeric"
              style="width:220px" />
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #footerAdicionar>
        <button nz-button (click)="fecharAdicionarModal()" [disabled]="salvando">Cancelar</button>
        <button nz-button nzType="primary" (click)="salvarAdicionarNF()" [nzLoading]="salvando">Salvar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .notas-fiscais { padding: 8px 4px; }
    .row-cancelada td { color: #cf1322 !important; }

    /* Detalhe */
    .detalhe-grid { display: flex; flex-direction: column; gap: 16px; }
    .detalhe-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .detalhe-field { flex: 1; min-width: 140px; }
    .detalhe-label { display: block; font-weight: 600; color: rgba(0,0,0,0.55); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .4px; }
    .detalhe-value {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      padding: 6px 10px;
      color: rgba(0,0,0,0.85);
      min-height: 34px;
    }
    .detalhe-descricao { white-space: pre-wrap; min-height: 80px; }
  `]
})
export class NotasFiscaisComponent implements OnInit {
  private readonly apiBase = environment.apiUrl;

  loading = true;
  erro = '';
  notas: NotaFiscal[] = [];

  detalheVisible = false;
  notaSelecionada: NotaFiscal | null = null;

  adicionarVisible = false;
  adicionarMesAno = '';
  adicionarValor = '';
  salvando = false;

  private codigoPessoa = 0;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.codigoPessoa = pessoa.codigo;
    this.carregar();
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  carregar(): void {
    this.loading = true;
    this.erro = '';
    this.http.get<NotaFiscal[]>(`${this.apiBase}/CorpoEmissaoNota/NotasFiscais/${this.codigoPessoa}`, { headers: this.headers }).subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        this.notas = raw
          .map((n: any) => ({
            ...n,
            cancelada: n.cancelada ?? !!n.dataCancelamento,
            valor: n.valorTotal ?? n.valor ?? 0
          }))
          .sort((a: NotaFiscal, b: NotaFiscal) => {
            const nfeA = a.numeroNFE ?? 0;
            const nfeB = b.numeroNFE ?? 0;
            if (nfeB !== nfeA) return nfeB - nfeA;
            return new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime();
          });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar notas fiscais (${err.status}). Tente novamente.`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }

  verDetalhe(nota: NotaFiscal): void {
    this.notaSelecionada = nota;
    this.detalheVisible = true;
  }

  abrirAdicionarModal(): void {
    this.adicionarMesAno = '';
    this.adicionarValor = 'R$ 0,00';
    this.adicionarVisible = true;
  }

  onAdicionarValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '') || '0';
    while (digits.length < 3) digits = '0' + digits;
    const intPart = digits.slice(0, -2);
    const decPart = digits.slice(-2);
    const intFormatted = intPart.replace(/\B(?=(?:\d{3})+(?!\d))/g, '.');
    this.adicionarValor = `R$ ${intFormatted},${decPart}`;
    setTimeout(() => {
      input.value = this.adicionarValor;
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  }

  fecharAdicionarModal(): void {
    this.adicionarVisible = false;
  }

  formatarMesAno(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 6);
    this.adicionarMesAno = v;
    input.value = v;
  }

  salvarAdicionarNF(): void {
    const mesAno = this.adicionarMesAno.trim();
    const valorStr = this.adicionarValor.trim();

    if (!/^\d{2}\/\d{4}$/.test(mesAno)) {
      this.message.warning('Informe o mês/ano no formato MM/AAAA.');
      return;
    }
    if (!valorStr || valorStr === 'R$ 0,00') {
      this.message.warning('Informe o valor.');
      return;
    }

    const [mesStr, anoStr] = mesAno.split('/');
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);

    if (mes < 1 || mes > 12) {
      this.message.warning('Mês inválido.');
      return;
    }

    // Extrai o valor numérico da string formatada (ex: "R$ 1.500,00" -> 1500.00)
    const valorDecimal = parseFloat(valorStr.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorDecimal) || valorDecimal <= 0) {
      this.message.warning('Valor inválido.');
      return;
    }

    this.salvando = true;
    this.cdr.markForCheck();

    this.http
      .get<number>(`${this.apiBase}/NotaFiscal/NotaFiscal/UltimaNfe/${this.codigoPessoa}`, { headers: this.headers })
      .subscribe({
        next: (ultimaNfe) => {
          const nfe = typeof ultimaNfe === 'number' ? ultimaNfe : 0;
          const mesPad = String(mes).padStart(2, '0');
          const body = {
            codigoPessoa: this.codigoPessoa,
            codigoVerificacao: '',
            urlNfe: '',
            dataEmissao: `${ano}-${mesPad}-01T00:00:00`,
            valorTotal: valorDecimal,
            numeroNFE: nfe + 1,
            statusPrefeitura: 'C',
            dataEnvio: new Date().toISOString()
          };

          this.http
            .post(`${this.apiBase}/NotaFiscal`, body, { headers: this.headers })
            .subscribe({
              next: () => {
                this.salvando = false;
                this.adicionarVisible = false;
                this.message.success('Nota fiscal adicionada com sucesso!');
                this.carregar();
                this.cdr.markForCheck();
              },
              error: (err) => {
                this.salvando = false;
                this.message.error(`Erro ao salvar nota fiscal (${err.status}).`);
                this.cdr.markForCheck();
              }
            });
        },
        error: (err) => {
          this.salvando = false;
          this.message.error(`Erro ao buscar última NF (${err.status}).`);
          this.cdr.markForCheck();
        }
      });
  }
}
