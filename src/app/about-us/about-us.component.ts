import { Component } from '@angular/core';
import { SidenavService } from '../service/sidenav.service';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent {
  constructor(private sidenavService: SidenavService) {
    this.sidenavService.setEnabled(false);
  }
}
