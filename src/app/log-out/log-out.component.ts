import { Component, OnInit } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-out',
  templateUrl: './log-out.component.html',
  styleUrls: ['./log-out.component.css'],
})
export class LogOutComponent implements OnInit {
  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    this.logOut();
  }

  logOut() {
    signOut(this.auth).then(() => this.router.navigate(['login']));
  }
}
