import { NgModule } from '@angular/core';
import { MatDatepickerModule } from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { SharedModule } from '../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AdminService } from './admin.service';
import { AlbumCreatorComponent } from './album/album-creator.component';
import { DiscographyCreatorComponent } from './discography/discography-creator.component';
import { SongCreatorComponent } from './song/song-creator.component';

@NgModule({
  imports: [
    SharedModule,
    MatDatepickerModule,
    MatMomentDateModule,
    AdminRoutingModule
  ],
  declarations: [
    AdminComponent,
    AlbumCreatorComponent,
    DiscographyCreatorComponent,
    SongCreatorComponent
  ],
  providers: [
    AdminService
  ],
})
export class AdminModule { }
