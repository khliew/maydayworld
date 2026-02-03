import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class SidenavService {
  private enableSideNav: BehaviorSubject<boolean>;

  enable$: Observable<boolean>;
  enabled: boolean;

  constructor() {
    this.enableSideNav = new BehaviorSubject<boolean>(false);
    this.enable$ = this.enableSideNav as Observable<boolean>;
    this.enabled = false;
  }

  public setEnabled(enabled: boolean) {
    this.enableSideNav.next(enabled);
    this.enabled = enabled;
  }
}
