import { BreakpointObserver } from '@angular/cdk/layout';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { AboutUsComponent } from './about-us.component';

describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;
  let sidenavService: SidenavService;
  let titleService: TitleService;
  let setEnabledSpy: MockInstance<(enabled: boolean) => void>;
  let resetTitleSpy: MockInstance<() => void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        TitleService,
        SidenavService,
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of(),
          },
        },
      ],
    }).compileComponents();

    sidenavService = TestBed.inject(SidenavService);
    titleService = TestBed.inject(TitleService);

    setEnabledSpy = vi.spyOn(sidenavService, 'setEnabled');
    resetTitleSpy = vi.spyOn(titleService, 'resetTitle');

    fixture = TestBed.createComponent(AboutUsComponent);
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
