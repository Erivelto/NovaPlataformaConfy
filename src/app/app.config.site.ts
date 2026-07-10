import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { siteRoutes } from './app.routes.site';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { authInterceptor } from './services/auth.interceptor';
import {
  CheckOutline,
  DesktopOutline,
  FileOutline,
  PieChartOutline,
  CustomerServiceOutline,
  PhoneOutline,
  MailOutline,
  MessageOutline,
  UserOutline,
  AimOutline,
  InstagramOutline,
  WhatsAppOutline,
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

export const siteAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(siteRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(BrowserAnimationsModule),
    { provide: NZ_I18N, useValue: en_US },
    {
      provide: NZ_ICONS,
      useValue: [
        CheckOutline,
        DesktopOutline,
        FileOutline,
        PieChartOutline,
        CustomerServiceOutline,
        PhoneOutline,
        MailOutline,
        MessageOutline,
        UserOutline,
        AimOutline,
        InstagramOutline,
        WhatsAppOutline,
      ],
    },
  ],
};
