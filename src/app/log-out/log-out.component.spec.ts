import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogOutComponent } from './log-out.component';

vi.mock('@angular/fire/auth', async () => {
  const actual = await vi.importActual<typeof import('@angular/fire/auth')>('@angular/fire/auth');
  return {
    ...actual,
    signOut: vi.fn().mockResolvedValue({}),
  };
});

describe('LogOutComponent', () => {
  let component: LogOutComponent;
  let fixture: ComponentFixture<LogOutComponent>;
  let routerSpy: { navigate: any };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LogOutComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogOutComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
