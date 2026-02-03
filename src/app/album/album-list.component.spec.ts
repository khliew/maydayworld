import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { Album, AlbumMetadata, Discography } from '../model';
import { getTestAlbum, getTestDiscography } from '../model/testing';
import { DataService } from '../services/data.service';
import { AlbumListComponent } from './album-list.component';

describe('AlbumListComponent', () => {
  let fixture: ComponentFixture<AlbumListComponent>;
  let component: AlbumListComponent;
  let testDiscography: Discography;
  let testAlbum: Album;

  beforeEach(async () => {
    testDiscography = getTestDiscography();
    testAlbum = getTestAlbum();

    await TestBed.configureTestingModule({
      imports: [AlbumListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: DataService, useValue: { getDiscography: vi.fn() } },
      ],
    }).compileComponents();

    const dataServiceSpy = TestBed.inject(DataService) as Mocked<DataService>;
    dataServiceSpy.getDiscography.mockReturnValue(of(testDiscography));

    fixture = TestBed.createComponent(AlbumListComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should get a discography', async () => {
    const discography = await firstValueFrom(component.discography$);
    expect(discography).toBe(testDiscography);
  });

  it('should display discography sections that have at least one album', () => {
    const els = fixture.nativeElement.querySelectorAll('.section-header');
    expect(els.length).toBe(1);
  });

  describe('Album', () => {
    let testAlbum: AlbumMetadata;
    let albumEl: HTMLElement;

    beforeEach(async () => {
      testAlbum = testDiscography.sections[0].albums[0];
      albumEl = fixture.nativeElement.querySelector('.list-item');
    });

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
      expect(linkDe.nativeElement.getAttribute('href')).toEqual(`/album/${testAlbum.id}`);
    });
  });
});
