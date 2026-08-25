import { Injectable } from '@angular/core';

/** Atualiza o favicon da aba com um indicador visual de notificações não lidas. */
@Injectable({ providedIn: 'root' })
export class FaviconBadgeService {
  private readonly iconSrc = '/logoIcon.png';
  private originalHref: string | null = null;
  private originalTitle: string | null = null;
  private iconImage: HTMLImageElement | null = null;

  setCount(count: number): void {
    if (count > 0) {
      this.applyBadge();
      this.applyTitle(count);
    } else {
      this.clear();
    }
  }

  clear(): void {
    const link = this.getFaviconLink(false);
    if (link && this.originalHref) {
      link.href = this.originalHref;
      link.type = 'image/x-icon';
    }
    if (this.originalTitle != null) {
      document.title = this.originalTitle;
    }
  }

  private getFaviconLink(create = true): HTMLLinkElement | null {
    let link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
    if (!link && create) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link && !this.originalHref) {
      this.originalHref = link.getAttribute('href') || this.iconSrc;
    }
    return link;
  }

  private applyTitle(count: number): void {
    if (this.originalTitle == null) {
      this.originalTitle = document.title.replace(/^\(\d+\+|99\+?\) /, '');
    }
    const prefix = `(${count > 99 ? '99+' : count}) `;
    document.title = prefix + this.originalTitle;
  }

  private applyBadge(): void {
    this.ensureIcon()
      .then(img => {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);

        ctx.fillStyle = '#ff4d4f';
        ctx.beginPath();
        ctx.arc(size - 7, 7, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const link = this.getFaviconLink();
        if (!link) return;
        link.type = 'image/png';
        link.href = canvas.toDataURL('image/png');
      })
      .catch(() => { /* favicon decorativo; falha silenciosa */ });
  }

  private ensureIcon(): Promise<HTMLImageElement> {
    if (this.iconImage) {
      return Promise.resolve(this.iconImage);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.iconImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error('Não foi possível carregar logoIcon.png'));
      img.src = this.iconSrc;
    });
  }
}
