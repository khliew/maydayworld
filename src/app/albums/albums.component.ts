import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Discography } from '../model';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-albums',
  templateUrl: './albums.component.html',
  styleUrls: ['./albums.component.css'],
  imports: [AsyncPipe, MatListModule, RouterLink, DatePipe],
})
export class AlbumsComponent implements OnInit {
  private dataService = inject(DataService);

  discography$: Observable<Discography>;

  ngOnInit(): void {
    this.discography$ = this.dataService.getDiscography();
  }
}
