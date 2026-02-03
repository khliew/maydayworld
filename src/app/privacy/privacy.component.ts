import { Component, inject } from '@angular/core';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css'],
})
export class PrivacyComponent {
  private titleService = inject(TitleService);
  private sidenavService = inject(SidenavService);

  constructor() {
    this.sidenavService.setEnabled(false);
    this.titleService.resetTitle();
  }
}
