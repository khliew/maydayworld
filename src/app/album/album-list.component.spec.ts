import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { asyncData, RouterLinkDirectiveStub } from 'src/testing';
import { AlbumMetadata, Discography } from '../model';
import { getTestDiscography } from '../model/testing';
import { DataService } from '../services/data.service';
import { SharedModule } from '../shared/shared.module';
import { AlbumListComponent } from './album-list.component';

describe('AlbumListComponent', () => {
  let fixture: ComponentFixture<AlbumListComponent>;
  let comp: AlbumListComponent;
  let testDiscography: Discography;

  beforeEach(async(() => {
    testDiscography = getTestDiscography();
    const dataService = jasmine.createSpyObj('DataService', ['getDiscography']);
    dataService.getDiscography.and.returnValue(asyncData(testDiscography));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule, AlbumListComponent, RouterLinkDirectiveStub],
      providers: [{ provide: DataService, useValue: dataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumListComponent);
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
    const els = albumsEl.querySelectorAll('.section-header');

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
      albumEl = albumsEl.querySelector('.list-item');
    }));

    it('should display the Chinese title', () => {
      const chineseEl: HTMLElement = albumEl.querySelector('.title-chinese');
      expect(chineseEl.textContent).toEqual(testAlbum.title.chinese.zht);
    });

    it('should display the English title', () => {
      const englishEl: HTMLElement = albumEl.querySelector('.title-english');
      expect(englishEl.textContent).toEqual(testAlbum.title.english);
    });

    it('should route to the correct link', () => {
      const linkDe = fixture.debugElement.query(By.css('.list-item'));
      const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

      expect(routerLink.linkParams).toEqual(['/album', testAlbum.id]);
    });
  });
});
