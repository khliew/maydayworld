import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Album } from '../model';
import { DataService } from '../services/data.service';

@Injectable({
  providedIn: 'root',
})
export class AlbumResolverService implements Resolve<Album> {
  constructor(private dataService: DataService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const albumId = route.paramMap.get('albumId');
    return new Promise<Album>((resolve, reject) => {
      this.dataService.getAlbum(albumId).subscribe(album => {
        resolve(!!album && !album.disabled ? album : null);
      });
    });
  }
}
