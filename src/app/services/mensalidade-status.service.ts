import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from './login.service';
import { environment } from '../../environments/environment';

/** Cobrança retornada por ObterPagamentoTresUltimos (camelCase na API). */
interface CobrancaMensalidade {
  status?: string;
  dateVencimento?: string;
  dataTransacao?: string;
}

@Injectable({ providedIn: 'root' })
export class MensalidadeStatusService {
  private readonly apiUrl =
    `${environment.apiUrl}/PessoaCobranca/ObterPagamentoTresUltimos`;

  private _atrasadas = new BehaviorSubject<number>(0);
  private _bloqueado = new BehaviorSubject<boolean>(false);
  readonly atrasadas$ = this._atrasadas.asObservable();
  readonly bloqueado$ = this._bloqueado.asObservable();

  get atrasadas(): number { return this._atrasadas.value; }
  get bloqueado(): boolean { return this._bloqueado.value; }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(private http: HttpClient, private loginService: LoginService) {}

  verificar(): void {
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) return;

    this.http.get<CobrancaMensalidade[]>(`${this.apiUrl}/${pessoa.codigo}`, { headers: this.headers }).subscribe({
      next: (res) => {
        const lista = Array.isArray(res) ? res : res ? [res] : [];
        const hoje = inicioDoDia(new Date());
        let atrasadas = 0;
        let bloqueado = false;

        for (const item of lista) {
          if (!isInadimplente(item.status)) continue;
          const vencimento = obterDataVencimento(item);
          if (!vencimento) continue;

          if (hoje >= inicioDoDia(vencimento)) {
            atrasadas++;
          }
          if (deveBloquearAcesso(vencimento, hoje)) {
            bloqueado = true;
          }
        }

        this._atrasadas.next(atrasadas);
        this._bloqueado.next(bloqueado);
      },
      error: () => {}
    });
  }
}

/** unpaid / expired (Gerencianet). */
export function isInadimplente(status?: string): boolean {
  const s = status?.toLowerCase();
  return s === 'unpaid' || s === 'expired';
}

/** Dia 1 do mês seguinte ao vencimento — ex.: venc. 15/10 → bloqueio a partir de 01/11. */
export function deveBloquearAcesso(vencimento: Date, hoje: Date): boolean {
  const inicioMesSeguinte = new Date(vencimento.getFullYear(), vencimento.getMonth() + 1, 1);
  return inicioDoDia(hoje) >= inicioDoDia(inicioMesSeguinte);
}

function obterDataVencimento(item: CobrancaMensalidade): Date | null {
  return parseDataApi(item.dateVencimento) ?? parseDataApi(item.dataTransacao);
}

function parseDataApi(valor?: string): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
