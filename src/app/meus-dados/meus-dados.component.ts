import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PageTitleComponent } from '../page-title.component';
import { PessoaService } from '../services/pessoa.service';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-meus-dados',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzDescriptionsModule, NzTableModule, NzButtonModule,
    NzModalModule, NzInputModule, NzSpinModule, NzAlertModule, NzIconModule, NzTagModule,
    PageTitleComponent
  ],
  template: `
    <div class="meus-dados">
      <app-page-title title="Meus Dados" subtitle="Informacoes cadastrais da sua empresa"></app-page-title>

      <nz-alert *ngIf="erro" nzType="warning" [nzMessage]="erro" nzShowIcon class="alert-top"></nz-alert>

      <nz-spin [nzSpinning]="loading" nzTip="Carregando dados...">

        <nz-card [nzTitle]="tEmpresa" class="sc">
          <ng-template #tEmpresa>
            <i nz-icon nzType="bank" style="margin-right:6px"></i>Dados Empresarial
          </ng-template>
          <nz-descriptions nzBordered [nzColumn]="{ xxl:3, xl:3, lg:3, md:2, sm:1, xs:1 }">
            <nz-descriptions-item nzTitle="Nome Fantasia">{{ pessoa?.nome || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Razao Social" [nzSpan]="2">{{ pessoa?.razao || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CNPJ">{{ cnpjMasked }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Atividade" [nzSpan]="2">{{ pessoa?.descricaoAtividade || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CNAE">{{ pessoa?.cnae || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Inscricao Municipal">{{ pessoa?.incricaoMunicipal || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Tipo de Empresa">{{ tipoPessoa }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Logradouro" [nzSpan]="2">{{ fmtEnd(pessoa?.endereco) }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Bairro">{{ pessoa?.endereco?.bairro || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Cidade / UF">{{ cityUF(pessoa?.endereco) }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CEP">{{ pessoa?.endereco?.cep || '-' }}</nz-descriptions-item>
          </nz-descriptions>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="openModal('Dados Empresarial')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

        <nz-card [nzTitle]="tRep" class="sc" *ngIf="rep">
          <ng-template #tRep>
            <i nz-icon nzType="idcard" style="margin-right:6px"></i>Representante Legal
          </ng-template>
          <nz-descriptions nzBordered [nzColumn]="{ xxl:3, xl:3, lg:3, md:2, sm:1, xs:1 }">
            <nz-descriptions-item nzTitle="Nome" [nzSpan]="2">{{ rep?.nome || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CPF">{{ cpfMasked }}</nz-descriptions-item>
            <ng-container *ngIf="enderecoRep">
              <nz-descriptions-item nzTitle="Logradouro" [nzSpan]="2">{{ fmtEnd(enderecoRep) }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="Bairro">{{ enderecoRep?.bairro || '-' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="Cidade / UF">{{ cityUF(enderecoRep) }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="CEP">{{ enderecoRep?.cep || '-' }}</nz-descriptions-item>
            </ng-container>
          </nz-descriptions>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="openModal('Representante Legal')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

        <nz-card [nzTitle]="tContatos" class="sc" *ngIf="contatos.length > 0">
          <ng-template #tContatos>
            <i nz-icon nzType="phone" style="margin-right:6px"></i>Contatos
          </ng-template>
          <nz-table [nzData]="contatos" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Celular</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of contatos">
                <td>{{ c.codigo }}</td>
                <td>{{ c.email || '-' }}</td>
                <td>{{ c.ddd ? (c.ddd + ' - ' + c.telefone) : (c.telefone || '-') }}</td>
                <td>{{ c.dddc ? (c.dddc + ' - ' + c.celular) : (c.celular || '-') }}</td>
              </tr>
            </tbody>
          </nz-table>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="openModal('Contatos')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

      </nz-spin>
    </div>

    <nz-modal
      [(nzVisible)]="modalVisible"
      [nzTitle]="'Solicitar alteracao - ' + modalSecao"
      nzOkText="Enviar"
      nzCancelText="Cancelar"
      (nzOnCancel)="closeModal()"
      (nzOnOk)="enviar()"
      [nzOkDisabled]="!mensagem.trim()"
    >
      <ng-container *nzModalContent>
        <p class="modal-hint">Descreva as alteracoes para <strong>{{ modalSecao }}</strong>:</p>
        <textarea nz-input rows="7" [(ngModel)]="mensagem" placeholder="Digite sua mensagem..." style="width:100%;resize:vertical"></textarea>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `.meus-dados { padding: 8px 4px; }`,
    `.sc { margin-bottom: 16px; }`,
    `.alert-top { margin-bottom: 16px; }`,
    `.card-foot { margin-top: 16px; display: flex; justify-content: flex-end; }`,
    `.modal-hint { margin-bottom: 12px; color: rgba(0,0,0,0.65); }`
  ]
})
export class MeusDadosComponent implements OnInit {
  loading = true;
  erro = '';
  pessoa: any = null;
  rep: any = null;
  enderecoRep: any = null;
  contatos: any[] = [];
  modalVisible = false;
  modalSecao = '';
  mensagem = '';

  constructor(private pessoaService: PessoaService, private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    const pessoaSession = this.loginService.obterPessoa();
    if (!pessoaSession?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.pessoa = pessoaSession;
    this.rep = pessoaSession.listaRepresentante?.[0] || null;
    const codigoRep = this.rep?.codigo;
    if (codigoRep) {
      forkJoin({
        enderecoRep: this.pessoaService.getEnderecoRepresentante(codigoRep).pipe(catchError(() => of(null))),
        contatos: this.pessoaService.getContatos(codigoRep).pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ enderecoRep, contatos }) => {
          this.enderecoRep = enderecoRep;
          this.contatos = contatos || [];
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  get cnpjMasked(): string {
    const doc = (this.pessoa?.documento || '').replace(/\D/g, '');
    if (doc.length < 14) return doc || '-';
    return doc.slice(0, 2) + '.***.***/' + doc.slice(8, 12) + '-' + doc.slice(12, 14);
  }

  get cpfMasked(): string {
    const cpf = (this.rep?.cpf || '').replace(/\D/g, '');
    if (cpf.length < 11) return cpf || '-';
    return cpf.slice(0, 3) + '.***.***-' + cpf.slice(9, 11);
  }

  get tipoPessoa(): string {
    const t = this.pessoa?.tipoPessoa;
    if (t == null) return '-';
    return t === 1 ? 'Comercio' : 'Servico';
  }

  fmtEnd(e: any): string {
    if (!e?.logradouro) return '-';
    return [e.tipoEnd, e.logradouro, e.numrero ? 'n ' + e.numrero : null, e.complemento]
      .filter(Boolean).join(', ');
  }

  cityUF(e: any): string {
    if (!e?.cidade) return '-';
    return e.uf ? e.cidade + ' / ' + e.uf : e.cidade;
  }

  openModal(secao: string): void {
    this.modalSecao = secao;
    this.mensagem = '';
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.mensagem = '';
  }

  enviar(): void {
    this.closeModal();
  }
}
