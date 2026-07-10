import { bootstrapApplication } from '@angular/platform-browser';
import { siteAppConfig } from './app/app.config.site';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, siteAppConfig).catch((err) => console.error(err));
