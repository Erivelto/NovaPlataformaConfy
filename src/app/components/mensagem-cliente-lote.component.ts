import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../environments/environment';

export interface ClienteMensagemRef {
  codigo: number;
  nome: string;
}

@Component({
  selector: 'app-mensagem-cliente-lote',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzModalModule, NzFormModule, NzSelectModule, NzInputModule, NzButtonModule, NzIconModule
  ],
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzTitle]="titulo"
      [nzWidth]="520"
      [nzFooter]="ftMensagem"
      (nzOnCancel)="fechar()">
      <ng-container *nzModalContent>
        <p *ngIf="clientes.length === 1" style="margin-bottom:12px">
          Cliente: <strong>{{ clientes[0].nome }}</strong> ({{ clientes[0].codigo }})
        </p>
        <p *ngIf="clientes.length > 1" style="margin-bottom:12px;color:rgba(0,0,0,.65)">
          Enviando para <strong>{{ clientes.length }}</strong> clientes:
          <span class="destinatarios">{{ resumoDestinatarios }}</span>
        </p>
        <div class="form-row">
          <nz-form-item class="flex1">
            <nz-form-label nzRequired>Tipo de mensagem</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="form.tipoMensagem" style="width:100%">
                <nz-option *ngFor="let t of tiposMensagem" [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div class="form-row">
          <nz-form-item class="flex1">
            <nz-form-label nzRequired>Mensagem</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="form.mensagem"
                rows="6"
                placeholder="Digite a mensagem que será enviada ao cliente"></textarea>
            </nz-form-control>
          </nz-form-item>
        </div>
        <p *ngIf="clientes.length > 1" class="hint-lote">
          Para WhatsApp é necessário número cadastrado; para E-mail, usuário da plataforma. Clientes sem dados serão ignorados com aviso.
        </p>
      </ng-container>
      <ng-template #ftMensagem>
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
    .destinatarios { display: block; margin-top: 4px; font-size: .9rem; }
    .hint-lote { font-size: .85rem; color: rgba(0,0,0,.45); margin: 0; }
  `]
})
export class MensagemClienteLoteComponent implements OnChanges {
  private readonly api = environment.apiUrl;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() clientes: ClienteMensagemRef[] = [];
  @Output() envioConcluido = new EventEmitter<void>();

  enviando = false;
  form = { tipoMensagem: 'Email' as 'Email' | 'Whatsapp', mensagem: '' };
  readonly tiposMensagem = [
    { value: 'Email' as const, label: 'Email' },
    { value: 'Whatsapp' as const, label: 'Whatsapp' }
  ];

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  get titulo(): string {
    return this.clientes.length <= 1
      ? 'Mensagem ao Cliente'
      : `Mensagem ao Cliente (${this.clientes.length} selecionados)`;
  }

  get resumoDestinatarios(): string {
    const nomes = this.clientes.map(c => c.nome);
    if (nomes.length <= 3) return nomes.join(', ');
    return `${nomes.slice(0, 3).join(', ')} e mais ${nomes.length - 3}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.form = { tipoMensagem: 'Email', mensagem: '' };
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }

  enviar(): void {
    if (!this.form.mensagem.trim()) {
      this.message.warning('Digite a mensagem.');
      return;
    }
    if (!this.clientes.length) {
      this.message.warning('Nenhum cliente selecionado.');
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();
    this.enviarSequencial(0, 0, []);
  }

  private enviarSequencial(index: number, sucesso: number, falhas: string[]): void {
    if (index >= this.clientes.length) {
      this.finalizar(sucesso, falhas);
      return;
    }

    const cliente = this.clientes[index];
    this.http.post(`${this.api}/Pessoa/MensagemCliente`, {
      codigoPessoa: cliente.codigo,
      tipoMensagem: this.form.tipoMensagem,
      mensagem: this.form.mensagem.trim()
    }, { headers: this.headers }).subscribe({
      next: () => this.enviarSequencial(index + 1, sucesso + 1, falhas),
      error: (err) => {
        const msg = err.error?.message || `erro ${err.status ?? 'sem resposta'}`;
        falhas.push(`${cliente.nome} (${cliente.codigo}): ${msg}`);
        this.enviarSequencial(index + 1, sucesso, falhas);
      }
    });
  }

  private finalizar(sucesso: number, falhas: string[]): void {
    this.enviando = false;

    if (sucesso > 0 && falhas.length === 0) {
      this.message.success(
        sucesso === 1 ? 'Mensagem enviada com sucesso.' : `${sucesso} mensagens enviadas com sucesso.`
      );
    } else if (sucesso > 0 && falhas.length > 0) {
      this.message.warning(`${sucesso} enviada(s), ${falhas.length} falha(s).`);
      console.warn('Falhas no envio em lote:', falhas);
    } else {
      const detalhe = falhas[0] || 'Verifique os dados dos clientes.';
      this.message.error(`Nenhuma mensagem enviada. ${detalhe}`);
    }

    if (sucesso > 0) {
      this.form.mensagem = '';
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
