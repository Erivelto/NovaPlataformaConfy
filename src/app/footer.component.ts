import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, NzLayoutModule],
  template: `
    <nz-footer class="app-footer">
      <div>© 2026 - Contfy</div>
    </nz-footer>
  `,
  styles: [`.app-footer{padding:0.75rem;text-align:center;border-top:1px solid #e6e6e6}`]
})
export class FooterComponent {}
