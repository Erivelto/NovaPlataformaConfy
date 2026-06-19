import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeModule, NzTreeNode, NzFormatEmitEvent } from 'ng-zorro-antd/tree';

import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface PessoaData { codigo: number; nome?: string; razao?: string; documento?: string; incricaoMunicipal?: string; descricaoAtividade?: string; cnae?: string; tipoPessoa?: number; fatAtivo?: boolean; prolaboreAtivo?: boolean; dASAtivo?: boolean; mei?: boolean; fisica?: boolean; numeroWhats?: string; status?: string; dataInclusao?: string; dataAtulizacao?: string; contabilidade?: number; excluido?: boolean; usuario?: string; endereco?: EnderecoData; }
interface EnderecoData { codigo?: number; codigoPessoa?: number; tipoEnd?: string; logradouro?: string; numrero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string; excluido?: boolean; }
interface ValidacaoPessoa { usuario: boolean; celular: boolean; prefeitura: boolean; dadosDAS: boolean; cobranca: boolean; documentos: boolean; }
interface RepresentanteLegal { codigo: number; codigoPessoa: number; nome: string; cpf: string; dataContfy?: string; codigoEndereco?: number; tipoEnd?: string; logradouro?: string; numrero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string; }
interface DadosEmissao { codigo: number; codigoPessoa: number; usuario: string; senha: string; prefeitura: string; urlPrefeitura?: string; codigoPrefeitura?: string; excluido?: boolean; }
interface DadosDAS { codigo: number; codigoPessoa: number; cnpj: string; cpf: string; codigoContribuite: string; mesApuracao?: number; anoApuracao?: number; valorTributado?: string; excluido?: boolean; }
interface AnexoContribuinte { codigo: number; codigoDadosDeDAS: number; menu: string; anexo: string; excluido?: boolean; }
interface AnexoMenuModel { codigo: number; menu: string; }
interface AnexoMenuItemModel { codigo: number; item: string; codigoMenu: number; }
interface Prefeitura { codigo: number; nome: string; }
interface PessoaUpload { codigo: number; codigoPessoa: number; tipo: string; nomeArquivo: string; dataValidade?: string; }
interface DadosCobranca { codigo: number; codigoPessoa: number; tipo: string; diaCobranca: number; mensalidade: number; cpf: string; celular?: string; email: string; excluido?: boolean; dataAlteracao?: string; }
interface PessoaCobranca { transacao?: string; dateVencimento?: string; valorBruto?: number; status?: string; }

