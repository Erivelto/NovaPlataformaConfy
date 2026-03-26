import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, RouterModule, RouterOutlet],
  template: `
    <nz-content style="padding:16px">
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </nz-content>
  `,
  styles: [`.main-content{padding:1rem}`]
})
export class MainComponent {}
