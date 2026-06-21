import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';

export const routes: Routes = [
	{ path: 'login', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
	{ path: 'alterar-senha', loadComponent: () => import('./alterar-senha.component').then(m => m.AlterarSenhaComponent) },
	{
		path: '',
		loadComponent: () => import('./layout.component').then(m => m.LayoutComponent),
		canActivate: [authGuard],
		children: [
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{ path: 'dashboard', loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent) },
			{ path: 'form', loadComponent: () => import('./sample-form.component').then(m => m.SampleFormComponent) },
			{ path: 'users', loadComponent: () => import('./users-table.component').then(m => m.UsersTableComponent) },
			{ path: 'clients', loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent) },
			{ path: 'meus-dados', loadComponent: () => import('./meus-dados/meus-dados.component').then(m => m.MeusDadosComponent) },
			{ path: 'meu-contrato', loadComponent: () => import('./meu-contrato/meu-contrato.component').then(m => m.MeuContratoComponent) },
			{ path: 'documentos', loadComponent: () => import('./documentos/documentos.component').then(m => m.DocumentosComponent) },
			{ path: 'solicitacao-nfe', loadComponent: () => import('./solicitacao-nfe/solicitacao-nfe.component').then(m => m.SolicitacaoNfeComponent) },
			{ path: 'solicitacoes', loadComponent: () => import('./solicitacoes/solicitacoes.component').then(m => m.SolicitacoesClienteComponent) },
			{ path: 'notas-fiscais', loadComponent: () => import('./notas-fiscais/notas-fiscais.component').then(m => m.NotasFiscaisComponent) },
			{ path: 'receita-imposto', loadComponent: () => import('./receita-imposto/receita-imposto.component').then(m => m.ReceitaImpostoComponent) },
			{ path: 'mensalidade', loadComponent: () => import('./mensalidade/mensalidade.component').then(m => m.MensalidadeComponent) }
		]
	},
	{
		path: 'administrativo',
		loadComponent: () => import('./admin-layout.component').then(m => m.AdminLayoutComponent),
		canActivate: [adminGuard],
		children: [
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{ path: 'dashboard', loadComponent: () => import('./admin-dashboard.component').then(m => m.DashboardAdminComponent) },

			// Gestão > Clientes
			{ path: 'clientes', loadComponent: () => import('./admin/clientes-online.component').then(m => m.ClientesOnlineComponent) },
			{ path: 'clientes-fisica', loadComponent: () => import('./admin/clientes-fisica.component').then(m => m.ClientesFisicaComponent) },
			{ path: 'cliente/:id/editar', loadComponent: () => import('./admin/cliente-editar.component').then(m => m.ClienteEditarComponent) },
			{ path: 'receita-anual/:pessoaCodigo', loadComponent: () => import('./admin/dashboard-fiscal-admin.component').then(m => m.DashboardFiscalAdminComponent) },

			// Gestão > Cobrança
			{ path: 'devedores', loadComponent: () => import('./admin/devedores.component').then(m => m.DevedoresComponent) },
			{ path: 'devedores-anterior', loadComponent: () => import('./admin/devedores-anterior.component').then(m => m.DevedoresAnteriorComponent) },

			// Gestão > DAS
			{ path: 'historico-das', loadComponent: () => import('./admin/historico-das.component').then(m => m.HistoricoDasComponent) },
			{ path: 'validacao-das', loadComponent: () => import('./admin/validacao-das.component').then(m => m.ValidacaoDasComponent) },
			{ path: 'pendencias-das', loadComponent: () => import('./admin/pendencias-das.component').then(m => m.PendenciasDasComponent) },

			// Gestão > Pessoal / Blog / Solicitações / NFE
			{ path: 'gestao-pessoal', loadComponent: () => import('./admin/gestao-pessoal.component').then(m => m.GestaoPessoalComponent) },
			{ path: 'blog', loadComponent: () => import('./admin/blog.component').then(m => m.BlogComponent) },
			{ path: 'solicitacoes', loadComponent: () => import('./admin/solicitacoes.component').then(m => m.SolicitacoesComponent) },
			{ path: 'solicitacoes-dashboard', loadComponent: () => import('./admin/solicitacoes-dashboard.component').then(m => m.SolicitacoesDashboardComponent) },
			{ path: 'agendamento-nfe', loadComponent: () => import('./admin/agendamento-nfe.component').then(m => m.AgendamentoNfeComponent) },

			// Rotas legadas mantidas
			{ path: 'usuarios', loadComponent: () => import('./users-table.component').then(m => m.UsersTableComponent) },
			{ path: 'mensalidades', loadComponent: () => import('./mensalidade/mensalidade.component').then(m => m.MensalidadeComponent) },
			{ path: 'notas-fiscais', loadComponent: () => import('./notas-fiscais/notas-fiscais.component').then(m => m.NotasFiscaisComponent) },
			{ path: 'impostos', loadComponent: () => import('./receita-imposto/receita-imposto.component').then(m => m.ReceitaImpostoComponent) }
		]
	},
	{ path: '**', redirectTo: '' }
];
