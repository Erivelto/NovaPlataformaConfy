import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface PessoaItem { codigo: number; documento: string; razao: string; fantasia: string; }
interface DasItem {
  codigo: number; codigoPessoa: number; documento: string; razao: string;
  prefeitura: string; periodo: string; valorTributado: string; valorTributo: string;
  mensagem: string; status: string; nomeArquivo: string;
}
interface Relatorio {
  totalSemCadastro: number; totalMEI: number; totalComErro: number;
  totalAguardando: number; totalEnviado: number; totalSemFat: number;
  totalFatDesativado: number; totalForaDoSimples: number;
  semCadastro: PessoaItem[]; clientesMEI: PessoaItem[];
  foraDoSimples: DasItem[]; comErro: DasItem[]; semFaturamento: DasItem[];
  semValorFaturamento: DasItem[]; aguardando: DasItem[]; enviados: DasItem[];
  fatDesativado: DasItem[];
}

@Component({
  selector: 'app-historico-das',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzMessageModule, NzDividerModule, NzEmptyModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Relatório DAS" subtitle="Histórico de processamento DAS — mês atual"></app-page-title>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:6}"></nz-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading && dados">

        <!-- Tiles -->
        <div class="tiles-row">
          <div class="tile" style="color:darkgoldenrod">
            <div class="tile-icon"><i nz-icon nzType="warning"></i></div>
            <div class="tile-count" style="color:darkgoldenrod">{{ dados.totalSemCadastro }}</div>
            <div class="tile-label">Clientes sem cadastro</div>
          </div>
          <div class="tile">
            <div class="tile-icon"><i nz-icon nzType="check-square"></i></div>
            <div class="tile-count">{{ dados.totalMEI }}</div>
            <div class="tile-label">Clientes MEI</div>
          </div>
          <div class="tile" style="color:red">
            <div class="tile-icon"><i nz-icon nzType="bug"></i></div>
            <div class="tile-count" style="color:red">{{ dados.totalComErro }}</div>
            <div class="tile-label">Clientes com erro</div>
          </div>
          <div class="tile" style="color:green">
            <div class="tile-icon"><i nz-icon nzType="clock-circle"></i></div>
            <div class="tile-count" style="color:green">{{ dados.totalAguardando }}</div>
            <div class="tile-label">Clientes a Enviar</div>
          </div>
          <div class="tile" style="color:green">
            <div class="tile-icon"><i nz-icon nzType="check-circle"></i></div>
            <div class="tile-count" style="color:green">{{ dados.totalEnviado }}</div>
            <div class="tile-label">Clientes Enviado</div>
          </div>
          <div class="tile" style="color:darkgoldenrod">
            <div class="tile-icon"><i nz-icon nzType="warning"></i></div>
            <div class="tile-count" style="color:darkgoldenrod">{{ dados.totalSemFat }}</div>
            <div class="tile-label">Clientes Sem Fat.</div>
          </div>
          <div class="tile">
            <div class="tile-icon"><i nz-icon nzType="stop"></i></div>
            <div class="tile-count">{{ dados.totalFatDesativado }}</div>
            <div class="tile-label">Clientes Desligado Fat.</div>
          </div>
          <div class="tile">
            <div class="tile-icon"><i nz-icon nzType="exclamation-circle"></i></div>
            <div class="tile-count">{{ dados.totalForaDoSimples }}</div>
            <div class="tile-label">Clientes fora do simples</div>
          </div>
        </div>

        <!-- Seção 1: Sem Cadastro -->
        <h4 class="sec-title">Clientes não cadastrados para geração DAS automático!</h4>
        <nz-table [nzData]="dados.semCadastro" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="dados.semCadastro.length > 15">
          <thead><tr><th>Codigo</th><th>CNPJ</th><th>Razão Social</th><th>Fantasia</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of dados.semCadastro">
              <td>{{ r.codigo }}</td><td>{{ r.documento }}</td><td>{{ r.razao }}</td><td>{{ r.fantasia }}</td>
            </tr>
            <tr *ngIf="dados.semCadastro.length === 0"><td colspan="4" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>

        <!-- Seção 2: MEI -->
        <h4 class="sec-title">Clientes MEI</h4>
        <nz-table [nzData]="dados.clientesMEI" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="dados.clientesMEI.length > 15">
          <thead><tr><th>Codigo</th><th>CNPJ</th><th>Razão Social</th><th>Fantasia</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of dados.clientesMEI">
              <td>{{ r.codigo }}</td><td>{{ r.documento }}</td><td>{{ r.razao }}</td><td>{{ r.fantasia }}</td>
            </tr>
            <tr *ngIf="dados.clientesMEI.length === 0"><td colspan="4" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>

        <!-- Seção 3: Fora do Simples -->
        <h4 class="sec-title">Fora do Simples</h4>
        <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.foraDoSimples, showAbrir: false}"></ng-container>

        <!-- Seção 4: Geradas com erro -->
        <h4 class="sec-title">Geradas com erro</h4>
        <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.comErro, showAbrir: true}"></ng-container>

        <!-- Seção 5: Sem Faturamento -->
        <h4 class="sec-title">Sem Faturamento sem consulta do Robô</h4>
        <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.semFaturamento}"></ng-container>

        <!-- Seção 6: Sem valor de Faturamento -->
        <h4 class="sec-title">Sem valor de Faturamento</h4>
        <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.semValorFaturamento}"></ng-container>

        <!-- Seção 7: Aguardando -->
        <h4 class="sec-title">DAS Aguardando Envio</h4>
        <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.aguardando}"></ng-container>

        <!-- Seção 8: Enviados -->
        <h4 class="sec-title">DAS Enviado</h4>
        <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.enviados}"></ng-container>

        <!-- Seção 9: Fat Desativado -->
        <h4 class="sec-title">Faturamento desativado</h4>
        <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.fatDesativado, showAbrir: false}"></ng-container>

      </ng-container>

      <!-- Template: tabela DAS simples -->
      <ng-template #tabelaDAS let-rows="rows" let-showAbrir="showAbrir">
        <nz-table [nzData]="rows" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="rows.length > 15" style="margin-bottom:12px">
          <thead><tr>
            <th nzWidth="80px">Codigo</th><th nzWidth="140px">CNPJ</th>
            <th>Razão Social</th><th>Prefeitura</th>
            <th nzWidth="130px">Período</th><th nzWidth="120px">Val. Tributado</th>
            <th nzWidth="110px">Val. Tributo</th><th>Mensagem</th><th nzWidth="110px">Status</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td>{{ r.codigoPessoa }}</td><td>{{ r.documento }}</td><td>{{ r.razao }}</td>
              <td>{{ r.prefeitura }}</td><td>{{ r.periodo }}</td>
              <td>{{ r.valorTributado }}</td><td>{{ r.valorTributo }}</td>
              <td>{{ r.mensagem }}</td><td>{{ r.status }}</td>
            </tr>
            <tr *ngIf="rows.length === 0"><td colspan="9" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>
      </ng-template>

      <!-- Template: tabela DAS com botão abrir -->
      <ng-template #tabelaDASFat let-rows="rows">
        <nz-table [nzData]="rows" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="rows.length > 15" style="margin-bottom:12px">
          <thead><tr>
            <th nzWidth="80px">Codigo</th><th nzWidth="140px">CNPJ</th>
            <th>Razão Social</th><th>Prefeitura</th>
            <th nzWidth="130px">Período</th><th nzWidth="120px">Val. Tributado</th>
            <th nzWidth="110px">Val. Tributo</th><th>Mensagem</th><th nzWidth="110px">Status</th>
            <th nzWidth="90px" nzAlign="center">Arquivo</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td>{{ r.codigoPessoa }}</td><td>{{ r.documento }}</td><td>{{ r.razao }}</td>
              <td>{{ r.prefeitura }}</td><td>{{ r.periodo }}</td>
              <td>{{ r.valorTributado }}</td><td>{{ r.valorTributo }}</td>
              <td>{{ r.mensagem }}</td><td>{{ r.status }}</td>
              <td nzAlign="center">
                <button *ngIf="r.nomeArquivo" nz-button nzType="primary" nzSize="small" (click)="abrirArquivo(r)">
                  <i nz-icon nzType="file-pdf"></i> Abrir
                </button>
              </td>
            </tr>
            <tr *ngIf="rows.length === 0"><td colspan="10" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .tiles-row {
      display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0;
    }
    .tile {
      background: #fff; border: 1px solid #f0f0f0; border-radius: 6px;
      padding: 14px 18px; text-align: center; min-width: 130px; flex: 1;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
    }
    .tile-icon { font-size: 22px; margin-bottom: 4px; }
    .tile-count { font-size: 1.6rem; font-weight: 800; }
    .tile-label { font-size: .8rem; color: rgba(0,0,0,.45); margin-top: 2px; }
    .sec-title { margin: 18px 0 8px; font-size: 1rem; font-weight: 600; border-left: 3px solid #1890ff; padding-left: 8px; }
    .empty-row { text-align: center; padding: 20px; color: rgba(0,0,0,.35); }
  `]
})
export class HistoricoDasComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true;
  dados: Relatorio | null = null;

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    this.http.get<Relatorio>(`${this.api}/DAS/RelatorioDashboard`, { headers: this.h })
      .pipe(
        timeout(30000),
        catchError(err => {
          this.message.error(`Erro ao carregar relatório (${err.status || 'timeout'})`);
          return of(null);
        })
      )
      .subscribe(data => {
        this.dados = data;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  abrirArquivo(d: DasItem) {
    if (d.nomeArquivo) {
      window.open(
        `https://armazenamento.contfy.com.br/Arquivos/Resultado?diretorioCompleto=${d.codigoPessoa}&nomeArquivo=${d.nomeArquivo}`,
        '_blank'
      );
    }
  }
}
