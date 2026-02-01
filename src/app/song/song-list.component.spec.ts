import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { RouterLinkDirectiveStub } from 'src/testing';
import { Album, Track } from '../model';
import { getTestAlbum } from '../model/testing/test-album';
import { SharedModule } from '../shared/shared.module';
import { SongListComponent } from './song-list.component';

describe('SongListComponent', () => {
  let fixture: ComponentFixture<SongListComponent>;
  let comp: SongListComponent;
  let activatedRoute: ActivatedRoute;
  let testAlbum: Album;

  beforeEach(async(() => {
    testAlbum = getTestAlbum();
    activatedRoute = { data: of({ album: testAlbum }), snapshot: {} } as any;

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule, SongListComponent, RouterLinkDirectiveStub],
      providers: [{ provide: ActivatedRoute, useValue: activatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(SongListComponent);
    comp = fixture.componentInstance;

    fixture.detectChanges(); // ngOnInit()
  }));

  it('should get an album', () => {
    expect(comp.album).toBe(testAlbum);
  });

  it('should have the correct go-up route', () => {
    const linkDe = fixture.debugElement.query(By.css('.go-up'));
    const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

    expect(routerLink.linkParams).toEqual(['../../../']);
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
      const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

      expect(routerLink.linkParams).toEqual(['/album', testAlbum.id, 'song', testSong.id]);
    });
  });
});
