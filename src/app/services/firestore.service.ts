import { inject, Injectable } from '@angular/core';
import { doc, docSnapshots, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Album, Discography, parseFirestoreSong, Song } from '../model';

@Injectable()
export class FirestoreService {
  private firestore = inject(Firestore);

  getDiscography(artistId: string = 'mayday'): Observable<Discography> {
    return docSnapshots(doc(this.firestore, `discos/${artistId}`)).pipe(
      map(snapshot => {
        if (snapshot.exists) {
          return snapshot.data() as Discography;
        } else {
          throw new Error(`discography not found: ${artistId}`);
        }
      }),
    );
  }

  getAlbum(albumId: string): Observable<Album> {
    return docSnapshots(doc(this.firestore, `albums/${albumId}`)).pipe(
      map(snapshot => {
        if (snapshot.exists) {
          return snapshot.data() as Album;
        } else {
          throw new Error(`album not found: ${albumId}`);
        }
      }),
    );
  }

  getSong(songId: string): Observable<Song> {
    return docSnapshots(doc(this.firestore, `songs/${songId}`)).pipe(
      map(snapshot => {
        if (snapshot.exists) {
          return parseFirestoreSong(snapshot.data(), songId);
        } else {
          throw new Error(`song not found: ${songId}`);
        }
      }),
    );
  }
}
