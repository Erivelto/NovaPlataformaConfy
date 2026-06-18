import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from './page-title.component';
import { LoginService } from './services/login.service';
import { environment } from '../environments/environment';

interface ClienteSummary {
  codigo: number;
  nome: string;
  razao: string;
  documento: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzCardModule, NzGridModule, NzTableModule, NzTagModule,
    NzIconModule, NzSkeletonModule, NzStatisticModule, NzDividerModule,
    PageTitleComponent
  ],
  template: `
    <div class="admin-dashboard">
      <app-page-title title="Painel Administrativo" subtitle="Visão geral da plataforma Contfy"></app-page-title>

      <!-- Banner admin -->
      <div class="admin-banner">
        <i nz-icon nzType="crown" nzTheme="fill" class="banner-icon"></i>
        <div>
          <div class="banner-title">Área Administrativa</div>
          <div class="banner-sub">Bem-vindo, {{ adminName }}. Você tem acesso total à plataforma.</div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="team" style="color:#1890ff"></i></div>
          <div class="kpi-label">Total de Clientes</div>
          <ng-container *ngIf="loadingClientes">
            <nz-skeleton [nzActive]="true" [nzTitle]="{ width: '60px' }" [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </ng-container>
          <div class="kpi-value primary" *ngIf="!loadingClientes">{{ clientes.length }}</div>
          <div class="kpi-sub">cadastrados</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="check-circle" style="color:#52c41a"></i></div>
          <div class="kpi-label">Clientes Ativos</div>
          <ng-container *ngIf="loadingClientes">
            <nz-skeleton [nzActive]="true" [nzTitle]="{ width: '60px' }" [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </ng-container>
          <div class="kpi-value green" *ngIf="!loadingClientes">{{ clientes.length }}</div>
          <div class="kpi-sub">na plataforma</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="calendar" style="color:#722ed1"></i></div>
          <div class="kpi-label">Data de Acesso</div>
          <div class="kpi-value purple" style="font-size:1rem">{{ dataAcesso }}</div>
          <div class="kpi-sub">último login admin</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="safety" style="color:#fa8c16"></i></div>
          <div class="kpi-label">Perfil</div>
          <div class="kpi-value orange">Administrador</div>
          <div class="kpi-sub">acesso total</div>
        </nz-card>
      </div>

      <!-- Tabela de clientes recentes -->
      <nz-card nzTitle="Clientes Cadastrados" style="margin-top:16px">
        <ng-container *ngIf="loadingClientes">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 5 }"></nz-skeleton>
        </ng-container>
        <nz-table
          *ngIf="!loadingClientes"
          [nzData]="clientes"
          nzSize="small"
          [nzShowPagination]="clientes.length > 10"
          [nzPageSize]="10">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome / Razão Social</th>
              <th>Documento (CNPJ/CPF)</th>
              <th nzAlign="center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientes">
              <td>{{ c.codigo }}</td>
              <td>{{ c.razao || c.nome || '—' }}</td>
              <td>{{ c.documento || '—' }}</td>
              <td nzAlign="center">
                <nz-tag nzColor="green">Ativo</nz-tag>
              </td>
            </tr>
            <tr *ngIf="clientes.length === 0">
              <td colspan="4" style="text-align:center;color:rgba(0,0,0,0.45);padding:32px">
                Nenhum cliente encontrado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [
    `.admin-dashboard{padding:8px 4px}`,
    `.admin-banner{display:flex;align-items:center;gap:16px;padding:18px 24px;margin:14px 0 16px;background:linear-gradient(135deg,#fffbe6,#fff7cc);border:1.5px solid #faad14;border-radius:12px;box-shadow:0 4px 16px rgba(250,173,20,.15)}`,
    `.banner-icon{font-size:36px;color:#faad14;flex-shrink:0}`,
    `.banner-title{font-weight:800;font-size:1.05rem;color:#d48806;margin-bottom:4px}`,
    `.banner-sub{color:rgba(0,0,0,0.55);font-size:0.875rem}`,
    `.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px}`,
    `.kpi{flex:1;min-width:190px}`,
    `.kpi-icon{font-size:22px;margin-bottom:6px}`,
    `.kpi-label{color:rgba(0,0,0,0.45);font-size:0.88rem}`,
    `.kpi-value{font-size:1.35rem;font-weight:700;margin-top:4px;color:rgba(0,0,0,0.85)}`,
    `.kpi-value.primary{color:#1890ff}`,
    `.kpi-value.green{color:#52c41a}`,
    `.kpi-value.purple{color:#722ed1}`,
    `.kpi-value.orange{color:#fa8c16}`,
    `.kpi-sub{color:rgba(0,0,0,0.35);font-size:0.8rem;margin-top:4px}`,
    `@media(max-width:720px){.kpis{flex-direction:column}}`
  ]
})
export class DashboardAdminComponent implements OnInit {
  private readonly apiBase = environment.apiUrl;

  adminName = 'Admin';
  dataAcesso = '';
  loadingClientes = true;
  clientes: ClienteSummary[] = [];

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private loginService: LoginService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    if (!usuario || !usuario.isAdmin) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.adminName = usuario.email?.split('@')[0] || usuario.nome || 'Admin';
    this.dataAcesso = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.http.get<ClienteSummary[]>(`${this.apiBase}/Pessoa`, { headers: this.headers }).subscribe({
      next: (res) => {
        this.clientes = Array.isArray(res) ? res : [];
        this.loadingClientes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClientes = false;
        this.cdr.markForCheck();
      }
    });
  }
}
