import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Recreio {
  id?: number;
  nome?: string;
  descricao?: string;
  status?: string;
  ano?: number;
  semestre?: number;
}

@Injectable({ providedIn: 'root' })
export class RecreioService {
  private apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/Recreio';

  constructor(private http: HttpClient) {}

  listar(): Observable<Recreio[]> {
    return this.http.get<Recreio[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<Recreio> {
    return this.http.get<Recreio>(`${this.apiUrl}/${id}`);
  }

  criar(recreio: Recreio): Observable<Recreio> {
    return this.http.post<Recreio>(this.apiUrl, recreio);
  }

  atualizar(id: number, recreio: Recreio): Observable<Recreio> {
    return this.http.put<Recreio>(`${this.apiUrl}/${id}`, recreio);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorStatus(status: string): Observable<Recreio[]> {
    return this.http.get<Recreio[]>(`${this.apiUrl}/status/${status}`);
  }

  buscarPorSemestre(ano: number, semestre: number): Observable<Recreio[]> {
    return this.http.get<Recreio[]>(`${this.apiUrl}/ano/${ano}/semestre/${semestre}`);
  }
}
