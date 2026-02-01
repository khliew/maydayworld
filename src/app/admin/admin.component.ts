import { Component, OnInit } from '@angular/core';
import { TitleService } from '../services/title.service';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [MatButton, RouterLink],
})
export class AdminComponent implements OnInit {
  constructor(private titleService: TitleService) {}

  ngOnInit() {
    this.titleService.resetTitle();
  }
}
