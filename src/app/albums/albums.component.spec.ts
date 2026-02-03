import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { AlbumMetadata, Discography } from '../model';
import { getTestDiscography } from '../model/testing/test-discography';
import { DataService } from '../services/data.service';
import { AlbumsComponent } from './albums.component';

describe('AlbumsComponent', () => {
  let fixture: ComponentFixture<AlbumsComponent>;
  let component: AlbumsComponent;
  let testDiscography: Discography;

  beforeEach(async () => {
    testDiscography = getTestDiscography();

    await TestBed.configureTestingModule({
      imports: [AlbumsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: DataService, useValue: { getDiscography: vi.fn() } },
      ],
    }).compileComponents();

    const dataServiceSpy = TestBed.inject(DataService) as Mocked<DataService>;
    dataServiceSpy.getDiscography.mockReturnValue(of(testDiscography));

    fixture = TestBed.createComponent(AlbumsComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should get a discography', async () => {
    const discography = await firstValueFrom(component.discography$);
    expect(discography).toBe(testDiscography);
  });

  it('should display discography sections that have at least one album', () => {
    const els = fixture.nativeElement.querySelectorAll('.section');
    expect(els.length).toBe(1);
  });

  describe('Album', () => {
    let testAlbum: AlbumMetadata;
    let albumEl: HTMLElement;

    beforeEach(async () => {
      testAlbum = testDiscography.sections[0].albums[0];
      albumEl = fixture.nativeElement.querySelector('.album-card');
    });

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
      const linkDe = fixture.debugElement.query(By.css('.album-card'));
      expect(linkDe.nativeElement.getAttribute('href')).toEqual(`/album/${testAlbum.id}`);
    });
  });
});
