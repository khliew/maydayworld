import { Component, inject, OnInit } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-out',
  templateUrl: './log-out.component.html',
  styleUrls: ['./log-out.component.css'],
})
export class LogOutComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    this.logOut();
  }

  logOut() {
    signOut(this.auth).then(() => this.router.navigate(['login']));
  }
}
