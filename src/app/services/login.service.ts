import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PessoaSession {
  codigo: number;
  nome: string;
  razao: string;
  documento: string;
  incricaoMunicipal?: string;
  descricaoAtividade?: string;
  cnae?: string;
  tipoPessoa?: number;
  numeroWhats?: string;
  endereco?: {
    logradouro?: string;
    numrero?: string;
    complemento?: string;
    tipoEnd?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  listaRepresentante?: Array<{
    codigo?: number;
    nome?: string;
    cpf?: string;
    endereco?: any;
  }>;
  [key: string]: any;
}

export interface LoginResponse {
  token: string;
  pessoas?: PessoaSession[];
  [key: string]: any;
}

export interface UsuarioLogado {
  nome: string;
  email: string;
  perfil?: string;
  idUsuario?: string | number;
  codigoPessoa?: number;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private authUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/Autenticacao/Login';

  constructor(private http: HttpClient) {}

  autenticar(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.authUrl, credentials);
  }

  salvarSessao(res: LoginResponse): void {
    localStorage.setItem('auth_token', res.token);
    const usuario = this.extrairUsuario(res);
    localStorage.setItem('auth_usuario', JSON.stringify(usuario));
    if (res.pessoas && res.pessoas.length > 0) {
      localStorage.setItem('auth_pessoa', JSON.stringify(res.pessoas[0]));
    }
  }

  private extrairUsuario(res: LoginResponse): UsuarioLogado {
    const claims = this.decodeToken(res.token);
    const pessoa = res.pessoas?.[0];
    const codigoPessoa =
      (pessoa?.codigo ? Number(pessoa.codigo) : undefined) ??
      (claims?.['CodigoPessoa'] ? Number(claims['CodigoPessoa']) : undefined) ??
      (claims?.['codigoPessoa'] ? Number(claims['codigoPessoa']) : undefined);

    return {
      nome: pessoa?.nome || claims?.['unique_name'] || claims?.['email'] || 'Usuário',
      email: claims?.['unique_name'] || claims?.['email'] || '',
      perfil: claims?.['perfil'] || claims?.['role'] || claims?.['roles'],
      idUsuario: claims?.['nameid'] || claims?.['sub'],
      codigoPessoa
    };
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  obterUsuario(): UsuarioLogado | null {
    const raw = localStorage.getItem('auth_usuario');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  obterPessoa(): PessoaSession | null {
    const raw = localStorage.getItem('auth_pessoa');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  obterToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
    localStorage.removeItem('auth_pessoa');
  }

  estaAutenticado(): boolean {
    return !!this.obterToken();
  }
}
