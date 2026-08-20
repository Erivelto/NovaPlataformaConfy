import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export function isAtendimentoHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.replace(/^www\./, '').toLowerCase();
  return host === 'atendimento.contfy.com.br';
}

/** No domínio atendimento.contfy.com.br, a raiz e o login da plataforma vão para o portal de integração. */
export const atendimentoRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (isAtendimentoHost()) {
    return router.createUrlTree(['/integracao/entrar']);
  }
  return true;
};
