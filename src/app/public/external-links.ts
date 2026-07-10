import { environment } from '../../environments/environment';

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export const siteHomeUrl = `${trimSlash(environment.siteUrl)}/`;
export const appLoginUrl = `${trimSlash(environment.appUrl)}/entrar`;
