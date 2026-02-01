import { Component } from '@angular/core';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  imports: [MatIconButton],
})
export class AboutUsComponent {
  constructor(
    private titleService: TitleService,
    private sidenavService: SidenavService,
  ) {
    this.sidenavService.setEnabled(false);
    this.titleService.resetTitle();
  }
}
