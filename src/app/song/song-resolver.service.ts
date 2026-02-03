import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Song } from '../model';
import { DataService } from '../services/data.service';

@Injectable({
  providedIn: 'root',
})
export class SongResolverService implements Resolve<Song> {
  private dataService = inject(DataService);

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const songId = route.paramMap.get('songId');
    return new Promise<Song>((resolve, reject) => {
      this.dataService.getSong(songId).subscribe(song => {
        resolve(!!song && !song.disabled ? song : null);
      });
    });
  }
}
