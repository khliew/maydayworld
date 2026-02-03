import { Component, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput } from '@angular/material/input';
import { Router } from '@angular/router';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css'],
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatButton],
})
export class LogInComponent {
  private static readonly TIMEOUT_INCREMENT = 1000; // ms

  private titleService = inject(TitleService);
  private fb = inject(FormBuilder);
  private sidenavService = inject(SidenavService);
  private router = inject(Router);
  private auth = inject(Auth);

  credentials = this.fb.group({
    email: [''],
    password: [''],
  });

  failCount: number;
  timeout: number;

  constructor() {
    this.failCount = 0;
    this.timeout = 0;

    this.sidenavService.setEnabled(false);
    this.titleService.resetTitle();
  }

  logIn() {
    this.credentials.disable();

    signInWithEmailAndPassword(
      this.auth,
      this.credentials.get('email').value,
      this.credentials.get('password').value,
    )
      .then(data => {
        this.router.navigate(['admin']);
      })
      .catch(error => {
        this.failCount++;
        this.timeout = this.failCount * LogInComponent.TIMEOUT_INCREMENT;

        setTimeout(() => {
          this.credentials.enable();
        }, this.timeout);
      });
  }
}
