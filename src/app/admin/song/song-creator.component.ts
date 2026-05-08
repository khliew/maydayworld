import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { catchError, concatMap, throwError } from 'rxjs';
import { Line, Song, SongMetadata, Title } from '../../model';
import { AdminService } from '../admin.service';
import { LyricsParseDiagnostic, LyricsParseResult, LyricsParser } from './lyrics-parser';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string') {
    return Validators.required(control);
  }

  return value.trim().length > 0 ? null : { required: true };
}

@Component({
  selector: 'app-song-creator',
  templateUrl: './song-creator.component.html',
  styleUrls: ['./song-creator.component.css'],
  imports: [
    MatFormField,
    MatSelect,
    ReactiveFormsModule,
    MatOption,
    MatInput,
    MatCheckbox,
    MatTooltip,
    MatLabel,
    MatButton,
    MatCard,
    MatError,
  ],
})
export class SongCreatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  search = this.fb.control('');
  songForm = this.fb.group({
    songId: ['', trimmedRequired],
    disabled: [false],
    traditionalTitle: ['', trimmedRequired],
    pinyinTitle: ['', trimmedRequired],
    titleTranslation: ['', trimmedRequired],
    englishTitle: ['', trimmedRequired],
    lyricist: [''],
    composer: [''],
    arranger: [''],
    lyrics: [''],
  });
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);

  songMds: SongMetadata[];
  lyricsParser: LyricsParser;
  lyricsParseResult: LyricsParseResult;
  hideOutput: boolean;
  output: Song;
  response: string;

  searchError: string;

  constructor() {
    this.lyricsParser = new LyricsParser();
    this.lyricsParseResult = { lines: [], diagnostics: [] };
    this.hideOutput = true;
    this.response = '';
    this.searchError = '';

    this.search.valueChanges.subscribe(value => {
      this.searchSong(value);
    });

    this.songForm.get('lyrics').valueChanges.subscribe(value => {
      this.validateLyrics(value);
    });
  }

  ngOnInit() {
    this.search.disable({ emitEvent: false });
    this.adminService.getSongs().subscribe(songs => {
      this.songMds = songs.sort((a, b) => {
        return a.id.localeCompare(b.id); // sort by id
      });

      this.search.enable({ emitEvent: false });
    });
  }

  setFormsEnabled(enabled: boolean) {
    if (enabled) {
      this.search.enable({ emitEvent: false });
      this.songForm.enable();
    } else {
      this.search.disable({ emitEvent: false });
      this.songForm.disable();
    }
  }

  searchSong(songId: string) {
    if (!!songId) {
      this.response = '';
      this.searchError = '';
      this.setFormsEnabled(false);

      this.adminService.getSong(songId).subscribe(song => {
        this.setFormsEnabled(true);

        if (song) {
          this.fillForm(song);
        } else {
          this.searchError = `Song not found: ${songId}`;
        }
      });
    }
  }

  fillForm(song: Song) {
    this.songForm.get('songId').setValue(song.id);

    this.songForm
      .get('disabled')
      .setValue(typeof song.disabled !== 'undefined' ? song.disabled : false);

    const title = song.title;
    this.songForm.get('traditionalTitle').setValue(title.chinese?.zht || '');
    this.songForm.get('pinyinTitle').setValue(title.chinese?.zhp || '');
    this.songForm.get('titleTranslation').setValue(title.chinese?.eng || '');
    this.songForm.get('englishTitle').setValue(title.english || '');

    this.songForm.get('lyricist').setValue(song.lyricist);
    this.songForm.get('composer').setValue(song.composer);
    this.songForm.get('arranger').setValue(song.arranger);

    if (song.lyrics) {
      const lyrics = song.lyrics
        .map(line => {
          switch (line.type) {
            case 'lyric': {
              return `L\n${line.zht}\n${line.zhp}\n${line.eng}\n`;
            }
            case 'break': {
              return 'B\n\n';
            }
            case 'text': {
              return `T\n${line.text}\n`;
            }
          }
        })
        .join('\n');
      this.songForm.get('lyrics').setValue(lyrics);
    }
  }

  clear() {
    this.search.reset('', { emitEvent: false });
    this.songForm.reset();
    this.validateLyrics();
    this.response = '';
    this.searchError = '';

    this.hideOutput = true;
    this.readonly.setValue(true);
    this.outputForm.setValue('');
  }

  createFormSong() {
    const song = new Song();
    song.id = this.trimFormValue('songId');

    song.disabled = this.songForm.get('disabled').value;

    song.lyricist = this.trimFormValue('lyricist');
    song.composer = this.trimFormValue('composer');
    song.arranger = this.trimFormValue('arranger');

    song.title = this.parseTitle(
      this.songForm.get('traditionalTitle').value,
      this.songForm.get('pinyinTitle').value,
      this.songForm.get('titleTranslation').value,
      this.songForm.get('englishTitle').value,
    );

    song.lyrics = this.parseLyrics(this.songForm.get('lyrics').value);
    return song;
  }

  createSongMetadata(song: Song): SongMetadata {
    const metadata = new SongMetadata();
    metadata.id = song.id;
    metadata.title = song.title;
    metadata.lyricist = song.lyricist;
    metadata.composer = song.composer;
    metadata.arranger = song.arranger;
    metadata.disabled = song.disabled;
    return metadata;
  }

  generateJson() {
    this.validateLyrics();
    this.output = this.createFormSong();

    this.hideOutput = false;
    this.response = '';
    this.searchError = '';
    this.outputForm.setValue(JSON.stringify(this.output, null, 2));
  }

  parseTitle(zht: string, zhp: string, eng: string, english: string): Title {
    const title = new Title();
    title.english = (english || '').trim();
    title.chinese = {
      zht: (zht || '').trim(),
      zhp: (zhp || '').trim(),
      eng: (eng || '').trim(),
    };

    return title;
  }

  parseLyrics(lyrics: string): Line[] {
    return this.lyricsParser.parse(lyrics);
  }

  validateLyrics(lyrics: string = this.songForm.get('lyrics').value): LyricsParseResult {
    this.lyricsParseResult = this.lyricsParser.parseWithDiagnostics(lyrics || '');
    return this.lyricsParseResult;
  }

  get lyricsDiagnostics(): LyricsParseDiagnostic[] {
    return this.lyricsParseResult.diagnostics;
  }

  hasLyricsValidationErrors(): boolean {
    return this.lyricsDiagnostics.length > 0;
  }

  hasFieldError(controlName: string, errorName: string): boolean {
    const control = this.songForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  hasFormValidationErrors(): boolean {
    return this.songForm.invalid;
  }

  canSave(): boolean {
    return (
      !this.songForm.disabled &&
      (!this.readonly.value ||
        (!this.hasFormValidationErrors() && !this.hasLyricsValidationErrors()))
    );
  }

  save() {
    if (this.readonly.value) {
      this.songForm.markAllAsTouched();

      if (this.hasFormValidationErrors()) {
        this.response = 'Fix required song fields before saving.';
        return;
      }

      const lyricsResult = this.validateLyrics();
      if (lyricsResult.diagnostics.length > 0) {
        this.response = 'Fix lyrics validation errors before saving.';
        return;
      }

      this.output = this.createFormSong();
    } else {
      try {
        this.output = JSON.parse(this.outputForm.value);
      } catch (err) {
        this.response = `JSON parse failed: ${this.formatError(err)}`;
        return;
      }
    }

    this.response = '';
    this.setFormsEnabled(false);
    const metadata = this.createSongMetadata(this.output);
    this.adminService
      .setSong(this.output.id, this.output)
      .pipe(
        catchError(err => {
          return throwError(() => new Error(`Song write failed: ${this.formatError(err)}`));
        }),
        concatMap(() =>
          this.adminService.setSongMetadata(this.output.id, metadata).pipe(
            catchError(err => {
              return throwError(() => new Error(`Metadata write failed: ${this.formatError(err)}`));
            }),
          ),
        ),
      )
      .subscribe(
        () => {
          this.upsertSongMetadata(metadata);
          this.response = 'Song and metadata saved!';
          this.setFormsEnabled(true);
        },
        err => {
          this.response = this.formatError(err);
          this.setFormsEnabled(true);
        },
      );
  }

  private trimFormValue(controlName: string): string {
    return (this.songForm.get(controlName).value || '').trim();
  }

  private upsertSongMetadata(metadata: SongMetadata) {
    if (!this.songMds) {
      return;
    }

    const nextSongMds = this.songMds.filter(song => song.id !== metadata.id);
    nextSongMds.push(metadata);
    this.songMds = nextSongMds.sort((a, b) => a.id.localeCompare(b.id));
    this.search.setValue(metadata.id, { emitEvent: false });
  }

  private formatError(err: any): string {
    if (err instanceof Error) {
      return err.message;
    }

    if (typeof err === 'string') {
      return err;
    }

    return JSON.stringify(err);
  }
}
