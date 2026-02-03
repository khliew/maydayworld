import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;
  let setEnabledSpy: MockInstance<(enabled: boolean) => void>;
  let resetTitleSpy: MockInstance<() => void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        TitleService,
        SidenavService,
      ],
    }).compileComponents();

    const sidenavService = TestBed.inject(SidenavService);
    const titleService = TestBed.inject(TitleService);

    setEnabledSpy = vi.spyOn(sidenavService, 'setEnabled');
    resetTitleSpy = vi.spyOn(titleService, 'resetTitle');

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should hide the sidenav', () => {
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
  });

  it('should reset the document title', () => {
    expect(resetTitleSpy).toHaveBeenCalled();
  });
});
