import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminService } from './admin.service';
import { AlbumCreatorComponent } from './album/album-creator.component';
import { DiscographyCreatorComponent } from './discography/discography-creator.component';
import { SongCreatorComponent } from './song/song-creator.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [AdminService],
    children: [
      { path: '', component: AdminComponent },
      { path: 'create-album', component: AlbumCreatorComponent },
      { path: 'create-discography', component: DiscographyCreatorComponent },
      { path: 'create-song', component: SongCreatorComponent },
    ],
  },
];
