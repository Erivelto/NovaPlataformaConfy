import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface InssItem {
  mes: string;
  dataVencimento: string;
  valorParcela: number;
}

interface ParcelamentoDas {
  parcela: number;
  dataVencimento: string;
  valorParcela: number;
}

interface DasItem {
  codigo: number;
  codigoPessoa: number;
  periodo: string;
  valorTributado: string;
  valorTributo: string;
  mensagem: string;
  data: string;
  excluido: boolean;
  status: string;
  nomeArquivo: string;
  statusContfy: string | null;
  documento: string | null;
  razao: string | null;
}

@Component({
  selector: 'app-receita-imposto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzMessageModule,
    PageTitleComponent
  ],
  template: `
    <div class="receita-imposto">
      <app-page-title title="Impostos" subtitle="Impostos e Obrigações"></app-page-title>

      <nz-alert
        nzType="warning"
        nzShowIcon
        nzMessage="Atenção à TFE (Taxa de Fiscalização de Estabelecimentos)"
        nzDescription="Geralmente, a prefeitura envia o boleto desta taxa diretamente para o endereço cadastrado da empresa. Se você não recebeu o documento ou está com o pagamento pendente, entre em contato. Nossa equipe está à disposição para realizar o levantamento dos valores e ajudar na regularização."
        style="margin-top:16px">
      </nz-alert>

      <nz-card nzTitle="DAS">
        <nz-alert
          *ngIf="erro"
          nzType="error"
          [nzMessage]="erro"
          nzShowIcon
          style="margin-bottom:12px">
        </nz-alert>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 4 }"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          [nzData]="lista"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="lista.length > 10">
          <thead>
            <tr>
              <th>Período</th>
              <th>Data Vencimento</th>
              <th>Valor Tributado</th>
              <th>Valor Tributo</th>
              <th nzAlign="center">Status</th>
              <th nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of lista">
              <td>{{ item.periodo }}</td>
              <td>{{ vencimento(item.periodo) | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valorTributado) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ item.valorTributo }}</td>
              <td nzAlign="center">
                <nz-tag *ngIf="item.status !== 'Pago'" [nzColor]="statusDas() === 'Disponível' ? 'green' : 'red'">{{ statusDas() }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button *ngIf="item.status !== 'Pago'" nz-button nzType="primary" nzSize="small" (click)="gerarBoleto(item)" style="margin-right:8px">
                  <i nz-icon nzType="file-text"></i> Gerar Boleto
                </button>
                <button *ngIf="item.status !== 'Pago'" nz-button nzType="default" nzSize="small"
                  [nzLoading]="salvando.has(item.codigo)"
                  (click)="marcarComoPaga(item)">
                  <i nz-icon nzType="check-circle"></i> Marca como paga
                </button>
                <nz-tag *ngIf="item.status === 'Pago'" nzColor="green">Pago</nz-tag>
              </td>
            </tr>
            <tr *ngIf="lista.length === 0">
              <td colspan="6" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px 0;">
                Nenhum DAS encontrado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>

      <nz-card nzTitle="Parcelamento DAS" style="margin-top:16px">
        <nz-table
          [nzData]="listaParcelamento"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="listaParcelamento.length > 10">
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Data Vencimento</th>
              <th>Valor Parcela</th>
              <th nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of listaParcelamento">
              <td>{{ item.parcela }}</td>
              <td>{{ item.dataVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valorParcela) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" (click)="gerarBoletoParcela(item)">
                  <i nz-icon nzType="file-text"></i> Gerar Boleto
                </button>
              </td>
            </tr>
            <tr *ngIf="listaParcelamento.length === 0">
              <td colspan="4" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px 0;">
                Nenhum parcelamento encontrado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>

      <nz-card nzTitle="INSS" style="margin-top:16px">
        <nz-table
          [nzData]="listaInss"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="listaInss.length > 10">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Data Vencimento</th>
              <th>Valor Parcela</th>
              <th nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of listaInss">
              <td>{{ item.mes }}</td>
              <td>{{ item.dataVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valorParcela) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" (click)="gerarBoletoInss(item)">
                  <i nz-icon nzType="file-text"></i> Gerar Boleto
                </button>
              </td>
            </tr>
            <tr *ngIf="listaInss.length === 0">
              <td colspan="4" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px 0;">
                Nenhum registro de INSS encontrado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .receita-imposto { padding: 8px 4px; }
    nz-card { margin-top: 16px; }
  `]
})
export class ReceitaImpostoComponent implements OnInit {
  private readonly dasApiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/DAS';
  private readonly apiBase = environment.apiUrl;

  lista: DasItem[] = [];
  listaParcelamento: ParcelamentoDas[] = [];
  listaInss: InssItem[] = [];
  loading = true;
  erro = '';
  salvando = new Set<number>();

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
    this.http.get<DasItem | DasItem[]>(
      `${this.apiBase}/DAS/ObterListaEnvio/codigoPessoa/${this.codigoPessoa}`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        this.lista = Array.isArray(res) ? res : [res];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar os dados (${err.status}). Tente novamente.`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  statusDas(): string {
    return new Date().getDate() < 20 ? 'Disponível' : 'Vencido';
  }

  vencimento(periodo: string): Date {
    const parts = periodo?.split('/');
    const mes = parts ? parseInt(parts[0], 10) : new Date().getMonth() + 1;
    const ano = parts && parts[1] ? parseInt(parts[1], 10) : new Date().getFullYear();
    return new Date(ano, mes - 1, 20);
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }

  gerarBoletoInss(item: InssItem): void {
    // Implementação futura
    console.log('Gerar boleto INSS:', item);
  }

  gerarBoletoParcela(item: ParcelamentoDas): void {
    // Implementação futura
    console.log('Gerar boleto parcela:', item);
  }

  gerarBoleto(item: DasItem): void {
    const url = `https://armazenamento.contfy.com.br/Arquivos/Resultado?diretorioCompleto=${item.codigoPessoa}&nomeArquivo=${item.nomeArquivo}`;
    window.open(url, '_blank');
  }

  marcarComoPaga(item: DasItem): void {
    if (this.salvando.has(item.codigo)) return;
    this.salvando.add(item.codigo);
    const payload: DasItem = { ...item, status: 'Pago' };
    this.http.put<DasItem>(this.dasApiUrl, payload, { headers: this.headers })
      .subscribe({
        next: () => {
          item.status = 'Pago';
          this.salvando.delete(item.codigo);
          this.message.success('DAS marcado como pago com sucesso.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.salvando.delete(item.codigo);
          this.message.error(`Erro ao marcar como pago (${err.status}). Tente novamente.`);
          this.cdr.markForCheck();
        }
      });
  }
}
