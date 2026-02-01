import { DatePipe } from '@angular/common';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { asyncData, RouterLinkDirectiveStub } from '../../testing';
import { AlbumMetadata, Discography } from '../model';
import { getTestDiscography } from '../model/testing/test-discography';
import { DataService } from '../services/data.service';
import { AlbumsComponent } from './albums.component';

describe('AlbumsComponent', () => {
  let fixture: ComponentFixture<AlbumsComponent>;
  let comp: AlbumsComponent;
  let testDiscography: Discography;

  beforeEach(async(() => {
    testDiscography = getTestDiscography();
    const dataService = jasmine.createSpyObj('DataService', ['getDiscography']);
    dataService.getDiscography.and.returnValue(asyncData(testDiscography));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AlbumsComponent, RouterLinkDirectiveStub],
      providers: [{ provide: DataService, useValue: dataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumsComponent);
    comp = fixture.componentInstance;

    fixture.detectChanges(); // ngOnInit()
  }));

  it('should get a discography', () => {
    expect(comp.discography).toBe(testDiscography);
  });

  it('should display discography sections that have at least one album', fakeAsync(() => {
    tick();
    fixture.detectChanges(); // update with getDiscography()

    const albumsEl: HTMLElement = fixture.nativeElement;
    const els = albumsEl.querySelectorAll('.section');

    expect(els.length).toBe(1);
  }));

  describe('Album', () => {
    let testAlbum: AlbumMetadata;
    let albumEl;

    beforeEach(fakeAsync(() => {
      testAlbum = testDiscography.sections[0].albums[0];

      tick();
      fixture.detectChanges(); // update with getDiscography()

      const albumsEl: HTMLElement = fixture.nativeElement;
      albumEl = albumsEl.querySelector('.album-card');
    }));

    it('should display the Chinese title', () => {
      const chineseEl: HTMLElement = albumEl.querySelector('.title-chinese');
      expect(chineseEl.textContent).toEqual(testAlbum.title.chinese.zht);
    });

    it('should display the English title', () => {
      const englishEl: HTMLElement = albumEl.querySelector('.title-english');
      expect(englishEl.textContent).toEqual(testAlbum.title.english);
    });

    it('should display the release date', () => {
      const pipe = new DatePipe('en-US');
      const expectedDate = pipe.transform(testAlbum.releaseDate);

      const dateEl: HTMLElement = albumEl.querySelector('.release-date');

      expect(dateEl.textContent).toEqual(expectedDate);
    });

    it('should route to the correct link', () => {
      const linkDe = fixture.debugElement.query(By.directive(RouterLinkDirectiveStub));
      const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

      expect(routerLink.linkParams).toEqual(['/album', testAlbum.id]);
    });
  });
});
