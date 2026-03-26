import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Agenda {
  id?: number;
  titulo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  idAnalista?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private apiUrl = 'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/Agenda';

  constructor(private http: HttpClient) {}

  listar(): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<Agenda> {
    return this.http.get<Agenda>(`${this.apiUrl}/${id}`);
  }

  criar(agenda: Agenda): Observable<Agenda> {
    return this.http.post<Agenda>(this.apiUrl, agenda);
  }

  atualizar(id: number, agenda: Agenda): Observable<Agenda> {
    return this.http.put<Agenda>(`${this.apiUrl}/${id}`, agenda);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorAnalista(idAnalista: number): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(`${this.apiUrl}/analista/${idAnalista}`);
  }

  buscarPorStatus(status: string): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(`${this.apiUrl}/status/${status}`);
  }
}
