import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput, MatLabel, MatPrefix, MatSuffix } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { combineLatest, Observable } from 'rxjs';
import { Album, SongMetadata, Title } from '../../model';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-album-creator',
  templateUrl: './album-creator.component.html',
  styleUrls: ['./album-creator.component.css'],
  imports: [
    MatFormField,
    MatSelect,
    ReactiveFormsModule,
    MatOption,
    MatInput,
    MatNativeDateModule,
    MatDatepickerModule,
    MatCheckbox,
    MatTooltip,
    MatLabel,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatPrefix,
    MatIconButton,
    MatIcon,
    MatButton,
  ],
})
export class AlbumCreatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  search = this.fb.control('');
  tracksForm = this.fb.array([this.createTrackForm()]);
  albumForm = this.fb.group({
    albumId: [''],
    disabled: [false],
    chineseTitle: [''],
    englishTitle: [''],
    releaseDate: [{ value: '', disabled: true }],
    albumType: ['studio'],
    tracks: this.tracksForm,
  });
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);

  albums: Album[];
  songs: SongMetadata[];
  hideOutput: boolean;
  output: Album;
  response: string;

  searchError: string;

  originalTracks: { [trackNum: number]: string };
  addedTracks: string[];
  removedTracks: Set<string>;
  resetting: boolean;

  constructor() {
    this.hideOutput = true;
    this.response = '';
    this.searchError = '';
    this.addedTracks = [];
    this.removedTracks = new Set<string>();
    this.originalTracks = {};

    this.search.valueChanges.subscribe(value => {
      this.searchAlbum(value);
    });
  }

  ngOnInit() {
    this.search.disable({ emitEvent: false });
    this.adminService.getAlbums().subscribe(albums => {
      this.albums = albums.sort((a, b) => {
        return a.id.localeCompare(b.id); // sort by id
      });

      this.search.enable({ emitEvent: false });
    });

    this.tracksForm.disable();
    this.adminService.getSongs().subscribe(songs => {
      this.songs = songs.sort((a, b) => {
        return a.id.localeCompare(b.id); // sort by id
      });

      this.tracksForm.enable();
    });
  }

  searchAlbum(albumId: string) {
    if (!!albumId) {
      this.response = '';
      this.searchError = '';
      this.setFormsEnabled(false);

      this.adminService.getAlbum(albumId).subscribe(album => {
        this.setFormsEnabled(true);

        if (album) {
          this.fillForm(album);
        } else {
          this.searchError = `Album not found: ${albumId}`;
        }
      });
    }
  }

  fillForm(album: Album) {
    this.albumForm.get('albumId').setValue(album.id);

    this.albumForm
      .get('disabled')
      .setValue(typeof album.disabled !== 'undefined' ? album.disabled : false);

    const title = album.title;
    this.albumForm
      .get('chineseTitle')
      .setValue(`${title.chinese.zht}\n${title.chinese.zhp}\n${title.chinese.eng}`);
    this.albumForm.get('englishTitle').setValue(title.english);

    this.albumForm.get('releaseDate').setValue(album.releaseDate);
    this.albumForm.get('albumType').setValue(album.type);

    this.tracksForm.clear();
    const trackKeys = Object.keys(album.songs);
    trackKeys.forEach(key => {
      const trackNum = Number(key);
      if (trackNum <= 0) {
        return;
      }

      while (this.tracksForm.length < trackNum) {
        this.addTrackForm(this.tracksForm.length);
      }

      const songId = album.songs[key].id;
      this.tracksForm.get(String(trackNum - 1)).setValue(songId);
      this.originalTracks[trackNum] = songId;
      this.addedTracks[trackNum - 1] = songId;
    });
  }

  clear() {
    this.search.reset('', { emitEvent: false });
    this.albumForm.reset({ albumType: 'studio' });
    this.response = '';
    this.searchError = '';

    this.tracksForm.clear();
    this.addTrackForm(0);

    this.addedTracks.length = 0;
    this.removedTracks.clear();
    this.originalTracks = {};

    this.hideOutput = true;
    this.readonly.setValue(true);
    this.outputForm.setValue('');
  }

  setFormsEnabled(enabled: boolean) {
    if (enabled) {
      this.search.enable({ emitEvent: false });
      this.albumForm.enable();
    } else {
      this.search.disable({ emitEvent: false });
      this.albumForm.disable();
    }
  }

  createFormAlbum() {
    const album = new Album();
    album.id = this.albumForm.get('albumId').value;

    album.disabled = this.albumForm.get('disabled').value;

    album.title = this.parseTitle(
      this.albumForm.get('chineseTitle').value,
      this.albumForm.get('englishTitle').value,
    );

    album.releaseDate = this.parseDate(this.albumForm.get('releaseDate').value);
    album.type = this.albumForm.get('albumType').value as any;

    return album;
  }

  generateJson() {
    this.output = this.createFormAlbum();

    this.hideOutput = false;
    this.response = '';
    this.searchError = '';
    this.outputForm.setValue(JSON.stringify(this.output, null, 2));
  }

  createTrackForm() {
    const control = this.fb.control('');
    control.valueChanges.subscribe(value => {
      if (this.resetting) {
        return;
      }

      const index = this.tracksForm.controls.findIndex(item => item === control);

      if (index !== -1) {
        const oldValue = this.addedTracks[index];
        this.addedTracks[index] = value;

        if (!!oldValue) {
          this.removedTracks.add(oldValue);
        }

        if (!!value) {
          this.removedTracks.delete(value);
        }
      }

      // clear other track controls that has the currently selected value
      this.resetting = true;
      for (let i = 0; i < this.tracksForm.controls.length; i++) {
        const item = this.tracksForm.controls[i];
        if (item !== control && item.value === value) {
          item.reset();
          this.addedTracks[i] = '';
        }
      }
      this.resetting = false;
    });
    return control;
  }

  addTrackForm(index: number) {
    this.tracksForm.insert(index, this.createTrackForm());
    this.addedTracks.push('');
  }

  removeTrackForm(index: number) {
    if (index < this.tracksForm.length && this.tracksForm.length > 1) {
      // add to removed tracks
      const control = this.tracksForm.get(String(index));
      if (!!control.value) {
        this.removedTracks.add(control.value);
      }

      this.tracksForm.removeAt(index);
      this.addedTracks.splice(index, 1);
    }
  }

  updateOriginalTracksAfterSave() {
    this.originalTracks = {};
    for (let i = 0; i < this.addedTracks.length; i++) {
      this.originalTracks[i] = this.addedTracks[i];
    }
    this.removedTracks.clear();
  }

  parseTitle(chinese: string, english: string): Title {
    const title = new Title();
    title.english = english;

    if (!!chinese) {
      const parts = chinese.split('\n');
      title.chinese = {
        zht: parts[0] && parts[0].trim(),
        zhp: parts[1] && parts[1].trim(),
        eng: parts[2] && parts[2].trim(),
      };
    }

    return title;
  }

  parseDate(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  parseSongs(songIds: string): string[] {
    return songIds
      .split('\n')
      .map(token => token.trim())
      .filter(token => token.length > 0);
  }

  save() {
    if (this.readonly.value) {
      this.output = this.createFormAlbum();
    } else {
      this.output = JSON.parse(this.outputForm.value);
    }

    this.response = '';
    this.setFormsEnabled(false);
    const results: Observable<any>[] = [];

    results.push(this.adminService.setAlbum(this.output.id, this.output));

    const added: { trackNum: number; songId: string }[] = [];
    for (let i = 0; i < this.addedTracks.length; i++) {
      if (!!this.addedTracks[i] && this.originalTracks[i + 1] !== this.addedTracks[i]) {
        added.push({ trackNum: i + 1, songId: this.addedTracks[i] });
      }
    }
    const original = new Set(Object.values(this.originalTracks));
    const removed = Array.from(new Set(this.removedTracks)).filter(x => original.has(x)); // removedTracks intersect originalTracks

    results.push(this.adminService.setAlbumSongs(this.output.id, added, removed));

    combineLatest(results).subscribe({
      next: v => {
        this.response = 'Album saved!';
        this.setFormsEnabled(true);

        this.updateOriginalTracksAfterSave();
      },
      error: err => {
        this.response = err;
        this.setFormsEnabled(true);
      },
    });
  }
}
