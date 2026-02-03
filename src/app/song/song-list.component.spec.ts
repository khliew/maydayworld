import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Album, Track } from '../model';
import { getTestAlbum } from '../model/testing/test-album';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { SongListComponent } from './song-list.component';

describe('SongListComponent', () => {
  let fixture: ComponentFixture<SongListComponent>;
  let comp: SongListComponent;
  let activatedRoute: ActivatedRoute;
  let testAlbum: Album;
  let sidenavService: SidenavService;
  let titleService: TitleService;

  beforeEach(async () => {
    testAlbum = getTestAlbum();
    activatedRoute = { data: of({ album: testAlbum }), snapshot: {} } as any;

    await TestBed.configureTestingModule({
      imports: [SongListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        SidenavService,
        TitleService,
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    sidenavService = TestBed.inject(SidenavService);
    titleService = TestBed.inject(TitleService);
    vi.spyOn(sidenavService, 'setEnabled');
    vi.spyOn(titleService, 'resetTitle');

    fixture = TestBed.createComponent(SongListComponent);
    comp = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should get an album', () => {
    comp.album$.subscribe(album => {
      expect(album).toBe(testAlbum);
    });
  });

  it('should have the correct go-up route', () => {
    const linkDe = fixture.debugElement.query(By.css('.go-up'));
    expect(linkDe.nativeElement.getAttribute('href')).toEqual('/');
  });

  describe('header', () => {
    let songListEl: HTMLElement;

    beforeEach(() => {
      songListEl = fixture.nativeElement;
    });

    it('should display the Chinese title', () => {
      const el: HTMLElement = songListEl.querySelector('.title-chinese');
      expect(el.textContent).toEqual(testAlbum.title.chinese.zht);
    });

    it('should display the pinyin translation', () => {
      const el: HTMLElement = songListEl.querySelector('.trans-pinyin');
      expect(el.textContent).toEqual(testAlbum.title.chinese.zhp);
    });

    it('should display the English translation', () => {
      const el: HTMLElement = songListEl.querySelector('.trans-english');
      expect(el.textContent).toEqual(testAlbum.title.chinese.eng);
    });

    it('should display the English title', () => {
      const el: HTMLElement = songListEl.querySelector('.title-english');
      expect(el.textContent).toEqual(testAlbum.title.english);
    });
  });

  describe('tracks', () => {
    let songListEl: HTMLElement;
    let songEl: HTMLElement;
    let testSong: Track;

    beforeEach(() => {
      testSong = testAlbum.songs['1'];
      songListEl = fixture.nativeElement;
      songEl = songListEl.querySelector('.track-item');
    });

    it('should display the first track', () => {
      expect(songEl).not.toBeNull();
    });

    it('should display the track number and Chinese title', () => {
      const expectedText = `1. ${testSong.title.chinese.zht}`;
      expect(songEl.textContent).toEqual(expectedText);
    });

    it('should show if a track is disabled', () => {
      const el: HTMLElement = songListEl.querySelector('.track-item.disabled');
      expect(el).not.toBeNull();
    });

    it('should route to the correct link', () => {
      const linkDe = fixture.debugElement.query(By.css('.track-item'));
      expect(linkDe.nativeElement.getAttribute('href')).toEqual(
        `/album/${testAlbum.id}/song/${testSong.id}`,
      );
    });
  });
});
