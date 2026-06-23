import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { authInterceptor } from './services/auth.interceptor';
import {
  HomeOutline,
  SettingOutline,
  BellOutline,
  LogoutOutline,
  MenuFoldOutline,
  UserOutline,
  LockOutline,
  EyeOutline,
  EyeInvisibleOutline,
  SafetyCertificateTwoTone,
  IdcardOutline,
  FileProtectOutline,
  FileAddOutline,
  FileTextOutline,
  BarChartOutline,
  CreditCardOutline,
  SolutionOutline,
  BankOutline,
  PhoneOutline,
  EditOutline,
  DollarOutline,
  AuditOutline,
  UnorderedListOutline,
  CalendarOutline,
  CrownFill,
  HistoryOutline,
  PieChartOutline,
  MessageOutline,
  ReadOutline,
  WarningOutline,
  ScheduleOutline,
  TeamOutline,
  ContactsOutline,
  DashboardOutline,
  PlusOutline,
  SaveOutline,
  DeleteOutline,
  InboxOutline,
  PaperClipOutline,
  ArrowLeftOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  ExclamationCircleOutline,
  InfoCircleOutline,
  LoadingOutline,
  ReloadOutline,
  SearchOutline,
  DownloadOutline,
  StarOutline,
  StarFill,
  FolderOutline,
  NumberOutline
} from '@ant-design/icons-angular/icons';
import { ClienteExcluidoOutline } from './icons/cliente-excluido.icon';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(BrowserAnimationsModule),
    { provide: NZ_I18N, useValue: en_US },
    { provide: NZ_ICONS, useValue: [
      HomeOutline, SettingOutline, BellOutline, LogoutOutline, MenuFoldOutline,
      UserOutline, LockOutline, EyeOutline, EyeInvisibleOutline, SafetyCertificateTwoTone,
      IdcardOutline, FileProtectOutline, FileAddOutline, FileTextOutline, BarChartOutline,
      CreditCardOutline, SolutionOutline, BankOutline, PhoneOutline, EditOutline,
      DollarOutline, AuditOutline, UnorderedListOutline, CalendarOutline, CrownFill,
      HistoryOutline, PieChartOutline, MessageOutline, ReadOutline, WarningOutline,
      ScheduleOutline, TeamOutline, ContactsOutline, DashboardOutline, PlusOutline,
      SaveOutline, DeleteOutline, InboxOutline, PaperClipOutline, ArrowLeftOutline,
      CheckCircleOutline, CloseCircleOutline, ExclamationCircleOutline, InfoCircleOutline,
      LoadingOutline, ReloadOutline, SearchOutline, DownloadOutline, StarOutline, StarFill,
      FolderOutline, NumberOutline, ClienteExcluidoOutline
    ] }
  ]
};
