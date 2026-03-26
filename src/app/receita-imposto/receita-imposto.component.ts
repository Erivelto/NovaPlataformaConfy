import { Component } from '@angular/core';
import { PageTitleComponent } from '../page-title.component';

@Component({
  selector: 'app-receita-imposto',
  standalone: true,
  imports: [PageTitleComponent],
  template: `
    <app-page-title title="Impostos" subtitle="Receita e impostos"></app-page-title>
    <div style="text-align:center; padding:80px 24px;">
      <div style="font-size:64px; margin-bottom:16px;">🚧</div>
      <h2 style="font-size:24px; color:rgba(0,0,0,0.85); margin-bottom:8px;">Funcionalidade em Construção</h2>
      <p style="color:rgba(0,0,0,0.45); font-size:16px;">Esta área estará disponível em breve.<br>Aguarde as próximas atualizações.</p>
    </div>
  `
})
export class ReceitaImpostoComponent {}
