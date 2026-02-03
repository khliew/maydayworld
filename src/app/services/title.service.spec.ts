import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TITLE_DEFAULT, TitleService } from './title.service';

describe('TitleService', () => {
  let service: TitleService;
  let titleSpy: any;

  beforeEach(async () => {
    titleSpy = { setTitle: vi.fn() };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TitleService,
        { provide: Title, useValue: titleSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(TitleService);
  });

  it('#setTitle sets the document title', () => {
    const testValue = 'test value';
    service.setTitle(testValue);

    expect(titleSpy.setTitle).toHaveBeenCalledWith(`${testValue} - ${TITLE_DEFAULT}`);
  });

  it('#resetTitle resets the document title', () => {
    service.resetTitle();

    expect(titleSpy.setTitle).toHaveBeenCalledWith(TITLE_DEFAULT);
  });
});
