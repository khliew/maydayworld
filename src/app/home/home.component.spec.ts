import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlbumsComponent } from '../albums/albums.component';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideZonelessChangeDetection(), SidenavService, TitleService],
    })
      .overrideComponent(HomeComponent, {
        remove: { imports: [AlbumsComponent] },
        add: { imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
