import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArquivoService {
  private readonly baseUrl = `${environment.apiUrl}/Arquivo/resultado`;

  constructor(
    private http: HttpClient,
    private message: NzMessageService
  ) {}

  /** URL pública na API (uso direto ou WhatsApp). */
  urlPublica(diretorioCompleto: number | string, nomeArquivo: string, tipo = ''): string {
    const params = new URLSearchParams({
      diretorioCompleto: String(diretorioCompleto),
      nomeArquivo
    });
    if (tipo) {
      params.set('tipo', tipo);
    }
    return `${this.baseUrl}?${params.toString()}`;
  }

  /** URL amigável no domínio da plataforma (contabilcontfy.com.br). */
  urlAmigavel(diretorioCompleto: number | string, nomeArquivo: string, tipo = ''): string {
    const base = environment.appUrl.replace(/\/$/, '');
    const params = new URLSearchParams({
      diretorioCompleto: String(diretorioCompleto),
      nomeArquivo
    });
    if (tipo) {
      params.set('tipo', tipo);
    }
    return `${base}/arquivo?${params.toString()}`;
  }

  abrir(diretorioCompleto: number | string, nomeArquivo: string, tipo = ''): void {
    if (!nomeArquivo?.trim()) {
      this.message.warning('Arquivo não encontrado.');
      return;
    }

    const downloadName = this.nomeDownload(nomeArquivo, tipo);

    this.http.get(this.urlPublica(diretorioCompleto, nomeArquivo, tipo), { responseType: 'blob' }).subscribe({
      next: (blob) => {
        if (!blob.size) {
          this.message.error('Arquivo não encontrado.');
          return;
        }
        this.dispararDownload(blob, downloadName);
      },
      error: () => this.message.error('Não foi possível baixar o arquivo.')
    });
  }

  private nomeDownload(nomeArquivo: string, tipo: string): string {
    const isCert = tipo.trim().toLowerCase() === 'certificado digital';
    if (isCert) return `${nomeArquivo}.pfx`;
    const label = tipo.trim();
    if (label) return `${this.sanitizarNome(label)}.pdf`;
    return `${nomeArquivo}.pdf`;
  }

  private sanitizarNome(nome: string): string {
    return nome.replace(/[\\/:*?"<>|]/g, '_');
  }

  private dispararDownload(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}
