import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, RouterModule, RouterOutlet],
  template: `
    <nz-content class="app-content">
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </nz-content>
  `,
  styles: [
    `.app-content{padding:12px}`,
    `.main-content{padding:0}`,
    `@media(max-width:768px){.app-content{padding:8px}}`
  ]
})
export class MainComponent {}
