import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { catchError, concatMap, throwError } from 'rxjs';
import { Line, Song, SongMetadata, Title } from '../../model';
import { AdminService } from '../admin.service';
import {
  LyricsImportDelimiter,
  LyricsImportDiagnostic,
  LyricsImporter,
  LyricsImportMode,
  LyricsImportResult,
} from './lyrics-importer';
import { LyricsParseDiagnostic, LyricsParseResult, LyricsParser } from './lyrics-parser';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string') {
    return Validators.required(control);
  }

  return value.trim().length > 0 ? null : { required: true };
}

type LyricRowType = 'lyric' | 'break' | 'text';

interface LyricRowValue {
  type: LyricRowType;
  zht: string;
  zhp: string;
  eng: string;
  text: string;
}

function hasTrimmedValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function lyricRowValidator(control: AbstractControl): ValidationErrors | null {
  const type = control.get('type')?.value;
  const errors: ValidationErrors = {};

  if (type === 'lyric') {
    if (!hasTrimmedValue(control.get('zht')?.value)) {
      errors.zhtRequired = true;
    }

    if (!hasTrimmedValue(control.get('zhp')?.value)) {
      errors.zhpRequired = true;
    }

    if (!hasTrimmedValue(control.get('eng')?.value)) {
      errors.engRequired = true;
    }
  } else if (type === 'text') {
    if (!hasTrimmedValue(control.get('text')?.value)) {
      errors.textRequired = true;
    }
  } else if (type !== 'break') {
    errors.typeRequired = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
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
    MatError,
    MatIconButton,
    MatIcon,
  ],
})
export class SongCreatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  search = this.fb.control('');
  lyricRowsForm: FormArray = this.fb.array([]);
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
    lyricRows: this.lyricRowsForm,
  });
  lyricsImport = this.fb.control('');
  spreadsheetImport = this.fb.control('');
  spreadsheetImportMode = this.fb.control<LyricsImportMode>('three-column');
  spreadsheetImportDelimiter = this.fb.control<LyricsImportDelimiter>('auto');
  blankSpreadsheetRowsAsBreaks = this.fb.control(true);
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);

  songMds: SongMetadata[] = [];
  lyricsParser: LyricsParser;
  lyricsImporter: LyricsImporter;
  lyricsParseResult: LyricsParseResult;
  spreadsheetImportResult: LyricsImportResult;
  showLyricsImport: boolean;
  showSpreadsheetImport: boolean;
  hideOutput: boolean;
  output: Song;
  response: string;

  searchError: string;

  constructor() {
    this.lyricsParser = new LyricsParser();
    this.lyricsImporter = new LyricsImporter();
    this.lyricsParseResult = { lines: [], diagnostics: [] };
    this.spreadsheetImportResult = { lines: [], diagnostics: [], delimiter: 'tab' };
    this.showLyricsImport = false;
    this.showSpreadsheetImport = false;
    this.hideOutput = true;
    this.response = '';
    this.searchError = '';

    this.search.valueChanges.subscribe(value => {
      this.searchSong(value);
    });

    this.lyricsImport.valueChanges.subscribe(value => {
      this.validateLyrics(value);
    });

    this.spreadsheetImport.valueChanges.subscribe(() => {
      this.previewSpreadsheetImport();
    });

    this.spreadsheetImportMode.valueChanges.subscribe(() => {
      this.previewSpreadsheetImport();
    });

    this.spreadsheetImportDelimiter.valueChanges.subscribe(() => {
      this.previewSpreadsheetImport();
    });

    this.blankSpreadsheetRowsAsBreaks.valueChanges.subscribe(() => {
      this.previewSpreadsheetImport();
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
      this.lyricsImport.enable({ emitEvent: false });
      this.spreadsheetImport.enable({ emitEvent: false });
      this.spreadsheetImportMode.enable({ emitEvent: false });
      this.spreadsheetImportDelimiter.enable({ emitEvent: false });
      this.blankSpreadsheetRowsAsBreaks.enable({ emitEvent: false });
    } else {
      this.search.disable({ emitEvent: false });
      this.songForm.disable();
      this.lyricsImport.disable({ emitEvent: false });
      this.spreadsheetImport.disable({ emitEvent: false });
      this.spreadsheetImportMode.disable({ emitEvent: false });
      this.spreadsheetImportDelimiter.disable({ emitEvent: false });
      this.blankSpreadsheetRowsAsBreaks.disable({ emitEvent: false });
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

    this.setLyricRows(song.lyrics || []);
    this.lyricsImport.setValue(this.formatLinesAsControlTokens(song.lyrics || []), {
      emitEvent: false,
    });
    this.validateLyrics();
  }

  clear() {
    this.search.reset('', { emitEvent: false });
    this.songForm.reset({ disabled: false });
    this.setLyricRows([]);
    this.lyricsImport.reset('', { emitEvent: false });
    this.validateLyrics('');
    this.showLyricsImport = false;
    this.spreadsheetImport.reset('', { emitEvent: false });
    this.spreadsheetImportMode.setValue('three-column', { emitEvent: false });
    this.spreadsheetImportDelimiter.setValue('auto', { emitEvent: false });
    this.blankSpreadsheetRowsAsBreaks.setValue(true, { emitEvent: false });
    this.spreadsheetImportResult = { lines: [], diagnostics: [], delimiter: 'tab' };
    this.showSpreadsheetImport = false;
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

    song.lyrics = this.createLyricsFromRows();
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

  validateLyrics(lyrics: string = this.lyricsImport.value): LyricsParseResult {
    this.lyricsParseResult = this.lyricsParser.parseWithDiagnostics(lyrics || '');
    return this.lyricsParseResult;
  }

  get lyricsDiagnostics(): LyricsParseDiagnostic[] {
    return this.lyricsParseResult.diagnostics;
  }

  get spreadsheetImportDiagnostics(): LyricsImportDiagnostic[] {
    return this.spreadsheetImportResult.diagnostics;
  }

  get spreadsheetImportPreviewRows(): Line[] {
    return this.spreadsheetImportResult.lines;
  }

  hasLyricsValidationErrors(): boolean {
    return this.lyricRowsForm.invalid;
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
        this.response = 'Fix required song fields and lyric rows before saving.';
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

  addLyricRowForm(index: number = this.lyricRowsForm.length) {
    this.insertLyricRow(index, {
      type: 'lyric',
      zht: '',
      zhp: '',
      eng: '',
      text: '',
    });
  }

  addTextRowForm(index: number = this.lyricRowsForm.length) {
    this.insertLyricRow(index, {
      type: 'text',
      zht: '',
      zhp: '',
      eng: '',
      text: '',
    });
  }

  addBreakRowForm(index: number = this.lyricRowsForm.length) {
    this.insertLyricRow(index, {
      type: 'break',
      zht: '',
      zhp: '',
      eng: '',
      text: '',
    });
  }

  duplicateLyricRowForm(index: number) {
    const row = this.lyricRowsForm.at(index);
    if (!row) {
      return;
    }

    this.insertLyricRow(index + 1, row.getRawValue() as LyricRowValue);
  }

  removeLyricRowForm(index: number) {
    if (index < 0 || index >= this.lyricRowsForm.length) {
      return;
    }

    this.lyricRowsForm.removeAt(index);
    this.markLyricsRowsChanged();
  }

  moveLyricRowForm(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || index >= this.lyricRowsForm.length) {
      return;
    }

    if (nextIndex >= this.lyricRowsForm.length) {
      return;
    }

    const row = this.lyricRowsForm.at(index);
    this.lyricRowsForm.removeAt(index);
    this.lyricRowsForm.insert(nextIndex, row);
    this.markLyricsRowsChanged();
  }

  getLyricRowType(index: number): LyricRowType {
    const type = this.lyricRowsForm.at(index)?.get('type')?.value;
    if (type === 'break' || type === 'text') {
      return type;
    }

    return 'lyric';
  }

  getLyricRowErrors(index: number): string[] {
    const row = this.lyricRowsForm.at(index);
    if (!row || !row.errors) {
      return [];
    }

    const errors = row.errors;
    const messages: string[] = [];

    if (errors.typeRequired) {
      messages.push('Row type is required.');
    }

    if (errors.zhtRequired) {
      messages.push('Traditional Chinese lyric is required.');
    }

    if (errors.zhpRequired) {
      messages.push('Pinyin lyric is required.');
    }

    if (errors.engRequired) {
      messages.push('English translation is required.');
    }

    if (errors.textRequired) {
      messages.push('Text row content is required.');
    }

    return messages;
  }

  toggleLyricsImport() {
    this.showLyricsImport = !this.showLyricsImport;
  }

  openSpreadsheetImportDialog() {
    this.showSpreadsheetImport = true;
    this.response = '';
    this.previewSpreadsheetImport();
  }

  closeSpreadsheetImportDialog() {
    this.showSpreadsheetImport = false;
  }

  previewSpreadsheetImport(): LyricsImportResult {
    this.spreadsheetImportResult = this.lyricsImporter.parse(this.spreadsheetImport.value || '', {
      mode: this.spreadsheetImportMode.value || 'three-column',
      delimiter: this.spreadsheetImportDelimiter.value || 'auto',
      blankRowsAsBreaks: !!this.blankSpreadsheetRowsAsBreaks.value,
    });

    return this.spreadsheetImportResult;
  }

  canApplySpreadsheetImport(): boolean {
    return (
      !this.songForm.disabled &&
      this.spreadsheetImportDiagnostics.length === 0 &&
      this.spreadsheetImportPreviewRows.length > 0
    );
  }

  applySpreadsheetImport() {
    const result = this.previewSpreadsheetImport();

    if (result.diagnostics.length > 0) {
      this.response = 'Fix spreadsheet import errors before applying rows.';
      return;
    }

    if (result.lines.length === 0) {
      this.response = 'Paste rows before applying import.';
      return;
    }

    this.setLyricRows(result.lines);
    this.lyricRowsForm.markAsDirty();
    this.songForm.markAsDirty();
    this.response = `Imported ${result.lines.length} lyric row${result.lines.length === 1 ? '' : 's'}.`;
    this.showSpreadsheetImport = false;
  }

  spreadsheetImportFormatLabel(): string {
    return this.spreadsheetImportResult.delimiter === 'tab' ? 'TSV' : 'CSV';
  }

  importLyricsFromRaw() {
    const result = this.validateLyrics();
    if (result.diagnostics.length > 0) {
      this.response = 'Fix import validation errors before importing lyrics.';
      return;
    }

    this.setLyricRows(result.lines);
    this.lyricRowsForm.markAsDirty();
    this.songForm.markAsDirty();
    this.response = `Imported ${result.lines.length} lyric row${
      result.lines.length === 1 ? '' : 's'
    }.`;
    this.showLyricsImport = false;
  }

  private trimFormValue(controlName: string): string {
    return (this.songForm.get(controlName).value || '').trim();
  }

  private insertLyricRow(index: number, row: LyricRowValue) {
    this.lyricRowsForm.insert(index, this.createLyricRowForm(row));
    this.markLyricsRowsChanged();
  }

  private createLyricRowForm(row: LyricRowValue) {
    return this.fb.group(
      {
        type: [row.type],
        zht: [row.zht],
        zhp: [row.zhp],
        eng: [row.eng],
        text: [row.text],
      },
      { validators: lyricRowValidator },
    );
  }

  private setLyricRows(lines: Line[]) {
    this.lyricRowsForm.clear();
    lines.forEach(line => {
      this.lyricRowsForm.push(this.createLyricRowForm(this.createLyricRowValue(line)));
    });
    this.lyricRowsForm.updateValueAndValidity();
    this.lyricRowsForm.markAsPristine();
  }

  private createLyricRowValue(line: Line): LyricRowValue {
    return {
      type: line.type || 'lyric',
      zht: line.type === 'lyric' ? line.zht || '' : '',
      zhp: line.type === 'lyric' ? line.zhp || '' : '',
      eng: line.type === 'lyric' ? line.eng || '' : '',
      text: line.type === 'text' ? line.text || '' : '',
    };
  }

  private createLyricsFromRows(): Line[] {
    return this.lyricRowsForm.controls.map(row => {
      return this.createLineFromRowValue(row.getRawValue() as LyricRowValue);
    });
  }

  private createLineFromRowValue(row: LyricRowValue): Line {
    const line = new Line();
    line.type = row.type;

    if (row.type === 'lyric') {
      line.zht = row.zht || '';
      line.zhp = row.zhp || '';
      line.eng = row.eng || '';
    } else if (row.type === 'text') {
      line.text = row.text || '';
    }

    return line;
  }

  private formatLinesAsControlTokens(lines: Line[]): string {
    return lines
      .map(line => {
        switch (line.type) {
          case 'lyric':
            return ['L', line.zht || '', line.zhp || '', line.eng || ''].join('\n');
          case 'break':
            return 'B';
          case 'text':
            return ['T', line.text || ''].join('\n');
        }
      })
      .join('\n\n');
  }

  private markLyricsRowsChanged() {
    this.lyricRowsForm.markAsDirty();
    this.lyricRowsForm.updateValueAndValidity();
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
