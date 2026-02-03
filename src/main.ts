import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { DataService } from './app/services/data.service';
import { EnvironmentService } from './app/services/environment.service';
import { FirestoreCache } from './app/services/firestore-cache.service';
import { FirestoreService } from './app/services/firestore.service';
import { SidenavService } from './app/services/sidenav.service';
import { TitleService } from './app/services/title.service';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    DataService,
    EnvironmentService,
    FirestoreCache,
    FirestoreService,
    SidenavService,
    TitleService,
  ],
}).catch(err => console.error(err));
