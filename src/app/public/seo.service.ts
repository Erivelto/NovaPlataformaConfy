import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { getSeoForPath, PageSeo } from './site-seo.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = environment.siteUrl.replace(/\/$/, '');
  private readonly defaultImage = `${this.baseUrl}/Logo.png`;
  private readonly jsonLdId = 'contfy-seo-jsonld';

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  updateForPath(path: string): void {
    this.update(getSeoForPath(path, this.baseUrl));
  }

  update(seo: PageSeo): void {
    const pageTitle = seo.title.includes('Contfy') ? seo.title : `${seo.title} | Contfy`;
    const canonicalUrl = `${this.baseUrl}${seo.path}`;
    const image = this.resolveImage(seo.image);

    this.title.setTitle(pageTitle);
    this.upsertTag('name', 'description', seo.description);
    this.upsertTag('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');

    this.upsertLink('canonical', canonicalUrl);

    this.upsertTag('property', 'og:type', 'website');
    this.upsertTag('property', 'og:site_name', 'Contfy');
    this.upsertTag('property', 'og:title', pageTitle);
    this.upsertTag('property', 'og:description', seo.description);
    this.upsertTag('property', 'og:url', canonicalUrl);
    this.upsertTag('property', 'og:image', image);
    this.upsertTag('property', 'og:locale', 'pt_BR');

    this.upsertTag('name', 'twitter:card', 'summary_large_image');
    this.upsertTag('name', 'twitter:title', pageTitle);
    this.upsertTag('name', 'twitter:description', seo.description);
    this.upsertTag('name', 'twitter:image', image);

    if (seo.jsonLd) {
      this.setJsonLd(seo.jsonLd);
    } else {
      this.removeJsonLd();
    }
  }

  private resolveImage(image?: string): string {
    if (!image) return this.defaultImage;
    return image.startsWith('http') ? image : `${this.baseUrl}${image}`;
  }

  private upsertTag(attr: 'name' | 'property', selector: string, content: string): void {
    if (this.meta.getTag(`${attr}="${selector}"`)) {
      this.meta.updateTag({ [attr]: selector, content });
      return;
    }
    this.meta.addTag({ [attr]: selector, content });
  }

  private upsertLink(rel: string, href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.id = this.jsonLdId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    this.document.getElementById(this.jsonLdId)?.remove();
  }
}
