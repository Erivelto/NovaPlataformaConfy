import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
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
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

@Pipe({ name: 'cnpj', standalone: true, pure: true })
class CnpjPipe implements PipeTransform {
  transform(v: string): string {
    if (!v) return '';
    const d = v.replace(/\D/g, '');
    if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return v;
  }
}

@Pipe({ name: 'brl', standalone: true, pure: true })
class BrlPipe implements PipeTransform {
  transform(v: string | number): string {
    if (!v && v !== 0) return '—';
    const n = typeof v === 'string'
      ? parseFloat(v.replace(/\./g, '').replace(',', '.')) : v;
    if (isNaN(n) || n === 0) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

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
  imports: [
    CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzMessageModule, NzCollapseModule, NzBadgeModule,
    NzToolTipModule, NzDividerModule, PageTitleComponent, CnpjPipe, BrlPipe
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <app-page-title title="Relatório DAS" subtitle="Histórico de processamento DAS — mês atual"></app-page-title>
        <button nz-button nzType="default" (click)="carregar()" [nzLoading]="loading" class="btn-reload">
          <i nz-icon nzType="reload"></i> Atualizar
        </button>
      </div>

      <!-- Skeleton -->
      <ng-container *ngIf="loading">
        <div class="tiles-row">
          <nz-card *ngFor="let i of [1,2,3,4,5,6,7,8]" class="tile-card">
            <nz-skeleton [nzActive]="true" [nzTitle]="{width:'60%'}" [nzParagraph]="{rows:1}"></nz-skeleton>
          </nz-card>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && dados">

        <!-- ===== KPI TILES ===== -->
        <div class="tiles-row">
          <div class="tile-card gold">
            <div class="tile-icon"><i nz-icon nzType="warning"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalSemCadastro }}</div>
              <div class="tile-label">Sem cadastro</div>
            </div>
          </div>
          <div class="tile-card blue">
            <div class="tile-icon"><i nz-icon nzType="check-square"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalMEI }}</div>
              <div class="tile-label">Clientes MEI</div>
            </div>
          </div>
          <div class="tile-card red">
            <div class="tile-icon"><i nz-icon nzType="bug"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalComErro }}</div>
              <div class="tile-label">Com erro</div>
            </div>
          </div>
          <div class="tile-card cyan">
            <div class="tile-icon"><i nz-icon nzType="clock-circle"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalAguardando }}</div>
              <div class="tile-label">A Enviar</div>
            </div>
          </div>
          <div class="tile-card green">
            <div class="tile-icon"><i nz-icon nzType="check-circle"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalEnviado }}</div>
              <div class="tile-label">Enviados</div>
            </div>
          </div>
          <div class="tile-card gold">
            <div class="tile-icon"><i nz-icon nzType="file-text"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalSemFat }}</div>
              <div class="tile-label">Sem faturamento</div>
            </div>
          </div>
          <div class="tile-card grey">
            <div class="tile-icon"><i nz-icon nzType="stop"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalFatDesativado }}</div>
              <div class="tile-label">Fat. desativado</div>
            </div>
          </div>
          <div class="tile-card orange">
            <div class="tile-icon"><i nz-icon nzType="exclamation-circle"></i></div>
            <div class="tile-body">
              <div class="tile-count">{{ dados.totalForaDoSimples }}</div>
              <div class="tile-label">Fora do Simples</div>
            </div>
          </div>
        </div>

        <!-- ===== SEÇÕES COLAPSÁVEIS ===== -->
        <nz-collapse [nzBordered]="false" class="sections">

          <!-- 1: Sem cadastro -->
          <nz-collapse-panel
            [nzHeader]="hdr1" [nzActive]="false" [nzExtra]="cnt1">
            <ng-template #hdr1>
              <span class="sec-hdr"><i nz-icon nzType="warning" style="color:darkgoldenrod;margin-right:6px"></i>Clientes sem cadastro para DAS automático</span>
            </ng-template>
            <ng-template #cnt1><nz-badge [nzCount]="dados.totalSemCadastro" [nzStyle]="badgeStyle(dados.totalSemCadastro,'gold')"></nz-badge></ng-template>
            <nz-table [nzData]="dados.semCadastro" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="dados.semCadastro.length > 15" class="sec-table">
              <thead><tr><th nzWidth="80px">Código</th><th nzWidth="150px">CNPJ</th><th>Razão Social</th><th>Fantasia</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of dados.semCadastro">
                  <td><a class="cod-link">{{ r.codigo }}</a></td>
                  <td class="mono">{{ r.documento | cnpj }}</td>
                  <td>{{ r.razao }}</td>
                  <td class="muted">{{ r.fantasia }}</td>
                </tr>
                <tr *ngIf="!dados.semCadastro.length"><td colspan="4" class="empty-row">Nenhum registro.</td></tr>
              </tbody>
            </nz-table>
          </nz-collapse-panel>

          <!-- 2: MEI -->
          <nz-collapse-panel
            [nzHeader]="hdr2" [nzActive]="false" [nzExtra]="cnt2">
            <ng-template #hdr2>
              <span class="sec-hdr"><i nz-icon nzType="check-square" style="color:#1890ff;margin-right:6px"></i>Clientes MEI</span>
            </ng-template>
            <ng-template #cnt2><nz-badge [nzCount]="dados.totalMEI" [nzStyle]="badgeStyle(dados.totalMEI,'blue')"></nz-badge></ng-template>
            <nz-table [nzData]="dados.clientesMEI" nzSize="small" nzBordered [nzPageSize]="15" [nzShowPagination]="dados.clientesMEI.length > 15" class="sec-table">
              <thead><tr><th nzWidth="80px">Código</th><th nzWidth="150px">CNPJ</th><th>Razão Social</th><th>Fantasia</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of dados.clientesMEI">
                  <td><a class="cod-link">{{ r.codigo }}</a></td>
                  <td class="mono">{{ r.documento | cnpj }}</td>
                  <td>{{ r.razao }}</td>
                  <td class="muted">{{ r.fantasia }}</td>
                </tr>
                <tr *ngIf="!dados.clientesMEI.length"><td colspan="4" class="empty-row">Nenhum registro.</td></tr>
              </tbody>
            </nz-table>
          </nz-collapse-panel>

          <!-- 3: Fora do Simples -->
          <nz-collapse-panel [nzHeader]="hdr3" [nzActive]="false" [nzExtra]="cnt3">
            <ng-template #hdr3><span class="sec-hdr"><i nz-icon nzType="exclamation-circle" style="color:#fa8c16;margin-right:6px"></i>Fora do Simples Nacional</span></ng-template>
            <ng-template #cnt3><nz-badge [nzCount]="dados.totalForaDoSimples" [nzStyle]="badgeStyle(dados.totalForaDoSimples,'orange')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.foraDoSimples}"></ng-container>
          </nz-collapse-panel>

          <!-- 4: Geradas com erro -->
          <nz-collapse-panel [nzHeader]="hdr4" [nzActive]="false" [nzExtra]="cnt4">
            <ng-template #hdr4><span class="sec-hdr"><i nz-icon nzType="bug" style="color:#ff4d4f;margin-right:6px"></i>Geradas com erro</span></ng-template>
            <ng-template #cnt4><nz-badge [nzCount]="dados.totalComErro" [nzStyle]="badgeStyle(dados.totalComErro,'red')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.comErro}"></ng-container>
          </nz-collapse-panel>

          <!-- 5: Sem Faturamento -->
          <nz-collapse-panel [nzHeader]="hdr5" [nzActive]="false" [nzExtra]="cnt5">
            <ng-template #hdr5><span class="sec-hdr"><i nz-icon nzType="robot" style="color:darkgoldenrod;margin-right:6px"></i>Sem Faturamento — sem consulta do Robô</span></ng-template>
            <ng-template #cnt5><nz-badge [nzCount]="dados.semFaturamento.length" [nzStyle]="badgeStyle(dados.semFaturamento.length,'gold')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.semFaturamento}"></ng-container>
          </nz-collapse-panel>

          <!-- 6: Sem valor de Faturamento -->
          <nz-collapse-panel [nzHeader]="hdr6" [nzActive]="false" [nzExtra]="cnt6">
            <ng-template #hdr6><span class="sec-hdr"><i nz-icon nzType="dollar" style="color:darkgoldenrod;margin-right:6px"></i>Sem valor de Faturamento</span></ng-template>
            <ng-template #cnt6><nz-badge [nzCount]="dados.semValorFaturamento.length" [nzStyle]="badgeStyle(dados.semValorFaturamento.length,'gold')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.semValorFaturamento}"></ng-container>
          </nz-collapse-panel>

          <!-- 7: Aguardando -->
          <nz-collapse-panel [nzHeader]="hdr7" [nzActive]="false" [nzExtra]="cnt7">
            <ng-template #hdr7><span class="sec-hdr"><i nz-icon nzType="clock-circle" style="color:#13c2c2;margin-right:6px"></i>DAS Aguardando Envio</span></ng-template>
            <ng-template #cnt7><nz-badge [nzCount]="dados.totalAguardando" [nzStyle]="badgeStyle(dados.totalAguardando,'cyan')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.aguardando}"></ng-container>
          </nz-collapse-panel>

          <!-- 8: Enviados -->
          <nz-collapse-panel [nzHeader]="hdr8" [nzActive]="false" [nzExtra]="cnt8">
            <ng-template #hdr8><span class="sec-hdr"><i nz-icon nzType="check-circle" style="color:#52c41a;margin-right:6px"></i>DAS Enviado</span></ng-template>
            <ng-template #cnt8><nz-badge [nzCount]="dados.totalEnviado" [nzStyle]="badgeStyle(dados.totalEnviado,'green')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDASFat" [ngTemplateOutletContext]="{rows: dados.enviados}"></ng-container>
          </nz-collapse-panel>

          <!-- 9: Fat Desativado -->
          <nz-collapse-panel [nzHeader]="hdr9" [nzActive]="false" [nzExtra]="cnt9">
            <ng-template #hdr9><span class="sec-hdr"><i nz-icon nzType="stop" style="color:#8c8c8c;margin-right:6px"></i>Faturamento desativado</span></ng-template>
            <ng-template #cnt9><nz-badge [nzCount]="dados.totalFatDesativado" [nzStyle]="badgeStyle(dados.totalFatDesativado,'grey')"></nz-badge></ng-template>
            <ng-container [ngTemplateOutlet]="tabelaDAS" [ngTemplateOutletContext]="{rows: dados.fatDesativado}"></ng-container>
          </nz-collapse-panel>

        </nz-collapse>
      </ng-container>

      <!-- Template: tabela DAS simples (sem botão abrir) -->
      <ng-template #tabelaDAS let-rows="rows">
        <nz-table [nzData]="rows" nzSize="small" nzBordered [nzPageSize]="15"
          [nzShowPagination]="rows.length > 15" class="sec-table" nzTableLayout="fixed">
          <thead><tr>
            <th nzWidth="70px">Cód.</th>
            <th nzWidth="145px">CNPJ</th>
            <th>Razão Social</th>
            <th nzWidth="115px">Prefeitura</th>
            <th nzWidth="100px">Período</th>
            <th nzWidth="105px" nzAlign="right">Val. Tributado</th>
            <th nzWidth="95px" nzAlign="right">Val. Tributo</th>
            <th nzWidth="180px">Mensagem</th>
            <th nzWidth="115px" nzAlign="center">Status</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td class="mono">{{ r.codigoPessoa }}</td>
              <td class="mono">{{ r.documento | cnpj }}</td>
              <td class="razao-cell">{{ r.razao }}</td>
              <td>{{ r.prefeitura }}</td>
              <td class="mono">{{ r.periodo }}</td>
              <td nzAlign="right" class="mono">{{ r.valorTributado | brl }}</td>
              <td nzAlign="right" class="mono val-tributo">{{ r.valorTributo }}</td>
              <td><span class="msg-cell" nz-tooltip [nzTooltipTitle]="r.mensagem">{{ r.mensagem }}</span></td>
              <td nzAlign="center"><nz-tag [nzColor]="statusColor(r.status)">{{ r.status }}</nz-tag></td>
            </tr>
            <tr *ngIf="!rows.length"><td colspan="9" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>
      </ng-template>

      <!-- Template: tabela DAS com botão Abrir -->
      <ng-template #tabelaDASFat let-rows="rows">
        <nz-table [nzData]="rows" nzSize="small" nzBordered [nzPageSize]="15"
          [nzShowPagination]="rows.length > 15" class="sec-table" nzTableLayout="fixed">
          <thead><tr>
            <th nzWidth="70px">Cód.</th>
            <th nzWidth="145px">CNPJ</th>
            <th>Razão Social</th>
            <th nzWidth="115px">Prefeitura</th>
            <th nzWidth="100px">Período</th>
            <th nzWidth="105px" nzAlign="right">Val. Tributado</th>
            <th nzWidth="95px" nzAlign="right">Val. Tributo</th>
            <th nzWidth="160px">Mensagem</th>
            <th nzWidth="105px" nzAlign="center">Status</th>
            <th nzWidth="80px" nzAlign="center">DAS</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td class="mono">{{ r.codigoPessoa }}</td>
              <td class="mono">{{ r.documento | cnpj }}</td>
              <td class="razao-cell">{{ r.razao }}</td>
              <td>{{ r.prefeitura }}</td>
              <td class="mono">{{ r.periodo }}</td>
              <td nzAlign="right" class="mono">{{ r.valorTributado | brl }}</td>
              <td nzAlign="right" class="mono val-tributo">{{ r.valorTributo }}</td>
              <td><span class="msg-cell" nz-tooltip [nzTooltipTitle]="r.mensagem">{{ r.mensagem }}</span></td>
              <td nzAlign="center"><nz-tag [nzColor]="statusColor(r.status)">{{ r.status }}</nz-tag></td>
              <td nzAlign="center">
                <button *ngIf="r.nomeArquivo" nz-button nzType="link" nzSize="small"
                  nz-tooltip nzTooltipTitle="Abrir arquivo DAS" (click)="abrirArquivo(r)">
                  <i nz-icon nzType="file-pdf" style="color:#ff4d4f;font-size:16px"></i>
                </button>
                <span *ngIf="!r.nomeArquivo" class="muted">—</span>
              </td>
            </tr>
            <tr *ngIf="!rows.length"><td colspan="10" class="empty-row">Nenhum registro.</td></tr>
          </tbody>
        </nz-table>
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 8px 12px 40px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 8px; margin-bottom: 4px;
    }
    .btn-reload { margin-top: 8px; }

    /* ---- Tiles ---- */
    .tiles-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 16px 0 20px;
    }
    @media (max-width: 1100px) { .tiles-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .tiles-row { grid-template-columns: 1fr; } }

    .tile-card {
      display: flex; align-items: center; gap: 14px;
      background: #fff; border-radius: 8px; padding: 16px 18px;
      border-left: 4px solid #d9d9d9;
      box-shadow: 0 1px 6px rgba(0,0,0,.07);
    }
    .tile-card.green  { border-left-color: #52c41a; }
    .tile-card.red    { border-left-color: #ff4d4f; }
    .tile-card.gold   { border-left-color: #d4b106; }
    .tile-card.orange { border-left-color: #fa8c16; }
    .tile-card.blue   { border-left-color: #1890ff; }
    .tile-card.cyan   { border-left-color: #13c2c2; }
    .tile-card.grey   { border-left-color: #8c8c8c; }

    .tile-icon {
      font-size: 28px; line-height: 1;
      color: inherit; opacity: .75; flex-shrink: 0;
    }
    .tile-card.green  .tile-icon { color: #52c41a; }
    .tile-card.red    .tile-icon { color: #ff4d4f; }
    .tile-card.gold   .tile-icon { color: #d4b106; }
    .tile-card.orange .tile-icon { color: #fa8c16; }
    .tile-card.blue   .tile-icon { color: #1890ff; }
    .tile-card.cyan   .tile-icon { color: #13c2c2; }
    .tile-card.grey   .tile-icon { color: #8c8c8c; }

    .tile-body { display: flex; flex-direction: column; }
    .tile-count { font-size: 1.75rem; font-weight: 800; line-height: 1.1; }
    .tile-label { font-size: .78rem; color: rgba(0,0,0,.45); margin-top: 2px; white-space: nowrap; }

    /* ---- Collapse sections ---- */
    .sections { background: transparent; }
    .sections :deep(.ant-collapse-item) {
      background: #fff; margin-bottom: 8px; border-radius: 8px !important;
      border: 1px solid #f0f0f0; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .sections :deep(.ant-collapse-header) {
      font-size: .95rem; padding: 12px 16px !important;
      background: #fafafa; border-radius: 0 !important;
    }
    .sections :deep(.ant-collapse-content-box) { padding: 0 !important; }

    .sec-hdr { font-weight: 600; font-size: .93rem; }

    /* ---- Tables ---- */
    .sec-table { margin: 0; }
    .sec-table :deep(th) { background: #f5f7fa !important; font-size: .8rem; white-space: nowrap; }
    .sec-table :deep(td) { font-size: .82rem; }

    .razao-cell { max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .msg-cell   { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
    .mono  { font-family: 'SFMono-Regular', Consolas, monospace; font-size: .8rem; }
    .muted { color: rgba(0,0,0,.35); }
    .val-tributo { font-weight: 600; }
    .cod-link { color: #1890ff; }

    .empty-row { text-align: center; padding: 28px; color: rgba(0,0,0,.3); font-style: italic; }
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
    this.cdr.markForCheck();
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

  statusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'enviado':       return 'green';
      case 'concluido':     return 'blue';
      case 'aguardando':    return 'cyan';
      case 'não concluido': return 'orange';
      case 'e':             return 'red';
      default:              return 'default';
    }
  }

  badgeStyle(count: number, color: string): { [k: string]: string } {
    const map: { [k: string]: string } = {
      green: '#52c41a', red: '#ff4d4f', gold: '#d4b106',
      orange: '#fa8c16', blue: '#1890ff', cyan: '#13c2c2', grey: '#8c8c8c'
    };
    return {
      backgroundColor: count > 0 ? (map[color] || '#aaa') : '#d9d9d9',
      color: '#fff', fontWeight: '700'
    };
  }
}
