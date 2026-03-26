import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Analista {
  id?: number;
  nome: string;
  cpf?: string;
  email?: string;
  status?: string;
  telefone?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalistaService {
  private apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/Analista';

  constructor(private http: HttpClient) {}

  listar(): Observable<Analista[]> {
    return this.http.get<Analista[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<Analista> {
    return this.http.get<Analista>(`${this.apiUrl}/${id}`);
  }

  criar(analista: Analista): Observable<Analista> {
    return this.http.post<Analista>(this.apiUrl, analista);
  }

  atualizar(id: number, analista: Analista): Observable<Analista> {
    return this.http.put<Analista>(`${this.apiUrl}/${id}`, analista);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorStatus(status: string): Observable<Analista[]> {
    return this.http.get<Analista[]>(`${this.apiUrl}/status/${status}`);
  }

  buscarPorCpf(cpf: string): Observable<Analista> {
    return this.http.get<Analista>(`${this.apiUrl}/cpf/${cpf}`);
  }
}
