import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../environments/environment';

export interface ArquivoEnvioRef {
  codigoPessoa: number;
  nome: string;
  nomeArquivo: string;
  tipoArquivo: string;
  categoria: 'Das' | 'Documento' | 'Debito';
  codigoDas?: number;
  periodo?: string;
  valorTributo?: string;
  marcarDasEnviado?: boolean;
}

@Component({
  selector: 'app-envio-arquivo-cliente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzModalModule, NzFormModule, NzSelectModule, NzButtonModule, NzIconModule
  ],
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzTitle]="titulo"
      [nzWidth]="560"
      [nzFooter]="ftEnvio"
      (nzOnCancel)="fechar()">
      <ng-container *nzModalContent>
        <p *ngIf="itens.length === 1" style="margin-bottom:12px">
          Cliente: <strong>{{ itens[0].nome }}</strong> ({{ itens[0].codigoPessoa }})<br />
          Arquivo: <strong>{{ itens[0].tipoArquivo }}</strong>
        </p>
        <p *ngIf="itens.length > 1" style="margin-bottom:12px;color:rgba(0,0,0,.65)">
          Enviando <strong>{{ itens.length }}</strong> arquivo(s) selecionado(s).
        </p>
        <div class="form-row">
          <nz-form-item class="flex1">
            <nz-form-label nzRequired>Canal de envio</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="tipoMensagem" style="width:100%">
                <nz-option nzValue="Email" nzLabel="E-mail (com anexo PDF)"></nz-option>
                <nz-option nzValue="Whatsapp" nzLabel="WhatsApp (link para download)"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <p class="hint">
          O envio é enfileirado e processado em background. Para WhatsApp é necessário número cadastrado; para e-mail, usuário da plataforma.
        </p>
      </ng-container>
      <ng-template #ftEnvio>
        <button nz-button (click)="fechar()" [disabled]="enviando">Cancelar</button>
        <button nz-button nzType="primary" [nzLoading]="enviando" (click)="enviar()">
          <i nz-icon nzType="send"></i> Enviar
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .form-row { display: flex; gap: 12px; }
    .flex1 { flex: 1; }
    .hint { font-size: .85rem; color: rgba(0,0,0,.45); margin: 0; }
  `]
})
export class EnvioArquivoClienteComponent implements OnChanges {
  private readonly api = environment.apiUrl;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() itens: ArquivoEnvioRef[] = [];
  @Output() envioConcluido = new EventEmitter<void>();

  enviando = false;
  tipoMensagem: 'Email' | 'Whatsapp' = 'Whatsapp';

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  get titulo(): string {
    return this.itens.length <= 1 ? 'Enviar arquivo ao cliente' : `Enviar arquivos (${this.itens.length})`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.tipoMensagem = 'Whatsapp';
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }

  enviar(): void {
    if (!this.itens.length) {
      this.message.warning('Nenhum arquivo selecionado.');
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();
    this.enviarSequencial(0, 0, []);
  }

  private enviarSequencial(index: number, sucesso: number, falhas: string[]): void {
    if (index >= this.itens.length) {
      this.finalizar(sucesso, falhas);
      return;
    }

    const item = this.itens[index];
    this.http.post(`${this.api}/Pessoa/EnviarArquivoCliente`, {
      codigoPessoa: item.codigoPessoa,
      tipoMensagem: this.tipoMensagem,
      nomeArquivo: item.nomeArquivo,
      tipoArquivo: item.tipoArquivo,
      categoria: item.categoria,
      codigoDas: item.codigoDas ?? null,
      periodo: item.periodo ?? '',
      valorTributo: item.valorTributo ?? '',
      marcarDasEnviado: item.marcarDasEnviado === true
    }, { headers: this.headers }).subscribe({
      next: () => this.enviarSequencial(index + 1, sucesso + 1, falhas),
      error: (err) => {
        const msg = err.error?.message || `erro ${err.status ?? 'sem resposta'}`;
        falhas.push(`${item.nome} (${item.tipoArquivo}): ${msg}`);
        this.enviarSequencial(index + 1, sucesso, falhas);
      }
    });
  }

  private finalizar(sucesso: number, falhas: string[]): void {
    this.enviando = false;

    if (sucesso > 0 && falhas.length === 0) {
      this.message.success(sucesso === 1 ? 'Arquivo enfileirado para envio.' : `${sucesso} arquivos enfileirados para envio.`);
    } else if (sucesso > 0 && falhas.length > 0) {
      this.message.warning(`${sucesso} enviado(s), ${falhas.length} falha(s).`);
      console.warn('Falhas no envio:', falhas);
    } else {
      const detalhe = falhas[0] || 'Verifique os dados do cliente.';
      this.message.error(`Nenhum envio realizado. ${detalhe}`);
    }

    if (sucesso > 0) {
      this.fechar();
      this.envioConcluido.emit();
    }

    this.cdr.markForCheck();
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
