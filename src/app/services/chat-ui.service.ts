import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatUiService {
  private abrirCliente$ = new Subject<void>();
  private abrirAdmin$ = new Subject<number | null>();

  readonly clienteAbrir = this.abrirCliente$.asObservable();
  readonly adminAbrir = this.abrirAdmin$.asObservable();

  abrirCliente(): void {
    this.abrirCliente$.next();
  }

  abrirAdmin(codigoPessoa?: number): void {
    this.abrirAdmin$.next(codigoPessoa ?? null);
  }
}
