import { Injectable } from '@angular/core';
import { Firestore, doc, docSnapshots } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Album, Discography, Song } from '../model';

@Injectable()
export class FirestoreService {
  constructor(private firestore: Firestore) {}

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
          return snapshot.data() as Song;
        } else {
          throw new Error(`song not found: ${songId}`);
        }
      }),
    );
  }
}
