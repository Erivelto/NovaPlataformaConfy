import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from './login.service';

@Injectable({ providedIn: 'root' })
export class MensalidadeStatusService {
  private readonly apiUrl =
    'https://contfyapinovo-dnhygmhpg2gjerh4.canadacentral-01.azurewebsites.net/api/PessoaCobranca/ObterPagamentoTresUltimos';

  private _atrasadas = new BehaviorSubject<number>(0);
  readonly atrasadas$ = this._atrasadas.asObservable();

  get atrasadas(): number { return this._atrasadas.value; }

  /** Acesso bloqueado quando há mais de 2 mensalidades atrasadas */
  get bloqueado(): boolean { return this._atrasadas.value > 2; }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(private http: HttpClient, private loginService: LoginService) {}

  verificar(): void {
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) return;

    this.http.get<any[]>(`${this.apiUrl}/${pessoa.codigo}`, { headers: this.headers }).subscribe({
      next: (res) => {
        const lista = Array.isArray(res) ? res : [res];
        const atrasadas = lista.filter(item => {
          const s = item.status?.toLowerCase();
          return s === 'unpaid' || s === 'expired';
        }).length;
        this._atrasadas.next(atrasadas);
      },
      error: () => {}
    });
  }
}
