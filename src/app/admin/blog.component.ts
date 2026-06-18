import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface BlogPost { id: number; titulo: string; mensagem: string; caminhoImagem?: string; data: string; }

@Component({
  selector: 'app-blog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzModalModule, NzMessageModule,
    NzFormModule, NzDividerModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Blog" subtitle="Publicações e comunicados para os clientes"></app-page-title>
      <div style="text-align:right;margin-bottom:12px">
        <button nz-button nzType="primary" (click)="abrirModal()"><i nz-icon nzType="plus"></i> Nova Publicação</button>
      </div>
      <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:6}"></nz-skeleton></ng-container>
      <div *ngIf="!loading" class="blog-grid">
        <nz-card *ngFor="let post of lista" class="blog-card">
          <div class="blog-img" *ngIf="post.caminhoImagem">
            <img [src]="post.caminhoImagem" alt="imagem" onerror="this.style.display='none'" />
          </div>
          <div class="blog-date"><i nz-icon nzType="calendar"></i> {{ post.data | date:'dd/MM/yyyy HH:mm' }}</div>
          <div class="blog-title">{{ post.titulo }}</div>
          <div class="blog-msg">{{ post.mensagem }}</div>
          <nz-divider></nz-divider>
          <button nz-button nzDanger nzSize="small" [nzLoading]="excluindo.has(post.id)" (click)="excluir(post)">
            <i nz-icon nzType="delete"></i> Excluir
          </button>
        </nz-card>
        <div *ngIf="lista.length===0" style="text-align:center;padding:48px;color:rgba(0,0,0,.45);grid-column:1/-1">
          <i nz-icon nzType="read" style="font-size:48px;margin-bottom:12px"></i><br>Nenhuma publicação encontrada.
        </div>
      </div>
    </div>

    <nz-modal [(nzVisible)]="modalVisible" nzTitle="Nova Publicação" [nzWidth]="560" [nzFooter]="ftModal" (nzOnCancel)="modalVisible=false">
      <ng-container *nzModalContent>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Título</nz-form-label>
          <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novoPost.titulo" placeholder="Título da publicação" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24" nzRequired>Mensagem</nz-form-label>
          <nz-form-control [nzSpan]="24"><textarea nz-input [(ngModel)]="novoPost.mensagem" [nzAutosize]="{minRows:4}" placeholder="Conteúdo do blog..."></textarea></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-label [nzSpan]="24">URL da Imagem (opcional)</nz-form-label>
          <nz-form-control [nzSpan]="24"><input nz-input [(ngModel)]="novoPost.caminhoImagem" placeholder="https://..." /></nz-form-control></nz-form-item>
      </ng-container>
      <ng-template #ftModal>
        <button nz-button (click)="modalVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvar()" [nzLoading]="salvando">Publicar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`.page{padding:8px 4px}.blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:4px}.blog-card{border-radius:10px}.blog-img img{width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:8px}.blog-date{color:rgba(0,0,0,.45);font-size:.8rem;margin-bottom:6px}.blog-title{font-weight:700;font-size:1rem;margin-bottom:8px}.blog-msg{color:rgba(0,0,0,.65);font-size:.9rem;white-space:pre-wrap}`]
})
export class BlogComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true; lista: BlogPost[] = []; salvando = false; modalVisible = false;
  excluindo = new Set<number>();
  novoPost = { titulo: '', mensagem: '', caminhoImagem: '' };
  private get h(): HttpHeaders { const t = localStorage.getItem('auth_token'); return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders(); }
  constructor(private http: HttpClient, private message: NzMessageService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    this.http.get<BlogPost[]>(`${this.api}/BlogContfy/linhas?linhas=10000`, { headers: this.h }).pipe(timeout(8000), catchError(() => of([]))).subscribe({
      next: (res) => { this.lista = Array.isArray(res) ? res.sort((a,b) => new Date(b.data).getTime()-new Date(a.data).getTime()) : []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
  abrirModal() { this.novoPost = { titulo: '', mensagem: '', caminhoImagem: '' }; this.modalVisible = true; this.cdr.markForCheck(); }
  salvar() {
    if (!this.novoPost.titulo.trim() || !this.novoPost.mensagem.trim()) { this.message.warning('Preencha título e mensagem.'); return; }
    this.salvando = true; this.cdr.markForCheck();
    const payload = { ...this.novoPost, data: new Date().toISOString() };
    this.http.post(`${this.api}/BlogContfy`, payload, { headers: this.h }).subscribe({
      next: () => { this.message.success('Publicado com sucesso!'); this.salvando = false; this.modalVisible = false; this.carregar(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.salvando = false; this.cdr.markForCheck(); }
    });
  }
  excluir(post: BlogPost) {
    this.excluindo.add(post.id); this.cdr.markForCheck();
    this.http.delete(`${this.api}/BlogContfy?Id=${post.id}`, { headers: this.h }).subscribe({
      next: () => { this.message.success('Excluído.'); this.lista = this.lista.filter(p => p.id !== post.id); this.excluindo.delete(post.id); this.cdr.markForCheck(); },
      error: (e) => { this.message.error(`Erro (${e.status})`); this.excluindo.delete(post.id); this.cdr.markForCheck(); }
    });
  }
}
