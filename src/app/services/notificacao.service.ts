import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificacaoTela {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  linkAcao?: string;
  lida: boolean;
  dataCriacao: string;
}

export interface NotificacaoContagem {
  totalNaoLidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private base = `${environment.apiUrl}/Notificacao`;

  constructor(private http: HttpClient) {}

  private opts() {
    const token = localStorage.getItem('auth_token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private norm<T>(obj: any): T {
    if (obj == null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.norm(i)) as T;
    const out: any = {};
    for (const k of Object.keys(obj)) {
      const ck = k.charAt(0).toLowerCase() + k.slice(1);
      out[ck] = this.norm(obj[k]);
    }
    return out as T;
  }

  listar(): Observable<NotificacaoTela[]> {
    return new Observable(sub => {
      this.http.get<any[]>(this.base, this.opts()).subscribe({
        next: raw => sub.next((raw ?? []).map(n => this.norm<NotificacaoTela>(n))),
        error: err => sub.error(err),
        complete: () => sub.complete()
      });
    });
  }

  contagem(): Observable<NotificacaoContagem> {
    return new Observable(sub => {
      this.http.get<any>(`${this.base}/Contagem`, this.opts()).subscribe({
        next: raw => sub.next(this.norm<NotificacaoContagem>(raw)),
        error: () => sub.next({ totalNaoLidas: 0 }),
        complete: () => sub.complete()
      });
    });
  }

  pollingContagem(ms = 60000): Observable<number> {
    return interval(ms).pipe(
      startWith(0),
      switchMap(() => this.contagem()),
      map(c => c.totalNaoLidas ?? 0)
    );
  }

  marcarLida(id: number): Observable<void> {
    return new Observable(sub => {
      this.http.put(`${this.base}/${id}/Lida`, {}, this.opts()).subscribe({
        next: () => { sub.next(); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  marcarTodasLidas(): Observable<void> {
    return new Observable(sub => {
      this.http.put(`${this.base}/Lidas`, {}, this.opts()).subscribe({
        next: () => { sub.next(); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }
}
