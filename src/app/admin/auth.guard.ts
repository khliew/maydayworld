import { inject, Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { CanMatch, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanMatch {
  private auth = inject(Auth);
  private router = inject(Router);

  canMatch() {
    return this.checkAuth();
  }

  checkAuth() {
    return new Promise<boolean>((resolve, reject) => {
      authState(this.auth).subscribe(user => {
        if (!!user) {
          resolve(true);
        } else {
          this.router.navigateByUrl('/login');
          resolve(false);
        }
      });
    });
  }
}
