import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { RouterLinkDirectiveStub } from 'src/testing';
import { Song } from '../model';
import { getTestSong, SidenavServiceStub, TitleServiceStub } from '../model/testing';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { SharedModule } from '../shared/shared.module';
import { SongDetailComponent } from './song-detail.component';

describe('SongDetailComponent', () => {
  let fixture: ComponentFixture<SongDetailComponent>;
  let comp: SongDetailComponent;
  let activatedRoute: ActivatedRoute;
  let sidenavService: SidenavService;
  let titleService: TitleService;
  let testSong: Song;

  beforeEach(async(() => {
    testSong = getTestSong();
    activatedRoute = { data: of({ song: testSong }) } as any;

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule, SongDetailComponent, RouterLinkDirectiveStub],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: SidenavService, useClass: SidenavServiceStub },
        { provide: TitleService, useClass: TitleServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SongDetailComponent);
    comp = fixture.componentInstance;

    const injector = fixture.debugElement.injector;
    sidenavService = injector.get(SidenavService);
    titleService = injector.get(TitleService);

    fixture.detectChanges(); // ngOnInit()
  }));

  it('should get a song', () => {
    expect(comp.song).toBe(testSong);
  });

  it('should show the sidenav', () => {
    expect(sidenavService.setEnabled).toHaveBeenCalledWith(true);
  });

  it("should set the song's Chinese title as the document title", () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(testSong.title.chinese.zht);
  });

  describe('header', () => {
    let songDetailEl: HTMLElement;

    beforeEach(() => {
      songDetailEl = fixture.nativeElement;
    });

    it('should display the Chinese title', () => {
      const el: HTMLElement = songDetailEl.querySelector('.title-chinese');
      expect(el.textContent).toEqual(testSong.title.chinese.zht);
    });

    it('should display the pinyin translation', () => {
      const el: HTMLElement = songDetailEl.querySelector('.trans-pinyin');
      expect(el.textContent).toEqual(testSong.title.chinese.zhp);
    });

    it('should display the English translation', () => {
      const el: HTMLElement = songDetailEl.querySelector('.trans-english');
      expect(el.textContent).toEqual(testSong.title.chinese.eng);
    });

    it('should display the English title', () => {
      const el: HTMLElement = songDetailEl.querySelector('.title-english');
      expect(el.textContent).toEqual(testSong.title.english);
    });

    it('should display the lyricist', () => {
      const expectedText = `Lyricist: ${testSong.lyricist}`;
      const el: HTMLElement = songDetailEl.querySelector('.lyricist');
      expect(el.textContent).toEqual(expectedText);
    });

    it('should display the composer', () => {
      const expectedText = `Composer: ${testSong.composer}`;
      const el: HTMLElement = songDetailEl.querySelector('.composer');
      expect(el.textContent).toEqual(expectedText);
    });

    it('should display the arranger', () => {
      const expectedText = `Arrangement by: ${testSong.arranger}`;
      const el: HTMLElement = songDetailEl.querySelector('.arranger');
      expect(el.textContent).toEqual(expectedText);
    });
  });

  describe('lines', () => {
    let lineEls: HTMLElement[];

    beforeEach(() => {
      const songDetailEl = fixture.nativeElement;
      lineEls = songDetailEl.querySelectorAll('.line');
    });

    it('should display a lyric line', () => {
      const line = testSong.lyrics[0];
      const lineEl = lineEls[0];

      const expectedChinese = line.zht;
      const expectedPinyin = line.zhp;
      const expectedEnglish = line.eng;

      expect(lineEl.querySelector('.lyrics-chinese').textContent).toEqual(
        expectedChinese,
        'should be Chinese lyrics line',
      );
      expect(lineEl.querySelector('.lyrics-pinyin').textContent).toEqual(
        expectedPinyin,
        'should be a pinyin line',
      );
      expect(lineEl.querySelector('.lyrics-english').textContent).toEqual(
        expectedEnglish,
        'should be an English translation line',
      );
    });

    it('should display a text line', () => {
      const line = testSong.lyrics[1];
      const lineEl = lineEls[1];

      const expectedText = line.text;

      expect(lineEl.textContent).toEqual(expectedText);
    });

    it('should display a break', () => {
      const lineEl = lineEls[2];
      expect(lineEl.firstChild.nodeName).toEqual('BR');
    });
  });
});
