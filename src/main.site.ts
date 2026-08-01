import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { siteAppConfig } from './app/app.config.site';
import { AppComponent } from './app/app.component';
import { registerChunkLoadRecovery } from './app/utils/chunk-reload';

registerChunkLoadRecovery();

bootstrapApplication(AppComponent, siteAppConfig).catch((err) => console.error(err));
