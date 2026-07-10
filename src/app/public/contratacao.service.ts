import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CadastroInicialPayload {
  cnpj: string;
  nome: string;
  email: string;
  celular: string;
  plano: string;
}

@Injectable({ providedIn: 'root' })
export class ContratacaoService {
  private readonly url = `${environment.apiUrl}/Contratacao/CadastroInicial`;

  constructor(private http: HttpClient) {}

  cadastrar(payload: CadastroInicialPayload): Observable<string> {
    return this.http.post(this.url, payload, { responseType: 'text' });
  }
}
