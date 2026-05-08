import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
  };

  beforeEach(async () => {
    adminService = {
      getSongs: vi.fn(() => of([])),
      getSong: vi.fn(() => of(null)),
      setSong: vi.fn(() => of(void 0)),
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
      chineseTitle: '中文\nzhong wen\nChinese',
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
      chineseTitle: '中文\nzhong wen\nChinese',
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
    expect(comp.response).toBe('Song saved!');
  });

  function getSaveButton(): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button: HTMLButtonElement) => button.textContent.includes('Save'),
    ) as HTMLButtonElement;
  }
});
