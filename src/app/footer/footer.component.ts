import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnvironmentService } from '../services/environment.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [RouterLink],
})
export class FooterComponent {
  appVersion: string;
  currentYear = new Date().getFullYear();

  constructor(environmentService: EnvironmentService) {
    this.appVersion = environmentService.env.version;
  }
}
