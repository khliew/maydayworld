import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { DataService } from '../services/data.service';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { LogInComponent } from './log-in.component';

vi.mock('@angular/fire/auth', async () => {
  const actual = await vi.importActual<typeof import('@angular/fire/auth')>('@angular/fire/auth');
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  };
});

describe('LogInComponent', () => {
  let component: LogInComponent;
  let fixture: ComponentFixture<LogInComponent>;
  let setEnabledSpy: MockInstance<(enabled: boolean) => void>;
  let resetTitleSpy: MockInstance<() => void>;
  let routerSpy: { navigate: any };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LogInComponent],
      providers: [
        provideZonelessChangeDetection(),
        SidenavService,
        TitleService,
        { provide: Auth, useValue: {} },
        { provide: DataService, useValue: {} },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const sidenavService = TestBed.inject(SidenavService);
    const titleService = TestBed.inject(TitleService);

    setEnabledSpy = vi.spyOn(sidenavService, 'setEnabled');
    resetTitleSpy = vi.spyOn(titleService, 'resetTitle');

    fixture = TestBed.createComponent(LogInComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should hide the sidenav', () => {
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
  });

  it('should reset the document title', () => {
    expect(resetTitleSpy).toHaveBeenCalled();
  });

  it('should have a fail count of zero', () => {
    expect(component.failCount).toBe(0);
  });

  describe('logging in successful', () => {
    let email;
    let password;

    beforeEach(async () => {
      email = 'email';
      const emailEl = fixture.nativeElement.querySelector('.email') as HTMLInputElement;
      emailEl.value = email;
      emailEl.dispatchEvent(new Event('input')); // notify Angular

      password = 'password';
      const passwordEl = fixture.nativeElement.querySelector('.password') as HTMLInputElement;
      passwordEl.value = password;
      passwordEl.dispatchEvent(new Event('input')); // notify Angular

      const logIn = fixture.nativeElement.querySelector('.log-in');
      await logIn.click();
    });

    it('should sign in with user provided email and password', () => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), email, password);
    });

    it('should navigate to admin', () => {
      expect(routerSpy.navigate).toHaveBeenCalledWith(['admin']);
    });
  });

  describe('logging in failed', () => {
    beforeEach(async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(new Error('Auth failed'));

      const logIn = fixture.nativeElement.querySelector('.log-in');
      logIn.click();
      await fixture.whenStable();
    });

    it('should increase fail count', () => {
      expect(component.failCount).toBe(1);
    });

    it('should increase timeout', () => {
      expect(component.timeout).toBe(1000);
    });
  });
});
