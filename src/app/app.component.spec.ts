import { BreakpointObserver } from '@angular/cdk/layout';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';
import { EnvironmentService } from './services/environment.service';
import { SidenavService } from './services/sidenav.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        EnvironmentService,
        SidenavService,
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
