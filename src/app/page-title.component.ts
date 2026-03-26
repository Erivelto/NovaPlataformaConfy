import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule, NzButtonModule],
  template: `
    <div class="page-title">
      <div class="page-title-left">
        <div class="page-title-crest"></div>
        <div>
          <h1 class="page-title-heading">{{ title }}</h1>
          <div *ngIf="subtitle" class="page-title-sub">{{ subtitle }}</div>
        </div>
      </div>
      <div class="page-title-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `:host{display:block}`,
    `.page-title{display:flex;align-items:center;justify-content:space-between;padding:12px 0 18px;border-bottom:1px solid rgba(0,0,0,0.04)}`,
    `.page-title-left{display:flex;align-items:center;gap:12px}`,
    `.page-title-crest{width:6px;height:40px;border-radius:4px;background:linear-gradient(180deg,var(--primary-color),var(--primary-light))}`,
    `.page-title-heading{margin:0;font-size:1.25rem;color:var(--primary-color);font-weight:600}`,
    `.page-title-sub{color:rgba(0,0,0,0.54);font-size:0.875rem;margin-top:4px}`,
    `.page-title-actions{display:flex;gap:8px;align-items:center}`,
    `@media (max-width:720px){ .page-title{padding:8px 0 12px} .page-title-heading{font-size:1rem} .page-title-sub{font-size:0.75rem} .page-title-crest{height:28px;width:4px} .page-title-actions{gap:6px} }`
  ]
})
export class PageTitleComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