@Component({
  selector: 'app-cliente-editar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTabsModule, NzFormModule, NzInputModule, NzButtonModule,
    NzSelectModule, NzCheckboxModule, NzSwitchModule, NzIconModule, NzAlertModule,
    NzTableModule, NzTagModule, NzModalModule, NzSkeletonModule, NzMessageModule,
    NzDividerModule, NzToolTipModule, NzUploadModule, NzCollapseModule, NzBadgeModule,
    NzSpinModule, NzTreeModule, PageTitleComponent
  ],
  template: `
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <button nz-button nzType="default" (click)="voltar()"><i nz-icon nzType="arrow-left"></i> Voltar</button>
    <app-page-title
      [title]="loading ? 'Carregando...' : (pessoa.razao || pessoa.nome || 'Cliente')"
      [subtitle]="pessoa.documento ? 'CNPJ/CPF: ' + pessoa.documento : ''">
    </app-page-title>
    <nz-tag *ngIf="pessoa.fisica" nzColor="purple">Pessoa Física</nz-tag>
    <nz-tag *ngIf="!pessoa.fisica && !loading" nzColor="blue">Pessoa Jurídica</nz-tag>
  </div>

  <ng-container *ngIf="loading">
    <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:6}"></nz-skeleton>
  </ng-container>

  <!-- Painel de pendências — só exibe se houver algo pendente -->
  <div *ngIf="!loading && totalPendencias > 0" class="pendencias-card">
    <div class="pendencias-header">
      <i nz-icon nzType="solution" style="font-size:18px"></i>
      <span>Status do Cadastro</span>
      <nz-tag [nzColor]="totalPendencias === 0 ? 'green' : 'orange'" style="margin-left:auto">
        {{ totalPendencias === 0 ? 'Completo' : totalPendencias + ' pendência(s)' }}
      </nz-tag>
    </div>
    <div class="pendencias-itens">

      <div class="pend-item" [class.ok]="temWhats" [class.pend]="!temWhats" (click)="!temWhats && irParaAba(0)">
        <i nz-icon [nzType]="temWhats ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temWhats ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
        <span>WhatsApp</span>
        <span *ngIf="!temWhats" class="pend-hint">→ preencher</span>
      </div>

      <div class="pend-item" [class.ok]="temEndereco" [class.pend]="!temEndereco" (click)="!temEndereco && irParaAba(1)">
        <i nz-icon [nzType]="temEndereco ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temEndereco ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
        <span>End.</span>
        <span *ngIf="!temEndereco" class="pend-hint">→ preencher</span>
      </div>

      <div class="pend-item" [class.ok]="temRepresentante" [class.pend]="!temRepresentante" (click)="!temRepresentante && irParaAba(2)">
        <i nz-icon [nzType]="temRepresentante ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temRepresentante ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
        <span>Rep. Legal</span>
        <span *ngIf="!temRepresentante" class="pend-hint">→ preencher</span>
      </div>

      <ng-container *ngIf="!pessoa.fisica">
        <div class="pend-item" [class.ok]="temUsuario" [class.pend]="!temUsuario" (click)="!temUsuario && irParaAba(3)">
          <i nz-icon [nzType]="temUsuario ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temUsuario ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
          <span>User Plataforma</span>
          <span *ngIf="!temUsuario" class="pend-hint">→ cadastrar</span>
        </div>

        <div class="pend-item" [class.ok]="temDadosRobo" [class.pend]="!temDadosRobo" (click)="!temDadosRobo && irParaAba(4)">
          <i nz-icon [nzType]="temDadosRobo ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temDadosRobo ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
          <span>Robô (NF/DAS)</span>
          <span *ngIf="!temDadosRobo" class="pend-hint">→ preencher</span>
        </div>

        <div class="pend-item" [class.ok]="temCobranca" [class.pend]="!temCobranca" (click)="!temCobranca && irParaAba(5)">
          <i nz-icon [nzType]="temCobranca ? 'check-circle' : 'close-circle'" nzTheme="fill" [style.color]="temCobranca ? '#52c41a' : '#ff4d4f'" style="font-size:18px;flex-shrink:0"></i>
          <span>Cobrança</span>
          <span *ngIf="!temCobranca" class="pend-hint">→ preencher</span>
        </div>
      </ng-container>

      <div class="pend-item" [class.ok]="temDocumentos" [class.pend]="!temDocumentos" (click)="!temDocumentos && irParaAba(pessoa.fisica ? 3 : 6)">
        <i nz-icon [nzType]="temDocumentos ? 'check-circle' : 'warning'" nzTheme="fill" [style.color]="temDocumentos ? '#52c41a' : '#faad14'" style="font-size:18px;flex-shrink:0"></i>
        <span>Documentos</span>
        <span *ngIf="!temDocumentos" class="pend-hint">→ anexar</span>
      </div>

    </div>
  </div>

  <!-- Abas -->
  <nz-card *ngIf="!loading" style="margin-top:12px">
    <nz-tabset [(nzSelectedIndex)]="abaAtiva">

      <!-- ABA 1: DADOS CADASTRAIS -->
      <nz-tab nzTitle="Dados Cadastrais">
        <div class="form-section">
          <nz-divider nzText="Dados da Empresa" nzOrientation="left"></nz-divider>
          <div class="form-row">
            <nz-form-item class="flex2"><nz-form-label nzRequired>Razão Social</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.razao" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex2"><nz-form-label>Nome Fantasia</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.nome" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-row">
            <nz-form-item class="flex1"><nz-form-label nzRequired>{{ pessoa.fisica ? 'CPF' : 'CNPJ' }}</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.documento" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label>Inscrição Municipal</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.incricaoMunicipal" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label>CNAE</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.cnae" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-row">
            <nz-form-item class="flex3"><nz-form-label>Atividade</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.descricaoAtividade" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label>WhatsApp / Telegram</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="pessoa.numeroWhats" placeholder="5511900000000" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-row" *ngIf="!pessoa.fisica">
            <nz-form-item class="flex1"><nz-form-label>Tipo de Pessoa</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="pessoa.tipoPessoa" style="width:100%">
                  <nz-option [nzValue]="0" nzLabel="Serviço"></nz-option>
                  <nz-option [nzValue]="1" nzLabel="Comércio"></nz-option>
                </nz-select>
              </nz-form-control></nz-form-item>
          </div>

          <nz-divider nzText="Configurações" nzOrientation="left"></nz-divider>
          <div class="flags-row">
            <div class="flag-item">
              <label>Faturamento Ativo</label>
              <nz-switch [(ngModel)]="pessoa.fatAtivo" [nzDisabled]="!!pessoa.fisica"></nz-switch>
            </div>
            <div class="flag-item">
              <label>Pró-labore</label>
              <nz-switch [(ngModel)]="pessoa.prolaboreAtivo" [nzDisabled]="!!pessoa.fisica"></nz-switch>
            </div>
            <div class="flag-item">
              <label>DAS Desativado</label>
              <nz-switch [(ngModel)]="pessoa.dASAtivo" [nzDisabled]="!!pessoa.fisica"></nz-switch>
            </div>
            <div class="flag-item">
              <label>MEI</label>
              <nz-switch [(ngModel)]="pessoa.mei" [nzDisabled]="!!pessoa.fisica"></nz-switch>
            </div>
            <div class="flag-item">
              <label class="flag-danger">Bloquear Acesso</label>
              <nz-switch [(ngModel)]="statusLogin" nzCheckedChildren="Bloqueado" nzUnCheckedChildren="Liberado"></nz-switch>
            </div>
          </div>

          <div class="form-actions">
            <button nz-button nzType="primary" [nzLoading]="salvando" (click)="salvar()">
              <i nz-icon nzType="save"></i> Salvar
            </button>
          </div>
        </div>
      </nz-tab>

      <!-- ABA 2: ENDEREÇO -->
      <nz-tab nzTitle="Endereço">
        <div class="form-section">
          <div class="form-row">
            <nz-form-item style="flex:0 0 130px"><nz-form-label nzRequired>CEP</nz-form-label>
              <nz-form-control>
                <nz-input-group [nzSuffix]="cepSuffix">
                  <input nz-input [(ngModel)]="endereco.cep" (blur)="buscarCep()" placeholder="00000-000" />
                </nz-input-group>
                <ng-template #cepSuffix><i nz-icon [nzType]="buscandoCep ? 'loading' : 'search'" (click)="buscarCep()" style="cursor:pointer"></i></ng-template>
              </nz-form-control></nz-form-item>
            <nz-form-item style="flex:0 0 120px"><nz-form-label>Tipo End.</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.tipoEnd" placeholder="Rua, Av..." /></nz-form-control></nz-form-item>
            <nz-form-item class="flex3"><nz-form-label nzRequired>Logradouro</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.logradouro" /></nz-form-control></nz-form-item>
            <nz-form-item style="flex:0 0 90px"><nz-form-label nzRequired>Número</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.numrero" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-row">
            <nz-form-item class="flex2"><nz-form-label>Complemento</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.complemento" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex2"><nz-form-label>Bairro</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.bairro" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-row">
            <nz-form-item class="flex3"><nz-form-label nzRequired>Cidade</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="endereco.cidade" /></nz-form-control></nz-form-item>
            <nz-form-item style="flex:0 0 90px"><nz-form-label nzRequired>UF</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="endereco.uf" style="width:100%">
                  <nz-option *ngFor="let u of ufs" [nzValue]="u" [nzLabel]="u"></nz-option>
                </nz-select>
              </nz-form-control></nz-form-item>
          </div>
          <div class="form-actions">
            <button nz-button nzType="primary" [nzLoading]="salvando" (click)="salvar()">
              <i nz-icon nzType="save"></i> Salvar
            </button>
          </div>
        </div>
      </nz-tab>

      <!-- ABA 3: REPRESENTANTE LEGAL -->
      <nz-tab nzTitle="Representante Legal">
        <div class="form-section">
          <div style="text-align:right;margin-bottom:12px">
            <button nz-button nzType="primary" (click)="abrirNovoRep()"><i nz-icon nzType="plus"></i> Novo Representante</button>
          </div>
          <nz-table [nzData]="representantes" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead><tr>
              <th>Nome</th><th nzWidth="140px">CPF</th>
              <th nzWidth="130px">Data Cadastro</th><th nzWidth="130px">Cidade/UF</th>
              <th nzWidth="80px" nzAlign="center">Ação</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let r of representantes">
                <td>{{ r.nome }}</td>
                <td>{{ r.cpf }}</td>
                <td>{{ r.dataContfy ? (r.dataContfy | date:'dd/MM/yyyy') : '—' }}</td>
                <td>{{ r.cidade ? r.cidade + '/' + r.uf : '—' }}</td>
                <td nzAlign="center">
                  <button nz-button nzSize="small" nzType="primary" (click)="editarRep(r)"><i nz-icon nzType="edit"></i></button>
                </td>
              </tr>
              <tr *ngIf="representantes.length===0">
                <td colspan="5" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">Nenhum representante cadastrado.</td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </nz-tab>

      <!-- ABA 4: USER PLATAFORMA (somente PJ) -->
      <nz-tab *ngIf="!pessoa.fisica" nzTitle="User Plataforma">
        <div class="form-section">

          <!-- Usuário atual -->
          <div class="user-plat-box" *ngIf="pessoa.usuario; else semUser">
            <i nz-icon nzType="user" nzTheme="fill" style="font-size:32px;color:#1890ff"></i>
            <div class="user-plat-info">
              <div class="user-plat-label">Usuário da Plataforma</div>
              <div class="user-plat-email">{{ pessoa.usuario }}</div>
              <nz-tag nzColor="green">Acesso ativo</nz-tag>
            </div>
          </div>
          <ng-template #semUser>
            <nz-alert nzType="warning" nzMessage="Nenhum usuário de plataforma cadastrado para este cliente." nzShowIcon style="margin-bottom:20px"></nz-alert>
          </ng-template>

          <nz-divider [nzText]="pessoa.usuario ? 'Alterar Acesso' : 'Cadastrar Acesso'" nzOrientation="left" style="margin-top:24px"></nz-divider>
          <p style="color:rgba(0,0,0,.45);font-size:.85rem;margin-bottom:16px">
            {{ pessoa.usuario ? 'Para alterar o e-mail de acesso, informe o e-mail atual e o novo.' : 'Informe o e-mail que será usado como login do cliente na plataforma.' }}
            A senha inicial será <strong>Q1w2e3r4&#64;</strong> e o cliente deverá alterá-la no primeiro acesso.
          </p>

          <div class="form-row">
            <nz-form-item class="flex1" *ngIf="pessoa.usuario">
              <nz-form-label nzRequired>E-mail Atual</nz-form-label>
              <nz-form-control>
                <nz-input-group [nzPrefix]="pfxMail">
                  <input nz-input [(ngModel)]="userForm.emailAntigo" placeholder="email@atual.com" type="email" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item class="flex1">
              <nz-form-label nzRequired>{{ pessoa.usuario ? 'E-mail Novo' : 'E-mail' }}</nz-form-label>
              <nz-form-control>
                <nz-input-group [nzPrefix]="pfxMail">
                  <input nz-input [(ngModel)]="userForm.email" placeholder="email@novo.com" type="email" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>
            <ng-template #pfxMail><i nz-icon nzType="mail"></i></ng-template>
          </div>

          <div class="form-actions">
            <button nz-button nzType="primary" [nzLoading]="salvandoUser" (click)="salvarUser()">
              <i nz-icon [nzType]="pessoa.usuario ? 'edit' : 'user-add'"></i>
              {{ pessoa.usuario ? 'Alterar Acesso' : 'Cadastrar Acesso' }}
            </button>
            <button *ngIf="pessoa.usuario" nz-button nzType="default" [nzLoading]="redefinindoSenha" (click)="redefinirSenha()" style="margin-left:8px">
              <i nz-icon nzType="key"></i> Redefinir Senha
            </button>
          </div>

        </div>
      </nz-tab>

      <!-- ABA 5: DADOS ROBÔ (somente PJ) -->
      <nz-tab *ngIf="!pessoa.fisica" nzTitle="Dados Robô">
        <div class="form-section">

          <!-- Emissão NF -->
          <nz-divider nzText="Emissão de Nota Fiscal" nzOrientation="left"></nz-divider>
          <nz-table [nzData]="emissoes" nzBordered nzSize="small" [nzShowPagination]="false" style="margin-bottom:12px">
            <thead><tr><th>Usuário</th><th nzWidth="140px">Codigo Acesso</th><th>Prefeitura</th><th nzWidth="130px">Cód. Prefeitura</th><th nzWidth="60px" nzAlign="center">Ação</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of emissoes">
                <td>{{ e.usuario }}</td><td>{{ e.senha }}</td><td>{{ e.prefeitura }}</td><td>{{ e.codigoPrefeitura }}</td>
                <td nzAlign="center"><button nz-button nzSize="small" nzType="primary" (click)="editarEmissao(e)"><i nz-icon nzType="edit"></i></button></td>
              </tr>
              <tr *ngIf="emissoes.length===0"><td colspan="5" style="text-align:center;padding:16px;color:rgba(0,0,0,.45)">Sem dados de emissão.</td></tr>
            </tbody>
          </nz-table>
          <button nz-button nzType="default" (click)="abrirNovaEmissao()"><i nz-icon nzType="plus"></i> Adicionar Credencial NF</button>

          <!-- DAS -->
          <nz-divider nzText="Dados DAS" nzOrientation="left" style="margin-top:24px"></nz-divider>

          <!-- Registro existente -->
          <ng-container *ngIf="dasInline.codigo && dasInline.codigo > 0; else semDAS">
            <div class="das-info-box" *ngIf="!editandoDAS">
              <div class="das-info-row">
                <div class="das-info-item">
                  <span class="das-info-label">Código Contribuinte</span>
                  <span class="das-info-val">{{ dasInline.codigoContribuite || '—' }}</span>
                </div>
                <div class="das-info-item">
                  <span class="das-info-label">CPF</span>
                  <span class="das-info-val">{{ dasInline.cpf || '—' }}</span>
                </div>
                <div class="das-info-item">
                  <span class="das-info-label">CNPJ</span>
                  <span class="das-info-val">{{ pessoa.documento || '—' }}</span>
                </div>
                <button nz-button nzSize="small" nzType="primary" nzGhost (click)="editandoDAS = true" style="align-self:flex-end">
                  <i nz-icon nzType="edit"></i> Editar
                </button>
              </div>
            </div>

            <ng-container *ngIf="editandoDAS">
              <div class="form-row">
                <nz-form-item class="flex2">
                  <nz-form-label>Código Contribuinte</nz-form-label>
                  <nz-form-control><input nz-input [(ngModel)]="dasInline.codigoContribuite" placeholder="Código do contribuinte" /></nz-form-control>
                </nz-form-item>
                <nz-form-item class="flex1">
                  <nz-form-label>CPF</nz-form-label>
                  <nz-form-control><input nz-input [(ngModel)]="dasInline.cpf" placeholder="000.000.000-00" /></nz-form-control>
                </nz-form-item>
                <nz-form-item class="flex1">
                  <nz-form-label>CNPJ</nz-form-label>
                  <nz-form-control><input nz-input [ngModel]="pessoa.documento" disabled /></nz-form-control>
                </nz-form-item>
              </div>
              <div class="form-actions" style="border-top:none;padding-top:0;margin-top:-4px">
                <button nz-button nzType="primary" [nzLoading]="salvandoDAS" (click)="salvarDASInline()">
                  <i nz-icon nzType="save"></i> Atualizar DAS
                </button>
                <button nz-button nzType="default" (click)="editandoDAS = false" style="margin-left:8px">Cancelar</button>
              </div>
            </ng-container>
          </ng-container>

          <!-- Sem registro: mostra formulário de cadastro -->
          <ng-template #semDAS>
            <div class="form-row">
              <nz-form-item class="flex2">
                <nz-form-label>Código Contribuinte</nz-form-label>
                <nz-form-control><input nz-input [(ngModel)]="dasInline.codigoContribuite" placeholder="Código do contribuinte" /></nz-form-control>
              </nz-form-item>
              <nz-form-item class="flex1">
                <nz-form-label>CPF</nz-form-label>
                <nz-form-control><input nz-input [(ngModel)]="dasInline.cpf" placeholder="000.000.000-00" /></nz-form-control>
              </nz-form-item>
              <nz-form-item class="flex1">
                <nz-form-label>CNPJ</nz-form-label>
                <nz-form-control><input nz-input [ngModel]="pessoa.documento" disabled /></nz-form-control>
              </nz-form-item>
            </div>
            <div class="form-actions" style="border-top:none;padding-top:0;margin-top:-4px">
              <button nz-button nzType="primary" [nzLoading]="salvandoDAS" (click)="salvarDASInline()">
                <i nz-icon nzType="save"></i> Cadastrar DAS
              </button>
            </div>
          </ng-template>
          <!-- ANEXO CONTRIBUINTE -->
          <nz-divider nzText="Anexo" nzOrientation="left" style="margin-top:24px"></nz-divider>

          <div *ngIf="carregandoAnexo" style="text-align:center;padding:16px">
            <nz-spin nzSimple></nz-spin>
          </div>

          <ng-container *ngIf="!carregandoAnexo">
            <!-- Registro existente -->
            <ng-container *ngIf="anexoContribuinte; else semAnexo">
              <div class="das-info-box">
                <div class="das-info-row">
                  <div class="das-info-item" style="flex:1">
                    <span class="das-info-label">Menu</span>
                    <span class="das-info-val">{{ anexoContribuinte.menu || '—' }}</span>
                  </div>
                  <div class="das-info-item" style="flex:2">
                    <span class="das-info-label">Anexo</span>
                    <span class="das-info-val" style="word-break:break-all">
                      <a *ngIf="anexoContribuinte.anexo" [href]="anexoContribuinte.anexo" target="_blank" rel="noopener">
                        <i nz-icon nzType="paper-clip"></i> {{ anexoContribuinte.anexo }}
                      </a>
                      <span *ngIf="!anexoContribuinte.anexo">—</span>
                    </span>
                  </div>
                  <button nz-button nzType="default" nzDanger nzSize="small"
                    [nzLoading]="excluindoAnexo"
                    nz-popconfirm nzPopconfirmTitle="Excluir este anexo permanentemente?"
                    nzOkText="Excluir" nzCancelText="Cancelar"
                    (nzOnConfirm)="excluirAnexo(anexoContribuinte!.codigo)"
                    style="align-self:flex-end;flex-shrink:0">
                    <i nz-icon nzType="delete"></i> Excluir
                  </button>
                </div>
              </div>
            </ng-container>

            <!-- Sem registro -->
            <ng-template #semAnexo>
              <ng-container *ngIf="dasInline.codigo && dasInline.codigo > 0; else semDASParaAnexo">
                <div class="sem-anexo-box">
                  <i nz-icon nzType="inbox" style="font-size:32px;color:rgba(0,0,0,.25)"></i>
                  <span style="color:rgba(0,0,0,.45);margin:8px 0">Nenhum anexo cadastrado para este DAS.</span>
                  <button nz-button nzType="primary" nzGhost (click)="abrirModalAnexo()">
                    <i nz-icon nzType="plus"></i> Cadastrar Anexo
                  </button>
                </div>
              </ng-container>
              <ng-template #semDASParaAnexo>
                <nz-alert nzType="info" nzMessage="Cadastre os Dados DAS primeiro para poder vincular um anexo." nzShowIcon></nz-alert>
              </ng-template>
            </ng-template>
          </ng-container>

        </div>
      </nz-tab>

      <!-- ABA 5: COBRANÇA (somente PJ) -->
      <nz-tab *ngIf="!pessoa.fisica" nzTitle="Cobrança">
        <div class="form-section">
          <nz-divider nzText="Dados de Cobrança" nzOrientation="left"></nz-divider>
          <div class="form-row">
            <nz-form-item class="flex1"><nz-form-label nzRequired>Tipo</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="cobranca.tipo" style="width:100%">
                  <nz-option nzValue="Boleto" nzLabel="Boleto"></nz-option>
                  <nz-option nzValue="Parceiro" nzLabel="Parceiro"></nz-option>
                  <nz-option nzValue="Cartao" nzLabel="Cartão"></nz-option>
                  <nz-option nzValue="Pix" nzLabel="Pix"></nz-option>
                </nz-select>
              </nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label nzRequired>Vencimento (dia)</nz-form-label>
              <nz-form-control><input nz-input type="number" min="1" max="28" [(ngModel)]="cobranca.diaCobranca" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label nzRequired>Mensalidade (R$)</nz-form-label>
              <nz-form-control>
                <nz-input-group nzPrefix="R$">
                  <input nz-input type="number" [(ngModel)]="cobranca.mensalidade" step="0.01" />
                </nz-input-group>
              </nz-form-control></nz-form-item>
          </div>
          <div class="form-row">
            <nz-form-item class="flex1"><nz-form-label nzRequired>CPF Responsável</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="cobranca.cpf" placeholder="000.000.000-00" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex2"><nz-form-label nzRequired>E-mail</nz-form-label>
              <nz-form-control><input nz-input type="email" [(ngModel)]="cobranca.email" /></nz-form-control></nz-form-item>
            <nz-form-item class="flex1"><nz-form-label>Celular</nz-form-label>
              <nz-form-control><input nz-input [(ngModel)]="cobranca.celular" /></nz-form-control></nz-form-item>
          </div>
          <div class="form-actions">
            <button nz-button nzType="primary" [nzLoading]="salvandoCobranca" (click)="salvarCobranca()">
              <i nz-icon nzType="save"></i> Salvar Cobrança
            </button>
          </div>

          <nz-divider nzText="Últimas Faturas" nzOrientation="left"></nz-divider>
          <nz-table [nzData]="ultimasFaturas" nzBordered nzSize="small" [nzShowPagination]="false">
            <thead><tr><th nzWidth="130px">Vencimento</th><th nzWidth="130px">Valor</th><th nzWidth="120px" nzAlign="center">Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let f of ultimasFaturas">
                <td>{{ f.dateVencimento | date:'dd/MM/yyyy' }}</td>
                <td>{{ f.valorBruto | currency:'BRL':'symbol':'1.2-2' }}</td>
                <td nzAlign="center"><nz-tag [nzColor]="statusCobrancaColor(f.status)">{{ statusCobrancaLabel(f.status) }}</nz-tag></td>
              </tr>
              <tr *ngIf="ultimasFaturas.length===0"><td colspan="3" style="text-align:center;padding:16px;color:rgba(0,0,0,.45)">Sem histórico.</td></tr>
            </tbody>
          </nz-table>
        </div>
      </nz-tab>

      <!-- ABA 6: DOCUMENTOS -->
      <nz-tab nzTitle="Documentos">
        <div class="form-section">
          <div style="text-align:right;margin-bottom:12px">
            <button nz-button nzType="primary" (click)="abrirUpload()"><i nz-icon nzType="upload"></i> Novo Documento</button>
          </div>
          <nz-table [nzData]="documentos" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead><tr><th>Tipo</th><th>Arquivo</th><th nzWidth="130px">Validade</th><th nzWidth="100px" nzAlign="center">Ação</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of documentos">
                <td><nz-tag>{{ d.tipo }}</nz-tag></td>
                <td>{{ d.nomeArquivo }}</td>
                <td>{{ d.dataValidade ? (d.dataValidade | date:'dd/MM/yyyy') : '—' }}</td>
                <td nzAlign="center">
                  <button nz-button nzDanger nzSize="small" [nzLoading]="excluindoDoc.has(d.codigo)" (click)="excluirDoc(d)"><i nz-icon nzType="delete"></i></button>
                </td>
              </tr>
              <tr *ngIf="documentos.length===0"><td colspan="4" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">Nenhum documento anexado.</td></tr>
            </tbody>
          </nz-table>
        </div>
      </nz-tab>

    </nz-tabset>
  </nz-card>
</div>

<!-- MODAL: Cadastro de Anexo (Treeview) -->
<nz-modal
  [(nzVisible)]="modalAnexoVisible"
  nzTitle="Cadastrar Anexo"
  [nzWidth]="520"
  [nzFooter]="ftAnexo"
  (nzOnCancel)="modalAnexoVisible = false">
  <ng-container *nzModalContent>
    <div *ngIf="carregandoTree" style="text-align:center;padding:32px"><nz-spin nzSimple nzTip="Carregando menus..."></nz-spin></div>
    <ng-container *ngIf="!carregandoTree">
      <p style="color:rgba(0,0,0,.55);margin-bottom:12px;font-size:.88rem">
        Selecione um <strong>subitem</strong> para associar ao DAS atual.
      </p>
      <nz-tree
        [nzData]="treeNodes"
        nzShowIcon
        (nzClick)="onTreeNodeClick($event)"
        style="border:1px solid #d9d9d9;border-radius:6px;padding:8px;max-height:340px;overflow-y:auto">
      </nz-tree>
      <div *ngIf="selectedAnexoItem" style="margin-top:16px;padding:12px 16px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px">
        <div style="font-size:.78rem;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.04em">Selecionado</div>
        <div style="font-weight:700;margin-top:4px">{{ selectedAnexoMenu }} → {{ selectedAnexoItem.item }}</div>
      </div>
      <nz-alert *ngIf="!selectedAnexoItem" nzType="warning" nzMessage="Selecione um subitem para continuar." nzShowIcon style="margin-top:12px"></nz-alert>
    </ng-container>
  </ng-container>
  <ng-template #ftAnexo>
    <button nz-button (click)="modalAnexoVisible = false">Cancelar</button>
    <button nz-button nzType="primary" [nzLoading]="salvandoAnexo" [disabled]="!selectedAnexoItem" (click)="salvarAnexo()">
      <i nz-icon nzType="save"></i> Salvar
    </button>
  </ng-template>
</nz-modal>

<!-- MODAL: Representante Legal -->
<nz-modal [(nzVisible)]="repVisible" [nzTitle]="repSelecionado?.codigo ? 'Editar Representante' : 'Novo Representante'"
  [nzWidth]="680" [nzFooter]="ftRep" (nzOnCancel)="repVisible=false">
  <ng-container *nzModalContent>
    <div class="form-row">
      <nz-form-item class="flex2"><nz-form-label nzRequired>Nome</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.nome" /></nz-form-control></nz-form-item>
      <nz-form-item class="flex1"><nz-form-label nzRequired>CPF</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.cpf" placeholder="000.000.000-00" /></nz-form-control></nz-form-item>
    </div>
    <div class="form-row">
      <nz-form-item style="flex:0 0 100px"><nz-form-label>Tipo End.</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.tipoEnd" placeholder="Rua..." /></nz-form-control></nz-form-item>
      <nz-form-item class="flex3"><nz-form-label nzRequired>Endereço</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.logradouro" /></nz-form-control></nz-form-item>
      <nz-form-item style="flex:0 0 80px"><nz-form-label nzRequired>Nº</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.numrero" /></nz-form-control></nz-form-item>
    </div>
    <div class="form-row">
      <nz-form-item class="flex2"><nz-form-label>Complemento</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.complemento" /></nz-form-control></nz-form-item>
      <nz-form-item class="flex2"><nz-form-label>Bairro</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.bairro" /></nz-form-control></nz-form-item>
    </div>
    <div class="form-row">
      <nz-form-item class="flex3"><nz-form-label nzRequired>Cidade</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.cidade" /></nz-form-control></nz-form-item>
      <nz-form-item style="flex:0 0 80px"><nz-form-label nzRequired>UF</nz-form-label>
        <nz-form-control><nz-select [(ngModel)]="repForm.uf" style="width:100%">
          <nz-option *ngFor="let u of ufs" [nzValue]="u" [nzLabel]="u"></nz-option>
        </nz-select></nz-form-control></nz-form-item>
      <nz-form-item style="flex:0 0 120px"><nz-form-label nzRequired>CEP</nz-form-label>
        <nz-form-control><input nz-input [(ngModel)]="repForm.cep" placeholder="00000-000" /></nz-form-control></nz-form-item>
    </div>
  </ng-container>
  <ng-template #ftRep>
    <button nz-button (click)="repVisible=false" [disabled]="salvandoRep">Fechar</button>
    <button nz-button nzType="primary" [nzLoading]="salvandoRep" (click)="salvarRep()">Salvar</button>
  </ng-template>
</nz-modal>

<!-- MODAL: Credencial NF -->
<nz-modal [(nzVisible)]="emissaoVisible" [nzTitle]="emissaoForm.codigo ? 'Editar Credencial NF' : 'Nova Credencial NF'"
  [nzWidth]="520" [nzFooter]="ftEmissao" (nzOnCancel)="emissaoVisible=false">
  <ng-container *nzModalContent>
    <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Prefeitura</nz-form-label>
      <nz-form-control [nzSpan]="24">
        <nz-select [(ngModel)]="emissaoForm.prefeitura" style="width:100%" nzShowSearch nzPlaceHolder="Selecione a prefeitura">
          <nz-option *ngFor="let p of prefeituras" [nzValue]="p.nome" [nzLabel]="p.nome"></nz-option>
        </nz-select>
      </nz-form-control></nz-form-item>
    <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Usuário</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="emissaoForm.usuario" /></nz-form-control></nz-form-item>
    <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Senha</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input type="password" [(ngModel)]="emissaoForm.senha" /></nz-form-control></nz-form-item>
    <nz-form-item><nz-form-label [nzSpan]="24">Código da Prefeitura</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="emissaoForm.codigoPrefeitura" /></nz-form-control></nz-form-item>
  </ng-container>
  <ng-template #ftEmissao>
    <button nz-button (click)="emissaoVisible=false" [disabled]="salvandoEmissao">Fechar</button>
    <button nz-button nzType="primary" [nzLoading]="salvandoEmissao" (click)="salvarEmissao()">Salvar</button>
  </ng-template>
</nz-modal>

<!-- MODAL: Dados DAS -->
<nz-modal [(nzVisible)]="dasVisible" nzTitle="Dados DAS" [nzWidth]="440" [nzFooter]="ftDAS" (nzOnCancel)="dasVisible=false">
  <ng-container *nzModalContent>
    <nz-form-item><nz-form-label [nzSpan]="24">Código Contribuinte</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="dasForm.codigoContribuite" /></nz-form-control></nz-form-item>
    <nz-form-item><nz-form-label [nzSpan]="24">CPF</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="dasForm.cpf" placeholder="000.000.000-00" /></nz-form-control></nz-form-item>
  </ng-container>
  <ng-template #ftDAS>
    <button nz-button (click)="dasVisible=false" [disabled]="salvandoDAS">Fechar</button>
    <button nz-button nzType="primary" [nzLoading]="salvandoDAS" (click)="salvarDAS()">Salvar</button>
  </ng-template>
</nz-modal>

<!-- MODAL: Upload -->
<nz-modal [(nzVisible)]="uploadVisible" nzTitle="Novo Documento" [nzWidth]="480" [nzFooter]="ftUpload" (nzOnCancel)="uploadVisible=false">
  <ng-container *nzModalContent>
    <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Tipo</nz-form-label>
      <nz-form-control [nzSpan]="24">
        <nz-select [(ngModel)]="uploadForm.tipo" style="width:100%">
          <nz-option nzValue="Nota Fiscal" nzLabel="Nota Fiscal"></nz-option>
          <nz-option nzValue="Contrato Social" nzLabel="Contrato Social"></nz-option>
          <nz-option nzValue="Cadastro Municipal" nzLabel="Cadastro Municipal"></nz-option>
          <nz-option nzValue="Cartão CNPJ" nzLabel="Cartão CNPJ"></nz-option>
          <nz-option nzValue="Certificado Digital" nzLabel="Certificado Digital"></nz-option>
        </nz-select>
      </nz-form-control></nz-form-item>
    <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Arquivo</nz-form-label>
      <nz-form-control [nzSpan]="24">
        <nz-upload nzAction="" [nzBeforeUpload]="beforeUpload" [nzFileList]="fileList" [nzAccept]="'.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.pfx,.p12'">
          <button nz-button><i nz-icon nzType="upload"></i> Selecionar arquivo</button>
        </nz-upload>
      </nz-form-control></nz-form-item>
    <nz-form-item *ngIf="uploadForm.tipo === 'Certificado Digital'"><nz-form-label [nzSpan]="24">Data de Validade</nz-form-label>
      <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="uploadForm.dataValidade" placeholder="dd/MM/yyyy" /></nz-form-control></nz-form-item>
  </ng-container>
  <ng-template #ftUpload>
    <button nz-button (click)="uploadVisible=false" [disabled]="fazendoUpload">Fechar</button>
    <button nz-button nzType="primary" [nzLoading]="fazendoUpload" (click)="fazerUpload()">Enviar</button>
  </ng-template>
</nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .page-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .page-header app-page-title { flex: 1; }
    .pendencias-card { border: 2px solid #ff4d4f; border-radius: 10px; background: #fff2f0; margin: 12px 0; overflow: hidden; box-shadow: 0 2px 10px rgba(255,77,79,.15); }
    .pendencias-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #ff4d4f; border-bottom: 2px solid #ff4d4f; font-weight: 700; color: #fff; font-size: .95rem; }
    .pendencias-header i { color: #fff !important; }
    .pendencias-itens { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0; }
    .pend-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-right: 1px solid #ffccc7; border-bottom: 1px solid #ffccc7; background: #fff; transition: background .15s; }
    .pend-item.pend { cursor: pointer; background: #fff2f0; }
    .pend-item.pend:hover { background: #ffccc7; }
    .pend-item.pend > span:first-of-type { font-weight: 700; color: #cf1322; font-size: .9rem; }
    .pend-item.ok { background: #f6ffed; }
    .pend-item.ok > span:first-of-type { color: rgba(0,0,0,.45); font-size: .9rem; }
    .pend-hint { font-size: .72rem; color: #ff4d4f; margin-left: auto; white-space: nowrap; font-weight: 600; }
    .sem-anexo-box { display:flex;flex-direction:column;align-items:center;padding:24px;border:1px dashed #d9d9d9;border-radius:8px;background:#fafafa; }
    .das-info-box { background:#f6ffed;border:1.5px solid #b7eb8f;border-radius:8px;padding:16px 20px;margin-bottom:8px; }
    .das-info-row { display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap; }
    .das-info-item { display:flex;flex-direction:column;gap:2px; }
    .das-info-label { font-size:.75rem;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.04em; }
    .das-info-val { font-size:1rem;font-weight:600;color:rgba(0,0,0,.85); }
    .user-plat-box { display:flex;align-items:center;gap:20px;background:#f0f8ff;border:1.5px solid #91caff;border-radius:10px;padding:20px 24px;margin-bottom:8px; }
    .user-plat-info { display:flex;flex-direction:column;gap:6px; }
    .user-plat-label { font-size:.8rem;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.05em; }
    .user-plat-email { font-size:1.15rem;font-weight:700;color:#1890ff; }
    .form-section { padding: 8px 4px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 0; align-items: flex-start; }
    .form-row nz-form-item { margin-bottom: 14px; display: flex; flex-direction: column; }
    .flex1 { flex: 1; min-width: 160px; }
    .flex2 { flex: 2; min-width: 220px; }
    .flex3 { flex: 3; min-width: 280px; }

    /* Label sempre acima do input — layout vertical forçado */
    .form-row nz-form-label, .form-row ::ng-deep .ant-form-item-label {
      display: block; width: 100%; text-align: left; padding: 0 0 4px 0; white-space: nowrap; overflow: visible;
      line-height: 1.4;
    }
    .form-row nz-form-label > label, .form-row ::ng-deep .ant-form-item-label > label {
      height: auto; font-size: .82rem; color: rgba(0,0,0,.65); font-weight: 600;
    }
    .form-row nz-form-control, .form-row ::ng-deep .ant-form-item-control {
      width: 100%; flex: 1;
    }
    /* Remove o padding lateral padrão do label horizontal do NG-ZORRO */
    .form-row ::ng-deep .ant-form-item { flex-direction: column; }
    .form-row ::ng-deep .ant-form-item-label { padding-bottom: 4px; }
    .form-row ::ng-deep .ant-col { max-width: 100%; flex: 0 0 100%; }
    .flags-row { display: flex; gap: 24px; flex-wrap: wrap; margin: 8px 0 16px; }
    .flag-item { display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .flag-item label { font-size: .82rem; color: rgba(0,0,0,.55); font-weight: 600; text-align: center; }
    .flag-danger { color: #ff4d4f !important; }
    .form-actions { margin-top: 8px; border-top: 1px solid #f0f0f0; padding-top: 16px; text-align: right; }
  `]
})
export class ClienteEditarComponent implements OnInit {
  private readonly api = environment.apiUrl;
  codigoPessoa = 0;
  loading = true; salvando = false; salvandoCobranca = false;
  buscandoCep = false;

