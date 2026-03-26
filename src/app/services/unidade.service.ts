import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Unidade {
  id?: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class UnidadeService {
  private apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/Unidade';

  constructor(private http: HttpClient) {}

  listar(): Observable<Unidade[]> {
    return this.http.get<Unidade[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<Unidade> {
    return this.http.get<Unidade>(`${this.apiUrl}/${id}`);
  }

  criar(unidade: Unidade): Observable<Unidade> {
    return this.http.post<Unidade>(this.apiUrl, unidade);
  }

  atualizar(id: number, unidade: Unidade): Observable<Unidade> {
    return this.http.put<Unidade>(`${this.apiUrl}/${id}`, unidade);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  listarAtivas(): Observable<Unidade[]> {
    return this.http.get<Unidade[]>(`${this.apiUrl}/ativas`);
  }

  buscarPorCnpj(cnpj: string): Observable<Unidade> {
    return this.http.get<Unidade>(`${this.apiUrl}/cnpj/${cnpj}`);
  }
}
