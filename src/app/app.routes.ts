import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { Routes } from '@angular/router';
import { AboutUsComponent } from './about-us/about-us.component';
import { AuthGuard } from './admin/auth.guard';
import { HomeComponent } from './home/home.component';
import { LogInComponent } from './log-in/log-in.component';
import { LogOutComponent } from './log-out/log-out.component';
import { PrivacyComponent } from './privacy/privacy.component';

export const APP_ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutUsComponent },
  { path: 'privacy', component: PrivacyComponent },
  {
    path: 'login',
    component: LogInComponent,
    ...canActivate(() => redirectLoggedInTo(['admin'])),
  },
  { path: 'logout', component: LogOutComponent },
  {
    path: 'album',
    loadChildren: () => import('./album/album.routes').then(m => m.ALBUM_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canMatch: [AuthGuard],
    ...canActivate(() => redirectUnauthorizedTo(['login'])),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
