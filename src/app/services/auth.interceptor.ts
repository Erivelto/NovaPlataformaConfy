import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginService } from './login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (!loginService.estaAutenticado() && !req.url.includes('/Autenticacao/')) {
    loginService.logout();
    router.navigate(['/login']);
  }

  return next(req).pipe(
    tap({
      error: (err) => {
        if (err.status === 401) {
          loginService.logout();
          router.navigate(['/login']);
        }
      }
    })
  );
};
