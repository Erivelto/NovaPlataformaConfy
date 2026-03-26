import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-sample-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <div style="max-width:600px">
      <h2>Formulário de exemplo</h2>
      <form nz-form (ngSubmit)="submit()">
        <nz-form-item>
          <nz-form-control>
            <input nz-input name="name" [(ngModel)]="model.name" placeholder="Nome" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <input nz-input name="email" [(ngModel)]="model.email" placeholder="Email" />
          </nz-form-control>
        </nz-form-item>

        <div style="margin-top:12px">
          <button nz-button nzType="primary" htmlType="submit">Salvar</button>
        </div>
      </form>
    </div>
  `
})
export class SampleFormComponent {
  model: any = { name: '', email: '' };

  submit() {
    console.log('Form submitted', this.model);
    alert('Dados salvos (exemplo)');
  }
}
