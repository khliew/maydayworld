import { Routes } from '@angular/router';
import { SongDetailComponent } from '../song/song-detail.component';
import { SongListComponent } from '../song/song-list.component';
import { SongResolverService } from '../song/song-resolver.service';
import { AlbumDetailComponent } from './album-detail.component';
import { AlbumListComponent } from './album-list.component';
import { AlbumResolverService } from './album-resolver.service';

export const ALBUM_ROUTES: Routes = [
  {
    path: ':albumId',
    resolve: {
      album: AlbumResolverService,
    },
    children: [
      {
        path: '',
        component: AlbumListComponent,
        outlet: 'sidenav',
      },
      {
        path: '',
        component: AlbumDetailComponent,
      },
    ],
  },
  {
    path: ':albumId/song/:songId',
    resolve: {
      album: AlbumResolverService,
      song: SongResolverService,
    },
    children: [
      {
        path: '',
        component: SongListComponent,
        outlet: 'sidenav',
      },
      {
        path: '',
        component: SongDetailComponent,
      },
    ],
  },
];
