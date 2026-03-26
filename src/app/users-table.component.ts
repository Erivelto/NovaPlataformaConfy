import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { UsersService } from './users.service';
import { Router } from '@angular/router';
import { PageTitleComponent } from './page-title.component';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzTagModule, NzInputModule, NzIconModule, NzPaginationModule, PageTitleComponent],
  template: `
    <div class="users-page" style="padding:16px">
      <app-page-title title="Usuários" subtitle="Lista de usuários">
        <nz-input-group nzSuffixIcon="search">
          <input nz-input placeholder="Pesquisar por nome ou email" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
        </nz-input-group>
        <button nz-button nzType="primary" (click)="newUser()">Novo</button>
      </app-page-title>

      <nz-table nzBordered nzSize="middle" [nzData]="displayData">
        <thead>
          <tr>
            <th nzShowSort (nzSortChange)="sort('id', $event)">ID</th>
            <th nzShowSort (nzSortChange)="sort('name', $event)">Nome</th>
            <th nzShowSort (nzSortChange)="sort('email', $event)">Email</th>
            <th>Função</th>
            <th>Ativo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of displayData">
            <td>{{item.id}}</td>
            <td>{{item.name}}</td>
            <td>{{item.email}}</td>
            <td>{{item.role}}</td>
            <td>
              <nz-tag [nzColor]="item.active ? 'success' : 'default'">{{ item.active ? 'Sim' : 'Não' }}</nz-tag>
            </td>
            <td class="actions-cell">
              <button nz-button nzType="default" nzSize="small" (click)="view(item)">Ver</button>
              <button nz-button nzType="primary" nzSize="small" (click)="edit(item)">Editar</button>
            </td>
          </tr>
        </tbody>
      </nz-table>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <div>Exibindo {{displayData.length}} de {{filteredData.length}} registros</div>
          <nz-pagination
            [nzPageIndex]="pageIndex"
            [nzTotal]="filteredData.length"
            [nzPageSize]="pageSize"
            [nzPageSizeOptions]="pageSizeOptions"
            [nzShowSizeChanger]="true"
            (nzPageIndexChange)="onPageIndexChange($event)"
            (nzPageSizeChange)="onPageSizeChange($event)">
          </nz-pagination>
        </div>
    </div>
  `,
  styles: [
    `.users-page .actions-cell button{margin-right:8px}`,
    `@media (max-width: 720px){ .users-page table, .users-page thead, .users-page tbody, .users-page th, .users-page td, .users-page tr { display:block } .users-page thead{display:none} .users-page tr{margin-bottom:12px} .users-page td{padding:8px 0} }`,
    `/* Hide any internal table pagination so only our external pagination is visible */`,
    `::ng-deep .users-page .ant-table-pagination { display: none !important; }`,
    `::ng-deep .users-page .ant-pagination.ant-table-pagination { display: none !important; }`
  ]
})
export class UsersTableComponent implements OnInit {
  listOfData: User[] = [];
  filteredData: User[] = [];
  displayData: User[] = [];
  searchTerm = '';
  sortKey: string | null = null;
  sortValue: any = null;
  pageIndex = 1;
  pageSize = 10;
  pageSizeOptions = [6, 10, 20, 50];

  constructor(private usersService: UsersService, private router: Router) {}

  ngOnInit(): void {
    this.listOfData = this.usersService.getUsers();
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredData = this.listOfData.filter(u => {
      return !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });
    this.applySort();
    this.pageIndex = 1;
    this.updateDisplayData();
  }

  sort(key: string, value: any) {
    this.sortKey = key;
    this.sortValue = value;
    this.applySort();
  }

  applySort() {
    if (!this.sortKey || !this.sortValue) return;
    const key = this.sortKey as keyof User;
    const dir = this.sortValue === 'ascend' ? 1 : -1;
    this.displayData = [...this.displayData].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  updateDisplayData() {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayData = this.filteredData.slice(start, start + this.pageSize);
  }

  onPageIndexChange(idx: number) {
    this.pageIndex = idx;
    this.updateDisplayData();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.updateDisplayData();
  }

  view(u: User) { alert(`Visualizar: ${u.name}`); }
  edit(u: User) { alert(`Editar: ${u.name}`); }

  newUser() {
    // navega para o formulário de criação/edição
    this.router.navigate(['/form']);
  }
}
