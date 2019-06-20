import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, from, of, zip } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Album, Discography, Song } from '../model';
import { EnvironmentService } from '../services/environment.service';
import { RequestCache } from '../services/request-cache.service';
import { FirestoreService } from '../services/firestore.service';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Injectable()
export class AdminService {
  baseUrl: string;

  constructor(
    private fss: FirestoreService,
    private afs: AngularFirestore,
    private http: HttpClient,
    environmentService: EnvironmentService
  ) {
    this.baseUrl = environmentService.env.apiBaseUrl;
  }

  getDiscography(artistId: string = 'mayday'): Observable<Discography> {
    const httpOptions = {
      headers: new HttpHeaders({
        [RequestCache.NO_CACHE_HEADER]: 'true'
      })
    };

    return this.http.get<any>(`${this.baseUrl}/disco/${artistId}`, httpOptions)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createDiscography(discography: Discography): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>(`${this.baseUrl}/disco`, discography, httpOptions)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  replaceDiscography(discography: Discography): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.put<any>(`${this.baseUrl}/disco/${discography.id}`, discography, httpOptions)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getAlbum(albumId: string): Observable<Album> {
    return this.fss.getAlbum(albumId);
  }

  setAlbum(albumId: string, album: Album): Observable<void> {
    return from(this.afs.doc<Album>(`albums/${albumId}`)
      .set(
        JSON.parse(JSON.stringify(album)),
        { merge: true }
      ));
  }

  setAlbumSongs(albumId: string, added: { trackNum: number, songId: string }[], deleted: string[]): Observable<void> {
    const promises = [];
    deleted.forEach(songId => {
      promises.push(
        this.afs.doc(`songAlbums/${songId}`).update({ [albumId]: firebase.firestore.FieldValue.delete() })
      );
    });

    added.forEach(item => {
      promises.push(
        this.afs.doc(`songAlbums/${item.songId}`).set(
          { [albumId]: item.trackNum },
          { merge: true }
        )
      );
    });

    return zip(promises, () => { }); // return an Observable that emits when all promises complete
  }

  getSong(songId: string): Observable<Song> {
    return this.fss.getSong(songId);
  }

  getSongs(): Observable<Song[]> {
    return this.afs.collection<Song>('songs').get()
      .pipe(
        map(snapshot => {
          const songs = [];
          snapshot.docs.forEach(doc => songs.push(doc.data()));
          return songs;
        })
      );
  }

  setSong(songId: string, song: Song): Observable<void> {
    return from(this.afs.doc<Song>(`songs/${songId}`).set(JSON.parse(JSON.stringify(song))));
  }

  private handleError(error: HttpErrorResponse) {
    console.error(error); // log to console instead
    return throwError(error.error.error.message); // return message
  }
}
