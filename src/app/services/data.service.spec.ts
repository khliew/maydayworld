import { of, throwError } from 'rxjs';
import { Album, Discography, Song } from '../model';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let firestoreService: {
    getDiscography: jasmine.Spy;
    getAlbum: jasmine.Spy;
    getSong: jasmine.Spy;
  };
  let firestoreCache: {
    getDiscography: jasmine.Spy;
    getAlbum: jasmine.Spy;
    getSong: jasmine.Spy;
    putDiscography: jasmine.Spy;
    putAlbum: jasmine.Spy;
    putSong: jasmine.Spy;
  };

  beforeEach(() => {
    firestoreService = jasmine.createSpyObj('FirestoreService', [
      'getDiscography',
      'getAlbum',
      'getSong',
      'putDiscography',
      'putAlbum',
      'putSong',
    ]);
    firestoreCache = jasmine.createSpyObj('FirestoreCache', [
      'getDiscography',
      'getAlbum',
      'getSong',
      'putDiscography',
      'putAlbum',
      'putSong',
    ]);
    service = new DataService(firestoreService as any, firestoreCache as any);
  });

  describe('#getDiscography', () => {
    it('should return expected discography when there is no cached object', (done: DoneFn) => {
      const expectedDisco: Discography = {
        id: 'id',
        sections: [{ type: 'studio', albums: [] }],
      };

      firestoreCache.getDiscography.and.returnValue(null);
      firestoreService.getDiscography.and.returnValue(of(expectedDisco));

      service.getDiscography('id').subscribe(disco => {
        expect(disco).toEqual(expectedDisco);
        done();
      }, fail);
    });

    it('should return cached discography when there is a cached object', (done: DoneFn) => {
      const expectedDisco: Discography = {
        id: 'id',
        sections: [{ type: 'studio', albums: [] }],
      };

      firestoreCache.getDiscography.and.returnValue(expectedDisco);

      service.getDiscography('id').subscribe(disco => {
        expect(disco).toEqual(expectedDisco);
        done();
      }, fail);
    });

    it('should put discography from server into cache', (done: DoneFn) => {
      const expectedDisco: Discography = {
        id: 'id',
        sections: [{ type: 'studio', albums: [] }],
      };

      firestoreCache.getDiscography.and.returnValue(null);
      firestoreService.getDiscography.and.returnValue(of(expectedDisco));

      service.getDiscography('id').subscribe(() => {
        expect(firestoreCache.putDiscography).toHaveBeenCalledWith(expectedDisco);
        done();
      }, fail);
    });

    it('should return undefined when the server errors', (done: DoneFn) => {
      firestoreService.getDiscography.and.returnValue(throwError('test error'));

      service.getDiscography('id').subscribe(disco => {
        expect(disco).toBeUndefined();
        done();
      }, fail);
    });
  });

  describe('#getAlbum', () => {
    it('should return expected album when there is no cached object', (done: DoneFn) => {
      const expectedAlbum: Album = {
        id: 'id',
        type: 'studio',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        releaseDate: '2013-08-24',
        songs: [],
      };

      firestoreCache.getAlbum.and.returnValue(null);
      firestoreService.getAlbum.and.returnValue(of(expectedAlbum));

      service.getAlbum('id').subscribe(album => {
        expect(album).toEqual(expectedAlbum);
        done();
      }, fail);
    });

    it('should return cached album when there is a cached object', (done: DoneFn) => {
      const expectedAlbum: Album = {
        id: 'id',
        type: 'studio',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        releaseDate: '2013-08-24',
        songs: [],
      };

      firestoreCache.getAlbum.and.returnValue(expectedAlbum);

      service.getAlbum('id').subscribe(album => {
        expect(album).toEqual(expectedAlbum);
        done();
      }, fail);
    });

    it('should put album from server into cache', (done: DoneFn) => {
      const expectedAlbum: Album = {
        id: 'id',
        type: 'studio',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        releaseDate: '2013-08-24',
        songs: [],
      };

      firestoreCache.getAlbum.and.returnValue(null);
      firestoreService.getAlbum.and.returnValue(of(expectedAlbum));

      service.getAlbum('id').subscribe(() => {
        expect(firestoreCache.putAlbum).toHaveBeenCalledWith(expectedAlbum);
        done();
      }, fail);
    });

    it('should return undefined when the server errors', (done: DoneFn) => {
      firestoreService.getAlbum.and.returnValue(throwError('test error'));

      service.getAlbum('id').subscribe(album => {
        expect(album).toBeUndefined();
        done();
      }, fail);
    });
  });

  describe('#getSong', () => {
    it('should return expected song when there is no cached object', (done: DoneFn) => {
      const expectedSong: Song = {
        id: 'id',
        lyricist: '',
        composer: '',
        arranger: '',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        lyrics: [],
      };

      firestoreCache.getSong.and.returnValue(null);
      firestoreService.getSong.and.returnValue(of(expectedSong));

      service.getSong('id').subscribe(song => {
        expect(song).toEqual(expectedSong);
        done();
      }, fail);
    });

    it('should return cached song when there is a cached object', (done: DoneFn) => {
      const expectedSong: Song = {
        id: 'id',
        lyricist: '',
        composer: '',
        arranger: '',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        lyrics: [],
      };

      firestoreCache.getSong.and.returnValue(expectedSong);

      service.getSong('id').subscribe(song => {
        expect(song).toEqual(expectedSong);
        done();
      }, fail);
    });

    it('should put song from server into cache', (done: DoneFn) => {
      const expectedSong: Song = {
        id: 'id',
        lyricist: '',
        composer: '',
        arranger: '',
        title: { chinese: { zht: 'title', zhp: 'pinyin', eng: 'eng' }, english: 'english' },
        lyrics: [],
      };

      firestoreCache.getSong.and.returnValue(null);
      firestoreService.getSong.and.returnValue(of(expectedSong));

      service.getSong('id').subscribe(() => {
        expect(firestoreCache.putSong).toHaveBeenCalledWith(expectedSong);
        done();
      }, fail);
    });

    it('should return undefined when the server errors', (done: DoneFn) => {
      firestoreService.getSong.and.returnValue(throwError('test error'));

      service.getSong('id').subscribe(song => {
        expect(song).toBeUndefined();
        done();
      }, fail);
    });
  });
});
