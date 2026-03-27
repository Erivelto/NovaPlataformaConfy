import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, NzButtonModule, NzIconModule, NzAvatarModule, NzToolTipModule],
  template: `
    <nz-header class="app-header">
      <div class="brand">
        <button *ngIf="isMobile" nz-button nzType="text" class="hamburger" aria-label="menu" (click)="toggleMenu.emit()">
          <i nz-icon nzType="menu-fold"></i>
        </button>
        <img src="/Logo.png" alt="logo" class="logo" />
      </div>
      <div class="actions">
        <button nz-button nzType="text" aria-label="notifications"><i nz-icon nzType="bell"></i></button>
        <div class="user-chip" nz-tooltip [nzTooltipTitle]="userEmail">
          <nz-avatar [nzText]="userInitials" nzSize="small" class="user-avatar"></nz-avatar>
          <span class="user-name-header">{{ userName }}</span>
        </div>
        <button nz-button nzType="text" class="logout-corner" aria-label="logout" (click)="logout()">
          <i nz-icon nzType="logout"></i>
        </button>
      </div>
    </nz-header>
  `,
  styles: [
    `.app-header{display:flex;align-items:center;padding:0 20px;background:linear-gradient(90deg,var(--primary-color),var(--primary-light));color:#fff;position:sticky;top:0;z-index:100}`,
    `.app-header .brand{display:flex;align-items:center;gap:12px}`,
    `.app-header .logo{height:52px;width:52px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3)}`,
    `.app-header .title{font-weight:700;font-size:1.125rem;color:rgba(255,255,255,0.98)}`,
    `.app-header .actions{margin-left:auto;display:flex;gap:12px;align-items:center;z-index:2}`,
    `.app-header .ant-btn{color:rgba(255,255,255,0.95);border-color:transparent}`,
    `.app-header .ant-btn-default{background:transparent;color:rgba(255,255,255,0.95);border:none;border-radius:var(--btn-radius);padding:6px 10px}`,
    `.app-header .ant-btn-default:hover{background:rgba(255,255,255,0.06)}`,
    `.hamburger{font-size:22px!important;padding:4px 8px!important;color:#fff!important}`,
    `.hamburger .anticon{font-size:22px;color:#fff}`,
    `.logout-corner{border-radius:50%;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:2px solid rgba(255,255,255,0.12);color:#fff;box-shadow:0 6px 18px rgba(10,102,194,0.12);pointer-events:auto;cursor:pointer;transition:transform .12s ease;margin-left:10px}`,
    `.logout-corner:hover{transform:scale(1.06)} .logout-corner i{color:#fff;font-size:18px}`,
    `.app-header .ant-btn, .ant-btn.ant-btn-default{pointer-events:auto}`,
    `.app-header .anticon{color:rgba(255,255,255,0.95)}`,
    `.user-chip{display:flex;align-items:center;gap:8px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.12);cursor:default}`,
    `.user-avatar{background:rgba(255,255,255,0.3);color:#fff;font-weight:700}`,
    `.user-name-header{color:#fff;font-weight:600;font-size:0.9rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`,
    `@media(max-width:768px){.app-header{padding:0 10px;height:56px;line-height:56px}.app-header .logo{height:36px;width:36px}.user-name-header{display:none}.user-chip{padding:4px 8px}.logout-corner{width:36px;height:36px;margin-left:6px}.actions{gap:6px!important}}`
  ]
})
export class HeaderComponent implements OnInit {
  @Input() isMobile = false;
  @Output() toggleMenu = new EventEmitter<void>();

  userName = '';
  userEmail = '';
  userInitials = 'U';

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    if (usuario) {
      this.userName = usuario.email ? usuario.email.split('@')[0] : usuario.nome;
      this.userEmail = usuario.email;
      this.userInitials = this.userName
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() ?? '')
        .join('');
    }
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
