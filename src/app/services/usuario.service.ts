import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id?: number;
  nome: string;
  cpf?: string;
  eol?: string;
  email?: string;
  status?: string;
  idUnidade?: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/Usuario`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  criar(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  atualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorUnidade(idUnidade: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/unidade/${idUnidade}`);
  }

  buscarPorStatus(idStatus: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/status/${idStatus}`);
  }

  buscarPorCpf(cpf: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/cpf/${cpf}`);
  }

  buscarPorEol(eol: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/eol/${eol}`);
  }
}