  pessoa: PessoaData = {} as PessoaData;
  endereco: EnderecoData = {};
  validacao: ValidacaoPessoa | null = null;
  representantes: RepresentanteLegal[] = [];
  emissoes: DadosEmissao[] = [];
  dadosDasList: DadosDAS[] = [];
  prefeituras: Prefeitura[] = [];
  documentos: PessoaUpload[] = [];
  cobranca: DadosCobranca = { codigo: 0, codigoPessoa: 0, tipo: 'Boleto', diaCobranca: 5, mensalidade: 79.90, cpf: '', email: '' };
  ultimasFaturas: PessoaCobranca[] = [];
  statusLogin = false;
  excluindoDoc = new Set<number>();
  abaAtiva = 0;

  get temWhats(): boolean { return !!(this.pessoa.numeroWhats?.trim()); }
  get temEndereco(): boolean { return !!(this.endereco.logradouro?.trim()); }
  get temUsuario(): boolean { return !!(this.pessoa.usuario?.trim()); }
  get temRepresentante(): boolean { return this.representantes.length > 0; }
  get temDadosRobo(): boolean { return this.emissoes.length > 0 || this.dadosDasList.length > 0; }
  get temCobranca(): boolean { return this.cobranca.codigo > 0; }
  get temDocumentos(): boolean { return this.documentos.length > 0; }
  get totalPendencias(): number {
    let count = 0;
    if (!this.temWhats) count++;
    if (!this.temEndereco) count++;
    if (!this.pessoa.fisica && !this.temUsuario) count++;
    if (!this.temRepresentante) count++;
    if (!this.pessoa.fisica) {
      if (!this.temDadosRobo) count++;
      if (!this.temCobranca) count++;
    }
    if (!this.temDocumentos) count++;
    return count;
  }

