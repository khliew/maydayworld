import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  imports: [MatIconButton],
})
export class AboutUsComponent {
  private titleService = inject(TitleService);
  private sidenavService = inject(SidenavService);

  constructor() {
    this.sidenavService.setEnabled(false);
    this.titleService.resetTitle();
  }
}
