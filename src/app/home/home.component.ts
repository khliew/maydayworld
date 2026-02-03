import { Component, inject, OnInit } from '@angular/core';
import { AlbumsComponent } from '../albums/albums.component';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [AlbumsComponent],
})
export class HomeComponent implements OnInit {
  private titleService = inject(TitleService);
  private sidenavService = inject(SidenavService);

  constructor() {
    this.sidenavService.setEnabled(false);
  }

  ngOnInit(): void {
    this.titleService.resetTitle();
  }
}