  irParaAba(index: number): void { this.abaAtiva = index; this.cdr.markForCheck(); }

  // Representante
  repVisible = false; salvandoRep = false;
  repSelecionado: RepresentanteLegal | null = null;
  repForm: Partial<RepresentanteLegal> = {};

  // Emissão NF
  emissaoVisible = false; salvandoEmissao = false;
  emissaoForm: Partial<DadosEmissao> = { codigo: 0, codigoPessoa: 0, usuario: '', senha: '', prefeitura: '', codigoPrefeitura: '' };

  // DAS
  dasVisible = false; salvandoDAS = false;
  dasForm: Partial<DadosDAS> = { codigoContribuite: '', cpf: '' };
  dasInline: Partial<DadosDAS> = { codigo: 0, codigoContribuite: '', cpf: '' };
  editandoDAS = false;
  anexoContribuinte: AnexoContribuinte | null = null;
  carregandoAnexo = false;
  excluindoAnexo = false;
  // Modal cadastro anexo
  modalAnexoVisible = false;
  carregandoTree = false;
  salvandoAnexo = false;
  treeNodes: NzTreeNode[] = [];
  selectedAnexoItem: AnexoMenuItemModel | null = null;
  selectedAnexoMenu: string = '';

  // User Plataforma
  salvandoUser = false;
  redefinindoSenha = false;
  userForm = { emailAntigo: '', email: '' };

