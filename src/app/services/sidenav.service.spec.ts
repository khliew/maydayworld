import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SidenavService } from './sidenav.service';

describe('SidenavService', () => {
  let service: SidenavService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), SidenavService],
    }).compileComponents();

    service = TestBed.inject(SidenavService);
  });

  it('#setEnabled should set enabled value', () => {
    service.setEnabled(true);
    expect(service.enabled).toBe(true);
  });

  it('enable$ should emit value from #setEnabled', () =>
    new Promise<void>(done => {
      service.enable$.subscribe(value => {
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.setEnabled(true);
    }));
});
