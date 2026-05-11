import { Injectable } from '@angular/core';
import {
  collection,
  deleteField,
  doc,
  Firestore,
  getDocs,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { Album, Discography, Song, SongMetadata } from '../model';
import { FirestoreService } from '../services/firestore.service';

@Injectable()
export class AdminService {
  constructor(
    private fss: FirestoreService,
    private firestore: Firestore,
  ) {}

  getDiscography(artistId: string = 'mayday'): Observable<Discography> {
    return this.fss.getDiscography(artistId);
  }

  setDiscography(artistId: string, discography: Discography): Observable<void> {
    return from(
      setDoc(doc(this.firestore, `discos/${artistId}`), JSON.parse(JSON.stringify(discography))),
    );
  }

  getAlbum(albumId: string): Observable<Album> {
    return this.fss.getAlbum(albumId);
  }

  getAlbums(): Observable<Album[]> {
    return from(
      getDocs(collection(this.firestore, 'albums')).then(snapshot => {
        const albums = [];
        snapshot.docs.forEach(doc => albums.push(doc.data()));
        return albums;
      }),
    );
  }

  setAlbum(albumId: string, album: Album): Observable<void> {
    return from(
      setDoc(doc(this.firestore, `albums/${albumId}`), JSON.parse(JSON.stringify(album)), {
        merge: true,
      }),
    );
  }

  setAlbumSongs(
    albumId: string,
    added: { trackNum: number; songId: string }[],
    deleted: string[],
  ): Observable<void> {
    if (added.length === 0 && deleted.length === 0) {
      return of(void 0);
    }

    const batch = writeBatch(this.firestore);

    const promises = [];
    deleted.forEach(songId => {
      promises.push(
        batch.update(doc(this.firestore, `songAlbums/${songId}`), {
          [albumId]: deleteField(),
        }),
      );
    });

    added.forEach(item => {
      promises.push(
        batch.set(
          doc(this.firestore, `songAlbums/${item.songId}`),
          { [albumId]: item.trackNum },
          { merge: true },
        ),
      );
    });
    return from(batch.commit());
  }

  getSong(songId: string): Observable<Song> {
    return this.fss.getSong(songId);
  }

  getSongs(): Observable<SongMetadata[]> {
    return from(
      getDocs(collection(this.firestore, 'songMetadatas')).then(snapshot => {
        const songs = [];
        snapshot.docs.forEach(doc => songs.push(doc.data()));
        return songs;
      }),
    );
  }

  setSong(songId: string, song: Song): Observable<void> {
    return from(setDoc(doc(this.firestore, `songs/${songId}`), JSON.parse(JSON.stringify(song))));
  }

  setSongMetadata(songId: string, songMetadata: SongMetadata): Observable<void> {
    return from(
      setDoc(
        doc(this.firestore, `songMetadatas/${songId}`),
        JSON.parse(JSON.stringify(songMetadata)),
      ),
    );
  }
}
