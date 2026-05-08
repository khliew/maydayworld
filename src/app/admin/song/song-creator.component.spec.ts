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

  it('renders lyrics validation errors and disables normal save', async () => {
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
      lyrics: 'L\n中文\nzhong wen',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const saveButton = getSaveButton();
    const errorEl: HTMLElement = fixture.nativeElement.querySelector('.lyrics-error');

    expect(errorEl.textContent).toContain('Line 1: Lyric block is missing English translation.');
    expect(saveButton.disabled).toBe(true);

    comp.save();

    expect(adminService.setSong).not.toHaveBeenCalled();
    expect(comp.response).toBe('Fix lyrics validation errors before saving.');
  });

  it('saves valid lyrics from the normal form path', () => {
    comp.songForm.patchValue({
      songId: 'test-song',
      traditionalTitle: '中文',
      pinyinTitle: 'zhong wen',
      titleTranslation: 'Chinese',
      englishTitle: 'English title',
      lyricist: 'Lyricist',
      composer: 'Composer',
      arranger: 'Arranger',
      lyrics: 'L\n中文\nzhong wen\nChinese lyric',
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
    expect(comp.response).toBe('Fix required song fields before saving.');
  });

  it('loads existing title fields and builds matching song metadata', () => {
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
      lyrics: [],
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
