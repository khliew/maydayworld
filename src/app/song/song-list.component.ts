import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Album } from '../model';

@Component({
  selector: 'app-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
  imports: [AsyncPipe, MatIconButton, RouterLink, MatIcon, MatListModule],
})
export class SongListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  album$: Observable<Album>;
  trackKeys$: Observable<number[]>;

  ngOnInit(): void {
    this.album$ = this.route.data.pipe(map(data => data.album));

    this.trackKeys$ = this.album$.pipe(
      map(album => {
        if (album) {
          const keys = Object.keys(album.songs) as unknown as number[];
          keys.sort((a, b) => a - b);
          return keys;
        }
        return [];
      }),
    );
  }
}
