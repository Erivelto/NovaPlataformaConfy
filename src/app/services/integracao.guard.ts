import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const integracaoGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('integracao_token');
  if (!token) {
    router.navigate(['/integracao/entrar']);
    return false;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp: number = payload?.exp;
    if (exp && Date.now() >= exp * 1000) {
      localStorage.removeItem('integracao_token');
      localStorage.removeItem('integracao_lead');
      router.navigate(['/integracao/entrar']);
      return false;
    }
    if (payload?.role !== 'integracao') {
      router.navigate(['/integracao/entrar']);
      return false;
    }
    return true;
  } catch {
    router.navigate(['/integracao/entrar']);
    return false;
  }
};
