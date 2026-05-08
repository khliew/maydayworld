import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminService } from '../admin.service';
import { SongCreatorComponent } from './song-creator.component';

describe('SongCreatorComponent', () => {
  let fixture: ComponentFixture<SongCreatorComponent>;
  let comp: SongCreatorComponent;
  let adminService: {
    getSongs: ReturnType<typeof vi.fn>;
    getSong: ReturnType<typeof vi.fn>;
    setSong: ReturnType<typeof vi.fn>;
    setSongMetadata: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    adminService = {
      getSongs: vi.fn(() => of([])),
      getSong: vi.fn(() => of(null)),
      setSong: vi.fn(() => of(void 0)),
      setSongMetadata: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [SongCreatorComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SongCreatorComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders lyric row validation errors and disables normal save', async () => {
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
    });
    comp.addLyricRowForm();
    fixture.detectChanges();
    await fixture.whenStable();

    const saveButton = getSaveButton();
    const errorEls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.row-error'),
    );

    expect(
      errorEls.some(el => el.textContent.includes('Traditional Chinese lyric is required.')),
    ).toBe(true);
    expect(errorEls.some(el => el.textContent.includes('Pinyin lyric is required.'))).toBe(true);
    expect(errorEls.some(el => el.textContent.includes('English translation is required.'))).toBe(
      true,
    );
    expect(saveButton.disabled).toBe(true);

    comp.save();

    expect(adminService.setSong).not.toHaveBeenCalled();
    expect(comp.response).toBe('Fix required song fields and lyric rows before saving.');
  });

  it('saves valid lyric rows from the normal form path', () => {
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
      lyricist: 'Lyricist',
      composer: 'Composer',
      arranger: 'Arranger',
    });
    comp.addLyricRowForm();
    comp.lyricRowsForm.at(0).patchValue({
      zht: '中文',
      zhp: 'zhong wen',
      eng: 'Chinese lyric',
    });
    comp.addBreakRowForm();
    comp.addTextRowForm();
    comp.lyricRowsForm.at(2).patchValue({
      text: 'Translator note',
    });

    comp.save();

    expect(adminService.setSong).toHaveBeenCalledWith(
      'test-song',
      expect.objectContaining({
        id: 'test-song',
        lyrics: [
          expect.objectContaining({
            type: 'lyric',
            zht: '中文',
            zhp: 'zhong wen',
            eng: 'Chinese lyric',
          }),
          expect.objectContaining({
            type: 'break',
          }),
          expect.objectContaining({
            type: 'text',
            text: 'Translator note',
          }),
        ],
      }),
    );
    expect(adminService.setSongMetadata).toHaveBeenCalledWith(
      'test-song',
      expect.objectContaining({
        id: 'test-song',
        title: expect.objectContaining({
          chinese: {
            zht: '中文',
            zhp: 'zhong wen',
            eng: 'Chinese',
          },
          english: 'English title',
        }),
        lyricist: 'Lyricist',
        composer: 'Composer',
        arranger: 'Arranger',
      }),
    );
    expect(comp.response).toBe('Song and metadata saved!');
    expect(comp.songMds.map(song => song.id)).toEqual(['test-song']);
    expect(comp.search.value).toBe('test-song');
  });

  it('requires song id and title fields before saving the normal form', async () => {
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: '',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getSaveButton().disabled).toBe(true);

    comp.save();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEls: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-error'));
    expect(errorEls.some(el => el.textContent.includes('Pinyin title is required.'))).toBe(true);
    expect(adminService.setSong).not.toHaveBeenCalled();
    expect(adminService.setSongMetadata).not.toHaveBeenCalled();
    expect(comp.response).toBe('Fix required song fields and lyric rows before saving.');
  });

  it('loads existing title fields and lyrics, then builds matching song metadata', () => {
    comp.fillForm({
      id: 'existing-song',
      disabled: true,
      title: {
        chinese: {
          zht: '倔強',
          zhp: 'jue jiang',
          eng: 'Stubborn',
        },
        english: 'Stubborn',
      },
      lyricist: 'Ashin',
      composer: 'Ashin',
      arranger: 'Mayday',
      lyrics: [
        {
          type: 'lyric',
          zht: '我和我最後的倔強',
          zhp: 'wo he wo zui hou de jue jiang',
          eng: 'Me and my last stubbornness',
        },
        { type: 'break' },
        { type: 'text', text: 'Translator note' },
      ],
    });

    const song = comp.createFormSong();
    const metadata = comp.createSongMetadata(song);

    expect(song.title).toEqual({
      chinese: {
        zht: '倔強',
        zhp: 'jue jiang',
        eng: 'Stubborn',
      },
      english: 'Stubborn',
    });
    expect(metadata).toMatchObject({
      id: 'existing-song',
      disabled: true,
      title: song.title,
      lyricist: 'Ashin',
      composer: 'Ashin',
      arranger: 'Mayday',
    });
    expect(comp.lyricRowsForm.length).toBe(3);
    expect(JSON.parse(JSON.stringify(song.lyrics))).toEqual([
      {
        type: 'lyric',
        zht: '我和我最後的倔強',
        zhp: 'wo he wo zui hou de jue jiang',
        eng: 'Me and my last stubbornness',
      },
      { type: 'break' },
      { type: 'text', text: 'Translator note' },
    ]);
  });

  it('imports valid raw lyrics into structured rows', () => {
    comp.lyricsImport.setValue(
      ['L', '中文', 'zhong wen', 'Chinese lyric', '', 'B', '', 'T', 'Translator note'].join('\n'),
    );

    comp.importLyricsFromRaw();
    const song = comp.createFormSong();

    expect(comp.lyricRowsForm.length).toBe(3);
    expect(JSON.parse(JSON.stringify(song.lyrics))).toEqual([
      {
        type: 'lyric',
        zht: '中文',
        zhp: 'zhong wen',
        eng: 'Chinese lyric',
      },
      { type: 'break' },
      { type: 'text', text: 'Translator note' },
    ]);
    expect(comp.response).toBe('Imported 3 lyric rows.');
  });

  it('keeps existing rows when raw lyrics import has parser diagnostics', () => {
    comp.addBreakRowForm();
    comp.lyricsImport.setValue(['L', '中文', 'zhong wen'].join('\n'));

    comp.importLyricsFromRaw();

    expect(comp.lyricRowsForm.length).toBe(1);
    expect(comp.getLyricRowType(0)).toBe('break');
    expect(comp.lyricsDiagnostics).toEqual([
      {
        lineNumber: 1,
        message: 'Lyric block is missing English translation.',
      },
    ]);
    expect(comp.response).toBe('Fix import validation errors before importing lyrics.');
  });

  it('previews spreadsheet import without changing existing rows until apply', () => {
    comp.addBreakRowForm();
    comp.spreadsheetImport.setValue('中文\tzhong wen\tChinese lyric');

    expect(comp.spreadsheetImportDiagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(comp.spreadsheetImportPreviewRows))).toEqual([
      {
        type: 'lyric',
        zht: '中文',
        zhp: 'zhong wen',
        eng: 'Chinese lyric',
      },
    ]);
    expect(comp.lyricRowsForm.length).toBe(1);
    expect(comp.getLyricRowType(0)).toBe('break');

    comp.applySpreadsheetImport();

    expect(comp.lyricRowsForm.length).toBe(1);
    expect(JSON.parse(JSON.stringify(comp.createFormSong().lyrics))).toEqual([
      {
        type: 'lyric',
        zht: '中文',
        zhp: 'zhong wen',
        eng: 'Chinese lyric',
      },
    ]);
    expect(comp.response).toBe('Imported 1 lyric row.');
  });

  it('keeps existing rows when spreadsheet import has row errors', () => {
    comp.addBreakRowForm();
    comp.spreadsheetImport.setValue('中文,,Chinese lyric');

    comp.applySpreadsheetImport();

    expect(comp.lyricRowsForm.length).toBe(1);
    expect(comp.getLyricRowType(0)).toBe('break');
    expect(comp.spreadsheetImportDiagnostics).toEqual([
      {
        rowNumber: 1,
        field: 'zhp',
        message: 'zhp is required.',
      },
    ]);
    expect(comp.response).toBe('Fix spreadsheet import errors before applying rows.');
  });

  it('duplicates, reorders, and deletes lyric rows', () => {
    comp.fillForm({
      id: 'existing-song',
      title: {
        chinese: {
          zht: '倔強',
          zhp: 'jue jiang',
          eng: 'Stubborn',
        },
        english: 'Stubborn',
      },
      lyricist: '',
      composer: '',
      arranger: '',
      lyrics: [
        {
          type: 'lyric',
          zht: '中文',
          zhp: 'zhong wen',
          eng: 'Chinese lyric',
        },
        { type: 'text', text: 'Translator note' },
      ],
    });

    comp.duplicateLyricRowForm(0);
    comp.moveLyricRowForm(2, -1);
    comp.removeLyricRowForm(0);

    const song = comp.createFormSong();
    expect(JSON.parse(JSON.stringify(song.lyrics))).toEqual([
      { type: 'text', text: 'Translator note' },
      {
        type: 'lyric',
        zht: '中文',
        zhp: 'zhong wen',
        eng: 'Chinese lyric',
      },
    ]);
  });

  it('reports song write failures without writing metadata', () => {
    adminService.setSong.mockReturnValue(throwError(() => new Error('permission denied')));
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
    });

    comp.save();

    expect(adminService.setSong).toHaveBeenCalled();
    expect(adminService.setSongMetadata).not.toHaveBeenCalled();
    expect(comp.response).toBe('Song write failed: permission denied');
  });

  it('reports metadata write failures after the song write completes', () => {
    adminService.setSongMetadata.mockReturnValue(throwError(() => 'permission denied'));
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
    });

    comp.save();

    expect(adminService.setSong).toHaveBeenCalled();
    expect(adminService.setSongMetadata).toHaveBeenCalled();
    expect(comp.response).toBe('Metadata write failed: permission denied');
  });

  function getSaveButton(): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button: HTMLButtonElement) => button.textContent.includes('Save'),
    ) as HTMLButtonElement;
  }
});
