import { Component, OnInit } from '@angular/core';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { AlbumsComponent } from '../albums/albums.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [AlbumsComponent],
})
export class HomeComponent implements OnInit {
  constructor(
    private titleService: TitleService,
    private sidenavService: SidenavService,
  ) {
    this.sidenavService.setEnabled(false);
  }

  ngOnInit(): void {
    this.titleService.resetTitle();
  }
}
