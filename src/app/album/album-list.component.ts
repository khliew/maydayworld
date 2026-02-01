import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { Discography } from '../model';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.css'],
  imports: [AsyncPipe, MatListModule, RouterLinkActive, RouterLink],
})
export class AlbumListComponent implements OnInit {
  discography$: Observable<Discography>;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.discography$ = this.dataService.getDiscography();
  }
}
