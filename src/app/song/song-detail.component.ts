import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Song } from '../model';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-song-detail',
  templateUrl: './song-detail.component.html',
  styleUrls: ['./song-detail.component.css'],
  imports: [AsyncPipe],
})
export class SongDetailComponent implements OnInit {
  song$: Observable<Song>;

  constructor(
    private titleService: TitleService,
    private router: Router,
    private route: ActivatedRoute,
    private sidenavService: SidenavService,
  ) {
    this.sidenavService.setEnabled(true);
  }

  ngOnInit(): void {
    this.song$ = this.route.data.pipe(
      map(data => {
        if (data.song) {
          this.titleService.setTitle(data.song.title.chinese.zht);
          return data.song;
        } else {
          this.router.navigate(['../../../'], { relativeTo: this.route });
          return null;
        }
      }),
    );
  }
}
