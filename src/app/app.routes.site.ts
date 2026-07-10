import { Routes } from '@angular/router';

/** Rotas do site institucional (deploy: contfy.com.br) */
export const siteRoutes: Routes = [
	{
		path: '',
		loadComponent: () => import('./public/public-layout.component').then(m => m.PublicLayoutComponent),
		children: [
			{ path: '', loadComponent: () => import('./public/home.component').then(m => m.HomeComponent) },
			{ path: 'planos', loadComponent: () => import('./public/planos.component').then(m => m.PlanosComponent) },
			{ path: 'abrir-empresa', loadComponent: () => import('./public/abrir-empresa.component').then(m => m.AbrirEmpresaComponent) },
			{ path: 'mudar-contador', loadComponent: () => import('./public/abrir-empresa.component').then(m => m.MudarContadorComponent) },
			{ path: 'contato', loadComponent: () => import('./public/contato.component').then(m => m.ContatoComponent) },
			{ path: 'contratar/sucesso', loadComponent: () => import('./public/contratacao-sucesso.component').then(m => m.ContratacaoSucessoComponent) },
		]
	},
	{ path: '**', redirectTo: '' }
];
