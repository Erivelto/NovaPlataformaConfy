import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMensagem {
  id: number;
  codigoPessoa: number;
  remetentePerfil: string;
  remetenteNome: string;
  texto: string;
  lidaPorDestino: boolean;
  dataCriacao: string;
  ehMinha: boolean;
}

export interface ChatConversa {
  codigoPessoa: number;
  nomeCliente: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  naoLidas: number;
}

export interface ChatStatus {
  dentroHorarioComercial: boolean;
  analistasOnline: number;
  mensagemHorario: string;
  horarioAtendimento?: string;
}

export interface ChatMensagensResposta {
  status: ChatStatus;
  mensagens: ChatMensagem[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = `${environment.apiUrl}/Chat`;

  constructor(private http: HttpClient) {}

  private opts() {
    const token = localStorage.getItem('auth_token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private norm<T>(obj: unknown): T {
    if (obj == null || typeof obj !== 'object') return obj as T;
    if (Array.isArray(obj)) return obj.map(i => this.norm(i)) as T;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj as object)) {
      const ck = k.charAt(0).toLowerCase() + k.slice(1);
      out[ck] = this.norm((obj as Record<string, unknown>)[k]);
    }
    return out as T;
  }

  status(): Observable<ChatStatus> {
    return new Observable(sub => {
      this.http.get<unknown>(`${this.base}/Status`, this.opts()).subscribe({
        next: raw => { sub.next(this.norm<ChatStatus>(raw)); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  mensagensCliente(aposId?: number): Observable<ChatMensagensResposta> {
    const q = aposId ? `?aposId=${aposId}` : '';
    return new Observable(sub => {
      this.http.get<unknown>(`${this.base}/Mensagens${q}`, this.opts()).subscribe({
        next: raw => sub.next(this.norm<ChatMensagensResposta>(raw)),
        error: err => sub.error(err),
        complete: () => sub.complete()
      });
    });
  }

  mensagensAdmin(codigoPessoa: number, aposId?: number): Observable<ChatMensagensResposta> {
    const q = aposId ? `?aposId=${aposId}` : '';
    return new Observable(sub => {
      this.http.get<unknown>(`${this.base}/Mensagens/${codigoPessoa}${q}`, this.opts()).subscribe({
        next: raw => sub.next(this.norm<ChatMensagensResposta>(raw)),
        error: err => sub.error(err),
        complete: () => sub.complete()
      });
    });
  }

  conversas(): Observable<ChatConversa[]> {
    return new Observable(sub => {
      this.http.get<unknown[]>(`${this.base}/Conversas`, this.opts()).subscribe({
        next: raw => sub.next((raw ?? []).map(c => this.norm<ChatConversa>(c))),
        error: err => sub.error(err),
        complete: () => sub.complete()
      });
    });
  }

  enviarCliente(texto: string): Observable<ChatMensagem> {
    return new Observable(sub => {
      this.http.post<unknown>(`${this.base}/Mensagens`, { texto }, this.opts()).subscribe({
        next: raw => { sub.next(this.norm<ChatMensagem>(raw)); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  enviarAdmin(codigoPessoa: number, texto: string): Observable<ChatMensagem> {
    return new Observable(sub => {
      this.http.post<unknown>(`${this.base}/Mensagens/${codigoPessoa}`, { texto }, this.opts()).subscribe({
        next: raw => { sub.next(this.norm<ChatMensagem>(raw)); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  contagem(): Observable<number> {
    return new Observable(sub => {
      this.http.get<unknown>(`${this.base}/Contagem`, this.opts()).subscribe({
        next: raw => {
          const c = this.norm<{ totalNaoLidas: number }>(raw);
          sub.next(c.totalNaoLidas ?? 0);
          sub.complete();
        },
        error: () => { sub.next(0); sub.complete(); }
      });
    });
  }

  marcarLidasCliente(): Observable<void> {
    return new Observable(sub => {
      this.http.put(`${this.base}/Lidas`, {}, this.opts()).subscribe({
        next: () => { sub.next(); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  marcarLidasAdmin(codigoPessoa: number): Observable<void> {
    return new Observable(sub => {
      this.http.put(`${this.base}/Lidas/${codigoPessoa}`, {}, this.opts()).subscribe({
        next: () => { sub.next(); sub.complete(); },
        error: err => sub.error(err)
      });
    });
  }

  heartbeat(): Observable<void> {
    return new Observable(sub => {
      this.http.post(`${this.base}/Heartbeat`, {}, this.opts()).subscribe({
        next: () => { sub.next(); sub.complete(); },
        error: () => { sub.next(); sub.complete(); }
      });
    });
  }

  pollingContagem(ms = 30000): Observable<number> {
    return interval(ms).pipe(
      startWith(0),
      switchMap(() => this.contagem()),
      map(c => c ?? 0)
    );
  }
}
