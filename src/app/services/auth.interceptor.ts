import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginService } from './login.service';

const PUBLIC_API_FRAGMENTS = ['/Autenticacao/', '/Contratacao/CadastroInicial', '/PessoaAplicativo'];

function isPublicApi(url: string): boolean {
  return PUBLIC_API_FRAGMENTS.some((fragment) => url.includes(fragment));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const publicApi = isPublicApi(req.url);

  if (!loginService.estaAutenticado() && !publicApi) {
    return next(req).pipe(
      tap({
        error: (err) => {
          if (err.status === 401) {
            router.navigate(['/entrar']);
          }
        },
      }),
    );
  }

  return next(req).pipe(
    tap({
      error: (err) => {
        if (err.status === 401 && !publicApi) {
          loginService.logout();
          router.navigate(['/entrar']);
        }
      },
    }),
  );
};
