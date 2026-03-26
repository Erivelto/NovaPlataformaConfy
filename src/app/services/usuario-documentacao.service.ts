import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioDocumentacao {
  id?: number;
  idUsuario?: number;
  tipoDocumento?: string;
  descricao?: string;
  dataVencimento?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioDocumentacaoService {
  private apiUrl = `${environment.apiUrl}/UsuarioDocumentacao`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuarioDocumentacao[]> {
    return this.http.get<UsuarioDocumentacao[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<UsuarioDocumentacao> {
    return this.http.get<UsuarioDocumentacao>(`${this.apiUrl}/${id}`);
  }

  criar(doc: UsuarioDocumentacao): Observable<UsuarioDocumentacao> {
    return this.http.post<UsuarioDocumentacao>(this.apiUrl, doc);
  }

  atualizar(id: number, doc: UsuarioDocumentacao): Observable<UsuarioDocumentacao> {
    return this.http.put<UsuarioDocumentacao>(`${this.apiUrl}/${id}`, doc);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorUsuario(idUsuario: number): Observable<UsuarioDocumentacao[]> {
    return this.http.get<UsuarioDocumentacao[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  listarVencidos(): Observable<UsuarioDocumentacao[]> {
    return this.http.get<UsuarioDocumentacao[]>(`${this.apiUrl}/vencidos`);
  }
}
