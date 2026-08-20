import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginService } from './login.service';

const PUBLIC_API_FRAGMENTS = [
  '/Autenticacao/',
  '/Contratacao/CadastroInicial',
  '/PessoaAplicativo',
  '/Arquivo/resultado',
  '/Integracao/EnviarCodigo',
  '/Integracao/ValidarCodigo',
  '/Integracao/Cadastrar',
  '/Integracao/Login',
];

function isPublicApi(url: string): boolean {
  return PUBLIC_API_FRAGMENTS.some((fragment) => url.includes(fragment));
}

/** Requisições do portal de integração não devem ser redirecionadas para /entrar */
function isIntegracaoApi(url: string): boolean {
  return url.includes('/Integracao/');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const publicApi = isPublicApi(req.url);
  const integracaoApi = isIntegracaoApi(req.url);

  // Endpoints de integração têm seu próprio tratamento de 401 nos componentes
  if (integracaoApi) {
    return next(req);
  }

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
