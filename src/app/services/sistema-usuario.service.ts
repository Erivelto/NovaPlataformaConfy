import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SistemaUsuario {
  id?: number;
  apelido: string;
  idUsuario?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class SistemaUsuarioService {
  private apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/SistemaUsuario';

  constructor(private http: HttpClient) {}

  listar(): Observable<SistemaUsuario[]> {
    return this.http.get<SistemaUsuario[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<SistemaUsuario> {
    return this.http.get<SistemaUsuario>(`${this.apiUrl}/${id}`);
  }

  criar(sistemaUsuario: SistemaUsuario): Observable<SistemaUsuario> {
    return this.http.post<SistemaUsuario>(this.apiUrl, sistemaUsuario);
  }

  atualizar(id: number, sistemaUsuario: SistemaUsuario): Observable<SistemaUsuario> {
    return this.http.put<SistemaUsuario>(`${this.apiUrl}/${id}`, sistemaUsuario);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorApelido(apelido: string): Observable<SistemaUsuario> {
    return this.http.get<SistemaUsuario>(`${this.apiUrl}/apelido/${apelido}`);
  }

  buscarPorStatus(status: string): Observable<SistemaUsuario[]> {
    return this.http.get<SistemaUsuario[]>(`${this.apiUrl}/status/${status}`);
  }
}
