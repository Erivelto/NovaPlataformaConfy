import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

interface LeadResumo {
  id: number;
  tipo: string;
  razaoSocial: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  cnpj: string;
  status: string;
  dataCadastro: string;
  totalDocs: number;
  docsAprovados: number;
}

const STATUS_TABS = [
  { key: '',                    label: 'Todos'            },
  { key: 'aguardando_documentos', label: 'Aguardando Docs' },
  { key: 'em_analise',          label: 'Em Análise'       },
  { key: 'aprovado',            label: 'Aprovado'         },
  { key: 'recusado',            label: 'Recusado'         },
];

@Component({
  selector: 'app-novos-clientes-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzTabsModule, NzBadgeModule, NzToolTipModule, NzEmptyModule,
    PageTitleComponent,
  ],
  template: `
    <app-page-title title="Novos Clientes" subtitle="Leads do portal de integração"></app-page-title>

    <nz-card style="margin:16px">
      <nz-tabset [(nzSelectedIndex)]="tabIndex" (nzSelectedIndexChange)="onTabChange($event)">
        <nz-tab *ngFor="let tab of tabs; let i = index" [nzTitle]="tab.label">
          <nz-skeleton [nzLoading]="loading" [nzActive]="true" [nzParagraph]="{rows:5}">
            <nz-table
              #tbl
              [nzData]="leads"
              [nzLoading]="loading"
              nzSize="small"
              [nzPageSize]="20"
              nzShowPagination>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Empresa / Nome</th>
                  <th>Responsável</th>
                  <th>E-mail</th>
                  <th>Cadastro</th>
                  <th>Documentos</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let lead of tbl.data">
                  <td>
                    <nz-tag [nzColor]="lead.tipo === 'abertura' ? 'blue' : 'purple'">
                      {{ lead.tipo === 'abertura' ? 'Abertura' : 'Mudança' }}
                    </nz-tag>
                  </td>
                  <td>
                    <strong>{{ lead.razaoSocial }}</strong>
                    <div *ngIf="lead.cnpj" style="font-size:12px;color:#888">{{ lead.cnpj }}</div>
                  </td>
                  <td>{{ lead.nomeResponsavel }}</td>
                  <td>{{ lead.email }}</td>
                  <td>{{ lead.dataCadastro }}</td>
                  <td>
                    <nz-tag [nzColor]="lead.docsAprovados === lead.totalDocs && lead.totalDocs > 0 ? 'success' : 'default'">
                      {{ lead.docsAprovados }}/{{ lead.totalDocs }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="statusColor(lead.status)">{{ statusLabel(lead.status) }}</nz-tag>
                  </td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="verDetalhe(lead.id)">
                      <i nz-icon nzType="eye"></i> Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </nz-table>
            <nz-empty *ngIf="!loading && leads.length === 0" nzNotFoundContent="Nenhum lead encontrado"></nz-empty>
          </nz-skeleton>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
})
export class NovosClientesListaComponent implements OnInit {
  tabs = STATUS_TABS;
  tabIndex = 0;
  leads: LeadResumo[] = [];
  loading = false;

  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.carregar(); }

  onTabChange(idx: number): void {
    this.tabIndex = idx;
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    const status = this.tabs[this.tabIndex].key;
    const url = `${this.api}/Integracao/Admin/Leads${status ? '?status=' + status : ''}`;
    this.http.get<LeadResumo[]>(url, { headers: this.headers() })
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.leads = data ?? [];
        this.loading = false;
        this.cd.markForCheck();
      });
  }

  verDetalhe(id: number): void {
    this.router.navigate(['/administrativo/novos-clientes', id]);
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      aguardando_documentos: 'Aguardando Docs',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      recusado: 'Recusado',
    };
    return map[s] ?? s;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      aguardando_documentos: 'orange',
      em_analise: 'processing',
      aprovado: 'success',
      recusado: 'error',
    };
    return map[s] ?? 'default';
  }

  private headers(): HttpHeaders {
    const token = this.loginService.obterToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
