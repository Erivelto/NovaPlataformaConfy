import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ContratacaoFormComponent } from './contratacao-form.component';

const ABERTURA_DOCUMENTOS = [
  'Espelho do IPTU no local onde a empresa será registrada',
  'CNH ou RG',
  'Emissão do certificado Digital',
  'Razão social desejada',
  'Nome fantasia (se houver)',
  'Descrição das atividades que irá exercer',
  'E-mail e telefone para contato',
  'Estado civil e, se casado(a), informar o regime de bens',
] as const;

@Component({
  selector: 'app-abrir-empresa',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule, ContratacaoFormComponent],
  template: `
    <section class="pub-page-hero"><div class="pub-container"><h1>Abrir minha empresa</h1><p>Preencha o formulário e nossa equipe entrará em contato.</p></div></section>
    <section class="pub-section">
      <div class="pub-container pub-abrir-grid">
        <nz-card class="pub-info-card">
          <h3>Documentos no processo de abertura</h3>
          <p class="pub-info-lead">
            Estes itens deverão ser providenciados durante a abertura da empresa.
            Em breve solicitaremos cada um deles ao longo do processo.
          </p>
          <ul class="pub-info-list">
            <li *ngFor="let item of documentos">
              <i nz-icon nzType="check-circle" nzTheme="fill"></i>
              <span>{{ item }}</span>
            </li>
          </ul>
        </nz-card>
        <nz-card>
          <app-contratacao-form
            plano="2"
            [showCnpj]="false"
            nomeLabel="Nome / Contato"
            nomePlaceholder="Seu nome para contato"
            submitLabel="Solicitar abertura de empresa"
          />
        </nz-card>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-abrir-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .pub-info-card h3 {
      margin: 0 0 12px;
      color: var(--primary-color);
      font-size: 1.1rem;
      font-weight: 600;
    }
    .pub-info-lead {
      margin: 0 0 16px;
      color: rgba(26, 26, 46, .72);
      font-size: .92rem;
      line-height: 1.55;
    }
    .pub-info-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pub-info-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: rgba(26, 26, 46, .85);
      font-size: .92rem;
      line-height: 1.45;
    }
    .pub-info-list i {
      color: var(--primary-color);
      margin-top: 2px;
      flex-shrink: 0;
    }
    @media (max-width: 768px) {
      .pub-abrir-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AbrirEmpresaComponent {
  readonly documentos = ABERTURA_DOCUMENTOS;
}

@Component({
  selector: 'app-mudar-contador',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule, ContratacaoFormComponent],
  template: `
    <section class="pub-page-hero"><div class="pub-container"><h1>Mudar de contador</h1><p>Faça a transição para a Contfy com segurança e agilidade.</p></div></section>
    <section class="pub-section">
      <div class="pub-container pub-abrir-grid">
        <nz-card class="pub-info-card">
          <h3>Informações no processo de mudança</h3>
          <p class="pub-info-lead">
            Estes itens deverão ser providenciados durante a troca de contador.
            Em breve solicitaremos cada um deles ao longo do processo.
          </p>
          <ul class="pub-info-list">
            <li *ngFor="let item of documentos">
              <i nz-icon nzType="check-circle" nzTheme="fill"></i>
              <span>{{ item }}</span>
            </li>
          </ul>
        </nz-card>
        <nz-card>
          <app-contratacao-form plano="1" submitLabel="Solicitar mudança de contador" />
        </nz-card>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-abrir-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .pub-info-card h3 {
      margin: 0 0 12px;
      color: var(--primary-color);
      font-size: 1.1rem;
      font-weight: 600;
    }
    .pub-info-lead {
      margin: 0 0 16px;
      color: rgba(26, 26, 46, .72);
      font-size: .92rem;
      line-height: 1.55;
    }
    .pub-info-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pub-info-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: rgba(26, 26, 46, .85);
      font-size: .92rem;
      line-height: 1.45;
    }
    .pub-info-list i {
      color: var(--primary-color);
      margin-top: 2px;
      flex-shrink: 0;
    }
    @media (max-width: 768px) {
      .pub-abrir-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MudarContadorComponent {
  readonly documentos = [
    'CNH ou RG',
    'Certificado Digital',
    'Senhas de Acesso: Portais do Estado e da Prefeitura',
    'Contatos: E-mail e telefone atualizados',
  ] as const;
}
