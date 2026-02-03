import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnvironmentService } from '../services/environment.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [RouterLink],
})
export class FooterComponent {
  private environmentService = inject(EnvironmentService);

  appVersion = this.environmentService.env.version;
  currentYear = new Date().getFullYear();
}
