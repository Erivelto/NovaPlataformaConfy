import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ClientsService, Client } from '../services/clients.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule, NzPopconfirmModule, NzCardModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  newClient: Client = { name: '', email: '', phone: '' };
  loading = false;

  constructor(private clientsService: ClientsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.clientsService.list().subscribe({
      next: res => { this.clients = res || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  create(): void {
    if (!this.newClient.name) return;
    this.clientsService.create(this.newClient).subscribe({
      next: () => { this.newClient = { name: '', email: '', phone: '' }; this.load(); }
    });
  }

  deleteClient(id?: number): void {
    if (!id) return;
    this.clientsService.delete(id).subscribe({ next: () => this.load() });
  }
}
