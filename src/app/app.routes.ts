import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

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
			{ path: 'solicitacao-nfe', loadComponent: () => import('./solicitacao-nfe/solicitacao-nfe.component').then(m => m.SolicitacaoNfeComponent) },
			{ path: 'notas-fiscais', loadComponent: () => import('./notas-fiscais/notas-fiscais.component').then(m => m.NotasFiscaisComponent) },
			{ path: 'receita-imposto', loadComponent: () => import('./receita-imposto/receita-imposto.component').then(m => m.ReceitaImpostoComponent) },
			{ path: 'mensalidade', loadComponent: () => import('./mensalidade/mensalidade.component').then(m => m.MensalidadeComponent) }
		]
	},
	{ path: '**', redirectTo: '' }
];
