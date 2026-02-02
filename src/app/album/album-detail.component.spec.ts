import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Album, Track } from '../model';
import { getTestAlbum } from '../model/testing';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { AlbumDetailComponent } from './album-detail.component';

describe('AlbumDetailsComponent', () => {
  let fixture: ComponentFixture<AlbumDetailComponent>;
  let component: AlbumDetailComponent;
  let activatedRoute: ActivatedRoute;
  let sidenavService: SidenavService;
  let titleService: TitleService;
  let testAlbum: Album;

  beforeEach(async () => {
    testAlbum = getTestAlbum();
    activatedRoute = { data: of({ album: testAlbum }) } as any;

    await TestBed.configureTestingModule({
      imports: [AlbumDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
        TitleService,
        SidenavService,
      ],
    }).compileComponents();

    sidenavService = TestBed.inject(SidenavService);
    titleService = TestBed.inject(TitleService);

    vi.spyOn(sidenavService, 'setEnabled');
    vi.spyOn(titleService, 'setTitle');

    fixture = TestBed.createComponent(AlbumDetailComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should get an album', async () => {
    const album = await firstValueFrom(component.album$);
    expect(album).toBe(testAlbum);
  });

  it('should show the sidenav', () => {
    expect(sidenavService.setEnabled).toHaveBeenCalledWith(true);
  });

  it("should set the album's Chinese title as the document title", () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(testAlbum.title.chinese.zht);
  });

  describe('header', () => {
    let albumDetailEl: HTMLElement;

    beforeEach(() => {
      albumDetailEl = fixture.nativeElement;
    });

    it('should display the Chinese title', () => {
      const el: HTMLElement = albumDetailEl.querySelector('.title-chinese');
      expect(el.textContent).toEqual(testAlbum.title.chinese.zht);
    });

    it('should display the pinyin translation', () => {
      const el: HTMLElement = albumDetailEl.querySelector('.trans-pinyin');
      expect(el.textContent).toEqual(testAlbum.title.chinese.zhp);
    });

    it('should display the English translation', () => {
      const el: HTMLElement = albumDetailEl.querySelector('.trans-english');
      expect(el.textContent).toEqual(testAlbum.title.chinese.eng);
    });

    it('should display the English title', () => {
      const el: HTMLElement = albumDetailEl.querySelector('.title-english');
      expect(el.textContent).toEqual(testAlbum.title.english);
    });

    it('should display the release date', () => {
      const pipe = new DatePipe('en-US');
      const expectedDate = pipe.transform(testAlbum.releaseDate, 'longDate');

      const el: HTMLElement = albumDetailEl.querySelector('.release-date');

      expect(el.textContent).toEqual(expectedDate);
    });
  });

  describe('tracks', () => {
    let albumDetailEl: HTMLElement;
    let songEl: HTMLElement;
    let testSong: Track;

    beforeEach(() => {
      testSong = testAlbum.songs['1'];
      albumDetailEl = fixture.nativeElement;
      songEl = albumDetailEl.querySelector('.track-item');
    });

    it("should display a track's number", () => {
      const el: HTMLElement = songEl.querySelector('.track-number');
      expect(el.textContent).toEqual('1');
    });

    it("should display a track's Chinese title", () => {
      const el: HTMLElement = songEl.querySelector('.track-chinese');
      expect(el.textContent).toEqual(testSong.title.chinese.zht);
    });

    it("should display a track's English title", () => {
      const el: HTMLElement = songEl.querySelector('.track-english');
      expect(el.textContent).toEqual(testSong.title.english);
    });

    it('should show if a track is disabled', () => {
      const el: HTMLElement = albumDetailEl.querySelector('.track-item.disabled');
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