  // Upload
  uploadVisible = false; fazendoUpload = false;
  uploadForm = { tipo: 'Contrato Social', dataValidade: '' };
  fileList: NzUploadFile[] = [];
  selectedFile: File | null = null;

  readonly ufs = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }
  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private message: NzMessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.codigoPessoa = +this.route.snapshot.paramMap.get('id')!;
    this.carregar();
  }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(10000), catchError(() => of(null)));
    forkJoin({
      pessoa:     safe(this.http.get<any>(`${this.api}/Pessoa/${this.codigoPessoa}`, { headers: this.h })),
      validacao:  safe(this.http.get<any>(`${this.api}/Pessoa/GetValidacaoPessoa/${this.codigoPessoa}`, { headers: this.h })),
      prefeituras: safe(this.http.get<Prefeitura[]>(`${this.api}/Prefeitura`, { headers: this.h })),
      uploads:    safe(this.http.get<PessoaUpload[]>(`${this.api}/PessoaUpload`, { headers: this.h })),
      emissao:    safe(this.http.get<DadosEmissao[]>(`${this.api}/DadosEmissaoNota`, { headers: this.h })),
      cobranca:   safe(this.http.get<DadosCobranca>(`${this.api}/DadosDeCobranca/${this.codigoPessoa}`, { headers: this.h })),
      faturas:    safe(this.http.get<PessoaCobranca[]>(`${this.api}/PessoaCobranca/ObterPagamentoTresUltimos/${this.codigoPessoa}`, { headers: this.h })),
      userPlat:   safe(this.http.get<{ email: string; existe: boolean }>(`${this.api}/Autenticacao/UsuarioPorPessoa/${this.codigoPessoa}`, { headers: this.h }))
    }).subscribe({ next: (r) => {
      if (r.pessoa) {
        const p = r.pessoa as PessoaData;
        // Injeta o e-mail do usuário de plataforma (vem do Identity, não da tabela Pessoa)
        const emailPlat = (r.userPlat as any)?.email ?? null;
        this.pessoa = { ...p, usuario: emailPlat };
        this.endereco = p.endereco ? { ...p.endereco } : {};
        this.statusLogin = p.status === 'bloqueado';
      }
      this.validacao = r.validacao ? (r.validacao as ValidacaoPessoa) : null;
      this.prefeituras = Array.isArray(r.prefeituras) ? r.prefeituras : [];
      this.documentos = Array.isArray(r.uploads) ? (r.uploads as PessoaUpload[]).filter((u: PessoaUpload) => u.codigoPessoa === this.codigoPessoa) : [];
      this.emissoes = Array.isArray(r.emissao) ? (r.emissao as DadosEmissao[]).filter((e: DadosEmissao) => e.codigoPessoa === this.codigoPessoa) : [];
      if (r.cobranca && (r.cobranca as DadosCobranca).codigo) {
        this.cobranca = { ...(r.cobranca as DadosCobranca), codigoPessoa: this.codigoPessoa };
      } else {
        this.cobranca = { codigo: 0, codigoPessoa: this.codigoPessoa, tipo: 'Boleto', diaCobranca: 5, mensalidade: 79.90, cpf: '', email: '' };
      }
      this.ultimasFaturas = Array.isArray(r.faturas) ? r.faturas : [];
      this.carregarRepresentantes();
      this.carregarDAS();
    }, error: () => { this.loading = false; this.cdr.markForCheck(); }});
  }

  carregarRepresentantes() {
    this.http.get<RepresentanteLegal[]>(`${this.api}/RepresentanteLegal/Pessoa/${this.codigoPessoa}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([])))
      .subscribe(r => { this.representantes = Array.isArray(r) ? r : []; this.loading = false; this.cdr.markForCheck(); });
  }

  carregarDAS() {
    this.http.get<DadosDAS[]>(`${this.api}/DadosDeDAS/PorCodigoPessoa/${this.codigoPessoa}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([])))
      .subscribe(r => {
        this.dadosDasList = Array.isArray(r) ? r as DadosDAS[] : [];
        // pré-preenche formulário inline com o primeiro registro existente
        if (this.dadosDasList.length > 0) {
          const d = this.dadosDasList[0];
          this.dasInline = { codigo: d.codigo, codigoPessoa: d.codigoPessoa, codigoContribuite: d.codigoContribuite, cpf: d.cpf, cnpj: d.cnpj };
          this.carregarAnexo(d.codigo);
        } else {
          this.dasInline = { codigo: 0, codigoPessoa: this.codigoPessoa, codigoContribuite: '', cpf: '', cnpj: (this.pessoa.documento || '').replace(/\D/g, '') };
          this.anexoContribuinte = null;
        }
        this.cdr.markForCheck();
      });
  }

  salvar() {
    this.salvando = true; this.cdr.markForCheck();
    const bloqueioObs = this.statusLogin
      ? this.http.put(`${this.api}/Autenticacao/Bloqueio/${this.codigoPessoa}`, {}, { headers: this.h })
      : this.http.put(`${this.api}/Autenticacao/Desbloqueio/${this.codigoPessoa}`, {}, { headers: this.h });

    bloqueioObs.pipe(catchError(() => of(null))).subscribe(() => {
      const payload = {
        ...this.pessoa,
        endereco: { ...this.endereco, codigoPessoa: this.codigoPessoa },
        documento: (this.pessoa.documento || '').replace(/\D/g, ''),
        incricaoMunicipal: (this.pessoa.incricaoMunicipal || '').replace(/\D/g, ''),
        cep: (this.endereco.cep || '').replace(/\D/g, ''),
        dataAtulizacao: new Date().toISOString()
      };
      this.http.put(`${this.api}/Pessoa`, payload, { headers: this.h }).subscribe({
        next: () => { this.message.success('Dados salvos com sucesso!'); this.salvando = false; this.cdr.markForCheck(); },
        error: (e) => { this.message.error(`Erro ao salvar (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
      });
    });
  }

  buscarCep() {
    const cep = (this.endereco.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.buscandoCep = true; this.cdr.markForCheck();
    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).pipe(timeout(5000), catchError(() => of(null))).subscribe(r => {
      if (r && !r.erro) {
        this.endereco.logradouro = r.logradouro || this.endereco.logradouro;
        this.endereco.bairro = r.bairro || this.endereco.bairro;
        this.endereco.cidade = r.localidade || this.endereco.cidade;
        this.endereco.uf = r.uf || this.endereco.uf;
      }
      this.buscandoCep = false; this.cdr.markForCheck();
    });
  }

  salvarCobranca() {
    this.salvandoCobranca = true; this.cdr.markForCheck();
    const obs = this.cobranca.codigo
      ? this.http.put(`${this.api}/DadosDeCobranca`, { ...this.cobranca, dataAlteracao: new Date().toISOString() }, { headers: this.h })
      : this.http.post(`${this.api}/DadosDeCobranca`, this.cobranca, { headers: this.h });
    obs.subscribe({
      next: () => { this.message.success('Cobrança salva!'); this.salvandoCobranca = false; this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvandoCobranca = false; this.cdr.markForCheck(); }
    });
  }

  abrirNovoRep() { this.repSelecionado = null; this.repForm = { codigoPessoa: this.codigoPessoa }; this.repVisible = true; this.cdr.markForCheck(); }
  editarRep(r: RepresentanteLegal) { this.repSelecionado = r; this.repForm = { ...r }; this.repVisible = true; this.cdr.markForCheck(); }
  salvarRep() {
    if (!this.repForm.nome?.trim() || !this.repForm.cpf?.trim()) { this.message.warning('Preencha nome e CPF.'); return; }
    this.salvandoRep = true; this.cdr.markForCheck();
    const payload = { ...this.repForm, codigoPessoa: this.codigoPessoa, cep: (this.repForm.cep || '').replace(/\D/g,'') };
    const obs = this.repSelecionado
      ? this.http.put(`${this.api}/RepresentanteLegal`, payload, { headers: this.h })
      : this.http.post(`${this.api}/RepresentanteLegal`, payload, { headers: this.h });
    obs.subscribe({
      next: () => { this.message.success('Representante salvo!'); this.salvandoRep = false; this.repVisible = false; this.carregarRepresentantes(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvandoRep = false; this.cdr.markForCheck(); }
    });
  }

  abrirNovaEmissao() { this.emissaoForm = { codigo: 0, codigoPessoa: this.codigoPessoa, usuario: '', senha: '', prefeitura: '', codigoPrefeitura: '' }; this.emissaoVisible = true; this.cdr.markForCheck(); }
  editarEmissao(e: DadosEmissao) { this.emissaoForm = { ...e }; this.emissaoVisible = true; this.cdr.markForCheck(); }
  salvarEmissao() {
    if (!this.emissaoForm.usuario?.trim() || !this.emissaoForm.prefeitura?.trim()) { this.message.warning('Preencha prefeitura e usuário.'); return; }
    this.salvandoEmissao = true; this.cdr.markForCheck();
    const obs = this.emissaoForm.codigo
      ? this.http.put(`${this.api}/DadosEmissaoNota`, { ...this.emissaoForm, codigoPessoa: this.codigoPessoa }, { headers: this.h })
      : this.http.post(`${this.api}/DadosEmissaoNota`, { ...this.emissaoForm, codigoPessoa: this.codigoPessoa }, { headers: this.h });
    obs.subscribe({
      next: () => { this.message.success('Credencial NF salva!'); this.salvandoEmissao = false; this.emissaoVisible = false; this.carregar(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvandoEmissao = false; this.cdr.markForCheck(); }
    });
  }

  abrirModalAnexo() {
    this.selectedAnexoItem = null;
    this.selectedAnexoMenu = '';
    this.modalAnexoVisible = true;
    this.carregandoTree = true;
    this.cdr.markForCheck();
    forkJoin({
      menus: this.http.get<AnexoMenuModel[]>(`${this.api}/DadosDeDAS/AnexoMenu`, { headers: this.h }).pipe(catchError(() => of([]))),
      itens: this.http.get<AnexoMenuItemModel[]>(`${this.api}/DadosDeDAS/AnexoMenuItem`, { headers: this.h }).pipe(catchError(() => of([])))
    }).subscribe(({ menus, itens }) => {
      this.treeNodes = menus.map(m => ({
        title: m.menu,
        key: `menu-${m.codigo}`,
        icon: 'folder',
        isLeaf: false,
        selectable: false,
        expanded: false,
        children: itens
          .filter(i => i.codigoMenu === m.codigo)
          .map(i => ({
            title: i.item,
            key: `item-${i.codigo}`,
            icon: 'file-text',
            isLeaf: true,
            selectable: true,
            origin: { menuText: m.menu, item: i }
          } as any))
      } as any));
      this.carregandoTree = false;
      this.cdr.markForCheck();
    });
  }

  onTreeNodeClick(event: NzFormatEmitEvent) {
    const node = event.node;
    if (!node || !node.isLeaf) return;
    const origin = (node as any).origin;
    if (origin?.item) {
      this.selectedAnexoItem = origin.item as AnexoMenuItemModel;
      this.selectedAnexoMenu = origin.menuText as string;
      this.cdr.markForCheck();
    }
  }

  salvarAnexo() {
    if (!this.selectedAnexoItem || !this.dasInline.codigo) return;
    this.salvandoAnexo = true; this.cdr.markForCheck();
    const payload = {
      codigoDadosDeDAS: this.dasInline.codigo,
      menu: this.selectedAnexoMenu,
      anexo: this.selectedAnexoItem.item,
      excluido: false
    };
    this.http.post<AnexoContribuinte>(`${this.api}/AnexoContribuinte`, payload, { headers: this.h }).subscribe({
      next: (res) => {
        this.message.success('Anexo cadastrado com sucesso!');
        this.anexoContribuinte = res;
        this.modalAnexoVisible = false;
        this.salvandoAnexo = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.message.error(`Erro ao cadastrar anexo (${e.status})`);
        this.salvandoAnexo = false;
        this.cdr.markForCheck();
      }
    });
  }

  carregarAnexo(codigoDAS: number) {
    this.carregandoAnexo = true; this.cdr.markForCheck();
    this.http.get<AnexoContribuinte[]>(`${this.api}/AnexoContribuinte/ListaPorCodigoDAS/${codigoDAS}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([])))
      .subscribe(r => {
        this.anexoContribuinte = Array.isArray(r) && r.length > 0 ? r[0] : null;
        this.carregandoAnexo = false;
        this.cdr.markForCheck();
      });
  }

  excluirAnexo(codigo: number) {
    this.excluindoAnexo = true; this.cdr.markForCheck();
    this.http.delete(`${this.api}/AnexoContribuinte/Fisico/${codigo}`, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Anexo excluído com sucesso.');
        this.anexoContribuinte = null;
        this.excluindoAnexo = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.message.error(`Erro ao excluir anexo (${e.status})`);
        this.excluindoAnexo = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirNovoDAS() { this.dasForm = { codigoPessoa: this.codigoPessoa, cnpj: (this.pessoa.documento || '').replace(/\D/g,''), codigoContribuite: '', cpf: '' }; this.dasVisible = true; this.cdr.markForCheck(); }
  salvarDAS() {
    this.salvandoDAS = true; this.cdr.markForCheck();
    const agora = new Date();
    const payload = { ...this.dasForm, codigoPessoa: this.codigoPessoa, cnpj: (this.pessoa.documento || '').replace(/\D/g,''), mesApuracao: agora.getMonth() + 1, anoApuracao: agora.getFullYear() };
    this.http.post(`${this.api}/DadosDeDAS`, payload, { headers: this.h }).subscribe({
      next: () => { this.message.success('Dados DAS salvos!'); this.salvandoDAS = false; this.dasVisible = false; this.carregarDAS(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvandoDAS = false; this.cdr.markForCheck(); }
    });
  }

  salvarDASInline() {
    this.salvandoDAS = true; this.cdr.markForCheck();
    const agora = new Date();
    const cnpj = (this.pessoa.documento || '').replace(/\D/g, '');
    const payload = { ...this.dasInline, codigoPessoa: this.codigoPessoa, cnpj, mesApuracao: agora.getMonth() + 1, anoApuracao: agora.getFullYear() };
    const isEdicao = this.dasInline.codigo && this.dasInline.codigo > 0;
    const obs = isEdicao
      ? this.http.put(`${this.api}/DadosDeDAS`, payload, { headers: this.h })
      : this.http.post(`${this.api}/DadosDeDAS`, payload, { headers: this.h });
    obs.subscribe({
      next: (res: any) => { this.message.success('Dados DAS salvos!'); this.salvandoDAS = false; this.editandoDAS = false; this.carregarDAS(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvandoDAS = false; this.cdr.markForCheck(); }
    });
  }

  abrirUpload() { this.uploadForm = { tipo: 'Contrato Social', dataValidade: '' }; this.fileList = []; this.selectedFile = null; this.uploadVisible = true; this.cdr.markForCheck(); }
  beforeUpload = (file: NzUploadFile): boolean => {
    this.selectedFile = file as any;
    this.fileList = [file];
    return false;
  };
  fazerUpload() {
    if (!this.selectedFile) { this.message.warning('Selecione um arquivo.'); return; }
    this.fazendoUpload = true; this.cdr.markForCheck();
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      this.http.post(`http://armazemantodearquivocontfy.azurewebsites.net/ArmazenamentoDeObjeto`, { codigo: crypto.randomUUID(), image: base64, pasta: this.codigoPessoa }, { headers: this.h }).pipe(catchError(() => of(null))).subscribe(res => {
        const nomArquivo = (res as any)?.nomeArquivo || this.selectedFile!.name;
        const payload = { codigoPessoa: this.codigoPessoa, tipo: this.uploadForm.tipo, nomeArquivo: nomArquivo, dataValidade: this.uploadForm.dataValidade || null };
        this.http.post(`${this.api}/PessoaUpload`, payload, { headers: this.h }).subscribe({
          next: () => { this.message.success('Documento enviado!'); this.fazendoUpload = false; this.uploadVisible = false; this.carregar(); },
          error: (err) => { this.message.error(`Erro (${err.status})`); this.fazendoUpload = false; this.cdr.markForCheck(); }
        });
      });
    };
    reader.readAsDataURL(this.selectedFile as any);
  }

  excluirDoc(d: PessoaUpload) {
    this.excluindoDoc.add(d.codigo); this.cdr.markForCheck();
    this.http.delete(`${this.api}/PessoaUpload/ExcluirUpload/${d.codigo}`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Excluído.'); this.documentos = this.documentos.filter(x => x.codigo !== d.codigo); this.excluindoDoc.delete(d.codigo); this.cdr.markForCheck(); },
      error: (err) => { this.message.error(`Erro (${err.status})`); this.excluindoDoc.delete(d.codigo); this.cdr.markForCheck(); }
    });
  }

  salvarUser() {
    const novoEmail = this.userForm.email.trim().toLowerCase();
    if (!novoEmail) { this.message.warning('Informe o e-mail.'); return; }
    if (this.pessoa.usuario && !this.userForm.emailAntigo.trim()) { this.message.warning('Informe o e-mail atual.'); return; }
    this.salvandoUser = true; this.cdr.markForCheck();

    // Cria ou atualiza usuário de plataforma vinculado ao cliente (endpoint admin)
    const payload = { email: novoEmail, codigoPessoa: this.codigoPessoa };
    this.http.post(`${this.api}/Autenticacao/AdminRegistroUsuario`, payload, { headers: this.h }).subscribe({
      next: () => {
        this.message.success(this.pessoa.usuario
          ? `Acesso alterado! Novo e-mail: ${novoEmail}`
          : `Usuário cadastrado! E-mail: ${novoEmail} | Senha: Q1w2e3r4&#64;`);
        this.pessoa = { ...this.pessoa, usuario: novoEmail };
        this.userForm = { emailAntigo: '', email: '' };
        this.salvandoUser = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao salvar usuário (${e.status})`);
        this.salvandoUser = false;
        this.cdr.markForCheck();
      }
    });
  }

  redefinirSenha() {
    if (!this.pessoa.usuario) return;
    this.redefinindoSenha = true; this.cdr.markForCheck();
    const email = encodeURIComponent(this.pessoa.usuario);
    this.http.put(`${this.api}/Autenticacao/AlterarSenha/${email}`, { novaSenha: 'Q1w2e3r4@' }, { headers: this.h }).subscribe({
      next: () => {
        this.message.success(`Senha redefinida para Q1w2e3r4&#64; e enviada por e-mail ao cliente.`);
        this.redefinindoSenha = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao redefinir senha (${e.status})`);
        this.redefinindoSenha = false;
        this.cdr.markForCheck();
      }
    });
  }

  statusCobrancaLabel(s: string | undefined): string { const m: any = { paid:'Pago', settled:'Pago', waiting:'Aguardando', canceled:'Cancelado', unpaid:'Devedor', expired:'Expirado' }; return m[(s||'').toLowerCase()] || s || '—'; }
  statusCobrancaColor(s: string | undefined): string { const m: any = { paid:'green', settled:'green', waiting:'orange', canceled:'default', unpaid:'red', expired:'red' }; return m[(s||'').toLowerCase()] || 'default'; }

  voltar() { this.router.navigate([this.pessoa.fisica ? '/administrativo/clientes-fisica' : '/administrativo/clientes']); }
}
