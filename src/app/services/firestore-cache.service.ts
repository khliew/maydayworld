import { Injectable } from '@angular/core';
import { Album, Discography, Song } from '../model';

@Injectable()
export class FirestoreCache {
  private static readonly MAX_AGE_IN_MILLIS = 60 * 60 * 1000;

  private cache: Map<string, Cached>;

  constructor() {
    this.cache = new Map<string, Cached>();
  }

  getAlbum(albumId: string) {
    return this.get<Album>(`album:${albumId}`);
  }

  putAlbum(album: Album) {
    this.put(`album:${album.id}`, album);
  }

  getDiscography(artistId: string) {
    return this.get<Discography>(`disco:${artistId}`);
  }

  putDiscography(disco: Discography) {
    this.put(`disco:${disco.id}`, disco);
  }

  getSong(songId: string) {
    return this.get<Song>(`song:${songId}`);
  }

  putSong(song: Song) {
    this.put(`song:${song.id}`, song);
  }

  get<T>(itemId: string) {
    const cached = this.cache.get(itemId);
    if (!cached) {
      return undefined;
    }

    const isExpired = cached.lastRead < Date.now() - FirestoreCache.MAX_AGE_IN_MILLIS;

    // remove item if expired
    if (isExpired) {
      this.cache.delete(itemId);
    }

    return isExpired ? undefined : (cached.item as T);
  }

  put<T>(itemId: string, item: T) {
    const now = Date.now();
    this.cache.set(itemId, { id: itemId, item, lastRead: now });

    // remove expired cache items
    const expired = now - FirestoreCache.MAX_AGE_IN_MILLIS;
    this.cache.forEach(entry => {
      if (entry.lastRead < expired) {
        this.cache.delete(entry.id);
      }
    });
  }
}

interface Cached {
  id: string;
  item: any;
  lastRead: number;
}
