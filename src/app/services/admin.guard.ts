import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

export const adminGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (!loginService.estaAutenticado()) {
    loginService.logout();
    router.navigate(['/entrar']);
    return false;
  }

  if (!loginService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
