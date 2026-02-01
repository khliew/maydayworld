import { Component } from '@angular/core';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css'],
})
export class PrivacyComponent {
  constructor(
    private titleService: TitleService,
    private sidenavService: SidenavService,
  ) {
    this.sidenavService.setEnabled(false);
    this.titleService.resetTitle();
  }
}
