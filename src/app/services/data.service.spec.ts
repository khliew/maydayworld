import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Album, Discography, Song } from '../model';
import { DataService } from './data.service';
import { FirestoreCache } from './firestore-cache.service';
import { FirestoreService } from './firestore.service';
import { SidenavService } from './sidenav.service';
import { TitleService } from './title.service';

describe('DataService', () => {
  let service: DataService;
  let firestoreServiceSpy;
  let firestoreCacheSpy;

  beforeEach(async () => {
    firestoreServiceSpy = {
      getDiscography: vi.fn(),
      getAlbum: vi.fn(),
      getSong: vi.fn(),
    };

    firestoreCacheSpy = {
      getDiscography: vi.fn(),
      putDiscography: vi.fn(),
      getAlbum: vi.fn(),
      putAlbum: vi.fn(),
      getSong: vi.fn(),
      putSong: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        DataService,
        TitleService,
        SidenavService,
        { provide: FirestoreService, useValue: firestoreServiceSpy },
        { provide: FirestoreCache, useValue: firestoreCacheSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(DataService);
  });

  describe('#getDiscography', () => {
    it('should return expected discography when there is no cached object', () =>
      new Promise<void>(done => {
        const expectedDisco: Discography = {
          id: 'id',
          sections: [{ type: 'studio', albums: [] }],
        };

        firestoreCacheSpy.getDiscography.mockReturnValue(null);
        firestoreServiceSpy.getDiscography.mockReturnValue(of(expectedDisco));

        service.getDiscography('id').subscribe(
          disco => {
            expect(disco).toEqual(expectedDisco);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return cached discography when there is a cached object', () =>
      new Promise<void>(done => {
        const expectedDisco: Discography = {
          id: 'id',
          sections: [{ type: 'studio', albums: [] }],
        };

        firestoreCacheSpy.getDiscography.mockReturnValue(expectedDisco);

        service.getDiscography('id').subscribe(
          disco => {
            expect(disco).toEqual(expectedDisco);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should put discography from server into cache', () =>
      new Promise<void>(done => {
        const expectedDisco: Discography = {
          id: 'id',
          sections: [{ type: 'studio', albums: [] }],
        };

        firestoreCacheSpy.getDiscography.mockReturnValue(null);
        firestoreServiceSpy.getDiscography.mockReturnValue(of(expectedDisco));

        service.getDiscography('id').subscribe(
          () => {
            expect(firestoreCacheSpy.putDiscography).toHaveBeenCalledWith(expectedDisco);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return undefined when the server errors', () =>
      new Promise<void>(done => {
        firestoreServiceSpy.getDiscography.mockReturnValue(throwError(() => 'test error'));

        service.getDiscography('id').subscribe(
          disco => {
            expect(disco).toBeUndefined();
            done();
          },
          e => {
            throw e;
          },
        );
      }));
  });

  describe('#getAlbum', () => {
    it('should return expected album when there is no cached object', () =>
      new Promise<void>(done => {
        const expectedAlbum: Album = {
          id: 'id',
          type: 'studio',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          releaseDate: '2013-08-24',
          songs: [],
        };

        firestoreCacheSpy.getAlbum.mockReturnValue(null);
        firestoreServiceSpy.getAlbum.mockReturnValue(of(expectedAlbum));

        service.getAlbum('id').subscribe(
          album => {
            expect(album).toEqual(expectedAlbum);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return cached album when there is a cached object', () =>
      new Promise<void>(done => {
        const expectedAlbum: Album = {
          id: 'id',
          type: 'studio',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          releaseDate: '2013-08-24',
          songs: [],
        };

        firestoreCacheSpy.getAlbum.mockReturnValue(expectedAlbum);

        service.getAlbum('id').subscribe(
          album => {
            expect(album).toEqual(expectedAlbum);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should put album from server into cache', () =>
      new Promise<void>(done => {
        const expectedAlbum: Album = {
          id: 'id',
          type: 'studio',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          releaseDate: '2013-08-24',
          songs: [],
        };

        firestoreCacheSpy.getAlbum.mockReturnValue(null);
        firestoreServiceSpy.getAlbum.mockReturnValue(of(expectedAlbum));

        service.getAlbum('id').subscribe(
          () => {
            expect(firestoreCacheSpy.putAlbum).toHaveBeenCalledWith(expectedAlbum);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return undefined when the server errors', () =>
      new Promise<void>(done => {
        firestoreServiceSpy.getAlbum.mockReturnValue(throwError(() => 'test error'));

        service.getAlbum('id').subscribe(
          album => {
            expect(album).toBeUndefined();
            done();
          },
          e => {
            throw e;
          },
        );
      }));
  });

  describe('#getSong', () => {
    it('should return expected song when there is no cached object', () =>
      new Promise<void>(done => {
        const expectedSong: Song = {
          id: 'id',
          lyricist: '',
          composer: '',
          arranger: '',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          lyrics: [],
        };

        firestoreCacheSpy.getSong.mockReturnValue(null);
        firestoreServiceSpy.getSong.mockReturnValue(of(expectedSong));

        service.getSong('id').subscribe(
          song => {
            expect(song).toEqual(expectedSong);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return cached song when there is a cached object', () =>
      new Promise<void>(done => {
        const expectedSong: Song = {
          id: 'id',
          lyricist: '',
          composer: '',
          arranger: '',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          lyrics: [],
        };

        firestoreCacheSpy.getSong.mockReturnValue(expectedSong);

        service.getSong('id').subscribe(
          song => {
            expect(song).toEqual(expectedSong);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should put song from server into cache', () =>
      new Promise<void>(done => {
        const expectedSong: Song = {
          id: 'id',
          lyricist: '',
          composer: '',
          arranger: '',
          title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
          lyrics: [],
        };

        firestoreCacheSpy.getSong.mockReturnValue(null);
        firestoreServiceSpy.getSong.mockReturnValue(of(expectedSong));

        service.getSong('id').subscribe(
          () => {
            expect(firestoreCacheSpy.putSong).toHaveBeenCalledWith(expectedSong);
            done();
          },
          e => {
            throw e;
          },
        );
      }));

    it('should return undefined when the server errors', () =>
      new Promise<void>(done => {
        firestoreServiceSpy.getSong.mockReturnValue(throwError(() => 'test error'));

        service.getSong('id').subscribe(
          song => {
            expect(song).toBeUndefined();
            done();
          },
          e => {
            throw e;
          },
        );
      }));
  });
});
