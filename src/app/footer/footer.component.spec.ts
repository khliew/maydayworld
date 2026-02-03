import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { EnvironmentService } from '../services/environment.service';
import { FooterComponent } from './footer.component';

describe('FooterComponent ', () => {
  let component: FooterComponent;
  let environmentService: EnvironmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FooterComponent, EnvironmentService],
    });

    component = TestBed.inject(FooterComponent);
    environmentService = TestBed.inject(EnvironmentService);
  });

  it('should get the app version from environment', () => {
    expect(component.appVersion).toBe(environmentService.env.version);
  });
});

describe('FooterComponent (DOM)', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let environmentService: EnvironmentService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), EnvironmentService],
    }).compileComponents();

    environmentService = TestBed.inject(EnvironmentService);
    fixture = TestBed.createComponent(FooterComponent);

    await fixture.whenStable();
  });

  it('should display the app version', () => {
    const footerEl: HTMLElement = fixture.nativeElement;
    const el = footerEl.querySelector('.app-version');
    expect(el.textContent).toEqual(`v${environmentService.env.version}`);
  });

  it('should display the current year', () => {
    const footerEl: HTMLElement = fixture.nativeElement;
    const el = footerEl.querySelector('.copyright');
    expect(el.textContent).contains(`${new Date().getFullYear()}`);
  });

  it('should route "about us" link to the correct page', () => {
    const linkDe = fixture.debugElement.query(By.css('.about-us'));
    expect(linkDe.nativeElement.getAttribute('routerLink')).toEqual('/about');
  });

  it('should route "privacy policy" link to the correct page', () => {
    const linkDe = fixture.debugElement.query(By.css('.privacy'));
    expect(linkDe.nativeElement.getAttribute('routerLink')).toEqual('/privacy');
  });
});
