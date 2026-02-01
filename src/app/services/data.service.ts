import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Album, Discography, Song } from '../model';
import { FirestoreCache } from './firestore-cache.service';
import { FirestoreService } from './firestore.service';

@Injectable()
export class DataService {
  constructor(
    private firestoreService: FirestoreService,
    private firestoreCache: FirestoreCache,
  ) {}

  getDiscography(artistId: string = 'mayday'): Observable<Discography> {
    const cached = this.firestoreCache.getDiscography(artistId);

    return !!cached
      ? of(cached)
      : this.firestoreService.getDiscography(artistId).pipe(
          map(disco => {
            disco.sections.forEach(section => {
              // sort by most recent first
              section.albums.sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate));
            });
            return disco;
          }),
          tap(disco => this.firestoreCache.putDiscography(disco)),
          catchError(this.handleError<Discography>('getDiscography')),
        );
  }

  getAlbum(albumId: string, artistId: string = 'mayday'): Observable<Album> {
    const cached = this.firestoreCache.getAlbum(albumId);

    return !!cached
      ? of(cached)
      : this.firestoreService.getAlbum(albumId).pipe(
          tap(album => this.firestoreCache.putAlbum(album)),
          catchError(this.handleError<Album>('getAlbum')),
        );
  }

  getSong(songId: string, artistId: string = 'mayday'): Observable<Song> {
    const cached = this.firestoreCache.getSong(songId);

    return !!cached
      ? of(cached)
      : this.firestoreService.getSong(songId).pipe(
          tap(song => this.firestoreCache.putSong(song)),
          catchError(this.handleError<Song>('getSong')),
        );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      return of(result as T); // let the app keep running by returning an empty result.
    };
  }
}
