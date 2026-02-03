import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { FooterComponent } from './footer/footer.component';
import { SidenavService } from './services/sidenav.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    FooterComponent,
  ],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSidenav, { static: false }) sidenav: MatSidenav;

  analyticsEnabled: boolean;

  sidenavSub: Subscription;
  sidenavEnabled: boolean;

  mediaSub: Subscription;

  private router = inject(Router);
  private sidenavService = inject(SidenavService);
  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.analyticsEnabled = typeof (window as any).ga === 'function';
    this.sidenavEnabled = false;
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.analyticsEnabled) {
          (window as any).ga('set', 'page', event.urlAfterRedirects);
          (window as any).ga('send', 'pageview');
        }

        if (this.sidenav && this.sidenav.mode === 'over') {
          this.sidenav.close();
        }
      }
    });
  }

  ngAfterViewInit() {
    this.sidenavSub = this.sidenavService.enable$.subscribe(enabled => {
      this.sidenavEnabled = enabled;

      if (this.sidenav && this.sidenav.mode === 'side') {
        if (enabled) {
          this.sidenav.open();
        } else {
          this.sidenav.close();
        }
      } else {
        if (enabled) {
          // TODO: show menu button
        } else {
          // TODO: hide menu button
        }
      }
    });

    this.mediaSub = this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      if (!this.sidenav) return;

      if (result.matches) {
        this.sidenav.fixedTopGap = 56;
        this.sidenav.mode = 'over';
        this.sidenav.disableClose = false;
        this.sidenav.close();
      } else {
        this.sidenav.fixedTopGap = 64;
        this.sidenav.mode = 'side';
        this.sidenav.disableClose = true;
        if (this.sidenavService.enabled) {
          this.sidenav.open();
        }
      }
    });
  }

  ngOnDestroy() {
    this.sidenavSub.unsubscribe();
    if (this.mediaSub) {
      this.mediaSub.unsubscribe();
    }
  }
}
