import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Album } from '../model';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-album-detail',
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.css'],
  imports: [AsyncPipe, MatListModule, RouterLink, DatePipe],
})
export class AlbumDetailComponent implements OnInit {
  private titleService = inject(TitleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sidenavService = inject(SidenavService);

  album$: Observable<Album>;
  trackKeys$: Observable<number[]>;

  constructor() {
    this.sidenavService.setEnabled(true);
  }

  ngOnInit(): void {
    this.album$ = this.route.data.pipe(
      map(data => {
        if (data.album) {
          this.titleService.setTitle(data.album.title.chinese.zht);
          return data.album;
        } else {
          this.router.navigate(['/']);
          return null;
        }
      }),
    );

    this.trackKeys$ = this.album$.pipe(
      map(album => {
        if (album) {
          const keys = Object.keys(album.songs).map(Number);
          keys.sort((a, b) => a - b);
          return keys;
        }
        return [];
      }),
    );
  }
}
