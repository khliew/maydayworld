import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Album, AlbumMetadata, Discography } from '../../model';
import { AdminService } from '../admin.service';
import { DiscographyCreatorComponent } from './discography-creator.component';

describe('DiscographyCreatorComponent', () => {
  let fixture: ComponentFixture<DiscographyCreatorComponent>;
  let comp: DiscographyCreatorComponent;
  let albumsSubject: Subject<Album[]>;
  let albums: Album[];
  let adminService: {
    getAlbums: ReturnType<typeof vi.fn>;
    getDiscography: ReturnType<typeof vi.fn>;
    setDiscography: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    albumsSubject = new Subject<Album[]>();
    albums = [
      createAlbum('first-album', 'First album current zht', 'First Album Current', '1999-07-07'),
      createAlbum('ep-album', 'EP current zht', 'EP Current', '2001-05-16'),
      createAlbum(
        'compilation-album',
        'Compilation current zht',
        'Compilation Current',
        '2004-11-05',
        true,
      ),
    ];
    adminService = {
      getAlbums: vi.fn(() => albumsSubject.asObservable()),
      getDiscography: vi.fn(() => of(null)),
      setDiscography: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [DiscographyCreatorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscographyCreatorComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads albums before enabling the editor', () => {
    expect(adminService.getAlbums).toHaveBeenCalledTimes(1);
    expect(comp.discoForm.disabled).toBe(true);
    expect(comp.searchDisabled).toBe(true);

    loadAlbums();

    expect(comp.discoForm.enabled).toBe(true);
    expect(comp.searchDisabled).toBe(false);
    expect(comp.albums.map(album => album.id)).toEqual([
      'compilation-album',
      'ep-album',
      'first-album',
    ]);
  });

  it('does not search when artist id is blank', () => {
    loadAlbums();

    comp.searchDiscography();

    expect(adminService.getDiscography).not.toHaveBeenCalled();
    expect(comp.hideOutput).toBe(true);
  });

  it('loads an existing discography into section controls and normalized JSON output', () => {
    const discography: Discography = {
      id: 'mayday',
      sections: [
        {
          type: 'studio',
          albums: [
            {
              id: 'first-album',
              releaseDate: '1999-07-07',
              title: {
                chinese: {
                  zht: 'First album stale zht',
                  zhp: 'di yi zhang chuang zuo zhuan ji',
                  eng: 'First Album',
                },
                english: 'First Album Stale',
              },
            },
          ],
        },
        {
          type: 'ep',
          albums: [
            {
              id: 'ep-album',
              releaseDate: '2001-05-16',
              title: {
                chinese: {
                  zht: 'EP stale zht',
                  zhp: 'ep',
                  eng: 'EP',
                },
                english: 'EP Stale',
              },
            },
          ],
        },
      ],
    };
    adminService.getDiscography.mockReturnValue(of(discography));
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');

    comp.searchDiscography();
    fixture.detectChanges();

    expect(adminService.getDiscography).toHaveBeenCalledWith('mayday');
    expect(comp.hideOutput).toBe(false);
    expect(comp.searchError).toBe('');
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['first-album']);
    expect(comp.getSectionAlbumIds('compilation').getRawValue()).toEqual([]);
    expect(comp.getSectionAlbumIds('ep').getRawValue()).toEqual(['ep-album']);
    expect(comp.getSectionAlbumIds('other').getRawValue()).toEqual([]);

    const normalized = comp.createFormDiscography();
    expect(normalized).toEqual({
      id: 'mayday',
      sections: [
        {
          type: 'studio',
          albums: [toMetadata(albums[0])],
        },
        {
          type: 'compilation',
          albums: [],
        },
        {
          type: 'ep',
          albums: [toMetadata(albums[1])],
        },
        {
          type: 'other',
          albums: [],
        },
      ],
    });
    expect(JSON.parse(comp.outputForm.value || '')).toEqual(normalized);
  });

  it('shows a not found message when no discography is returned', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('unknown');

    comp.searchDiscography();

    expect(comp.hideOutput).toBe(true);
    expect(comp.searchDisabled).toBe(false);
    expect(comp.searchError).toBe('Discography not found: unknown');
  });

  it('shows lookup failures and re-enables search', () => {
    adminService.getDiscography.mockReturnValue(throwError(() => new Error('permission denied')));
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');

    comp.searchDiscography();

    expect(comp.hideOutput).toBe(true);
    expect(comp.searchDisabled).toBe(false);
    expect(comp.searchError).toBe('Discography lookup failed: permission denied');
  });

  it('renders section rows from the structured form', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'compilation',
            albums: [toMetadata(albums[2])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');

    comp.searchDiscography();
    fixture.detectChanges();

    const sectionEls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.discography-section'),
    );
    const labelEls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.album-row-labels span'),
    );
    const albumRow: HTMLElement = fixture.nativeElement.querySelector('.album-row');

    expect(sectionEls).toHaveLength(4);
    expect(sectionEls.map(el => el.querySelector('h3')?.textContent.trim())).toEqual([
      'Studio Albums',
      'Compilations',
      'EP',
      'Other',
    ]);
    expect(labelEls.map(el => el.textContent.trim())).toEqual(['Album', 'Actions']);
    expect(
      Array.from(albumRow.querySelectorAll('option')).map(option => option.textContent.trim()),
    ).toContain('Compilation current zht - 2004-11-05');
    expect((albumRow.querySelector('select') as HTMLSelectElement).value).toBe('compilation-album');
    expect(albumRow.querySelector('.album-disabled')).toBeNull();
  });

  it('renders an empty live preview before albums are selected', () => {
    loadAlbums();

    const previewPanel: HTMLElement = fixture.nativeElement.querySelector('.preview-panel');

    expect(previewPanel.textContent).toContain('Live preview');
    expect(previewPanel.textContent).toContain('No albums selected.');
    expect(previewPanel.querySelectorAll('.preview-album-card')).toHaveLength(0);
  });

  it('renders a public-style live preview from selected section albums', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'studio',
            albums: [toMetadata(albums[0])],
          },
          {
            type: 'compilation',
            albums: [toMetadata(albums[2])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');

    comp.searchDiscography();
    fixture.detectChanges();

    const previewPanel: HTMLElement = fixture.nativeElement.querySelector('.preview-panel');
    const previewSections: HTMLElement[] = Array.from(
      previewPanel.querySelectorAll('.preview-section'),
    );
    const previewCards: HTMLAnchorElement[] = Array.from(
      previewPanel.querySelectorAll('.preview-album-card'),
    );

    expect(previewPanel.textContent).not.toContain('No albums selected.');
    expect(previewSections.map(section => section.querySelector('h4')?.textContent.trim())).toEqual(
      ['Studio Albums', 'Compilations'],
    );
    expect(previewCards).toHaveLength(2);
    expect(previewCards[0].textContent).toContain('First album current zht');
    expect(previewCards[0].textContent).toContain('First Album Current');
    expect(previewCards[0].textContent).toContain('Jul 7, 1999');
    expect(previewCards[0].getAttribute('href')).toBe('/album/first-album');
    expect(previewCards[1].classList.contains('disabled')).toBe(true);
    expect(previewCards[1].getAttribute('href')).toBeNull();
  });

  it('updates the live preview automatically when section rows change', () => {
    loadAlbums();

    comp.addAlbumRow('ep');
    comp.getSectionAlbumIds('ep').at(0).setValue('ep-album');

    expect(comp.previewSections).toEqual([
      {
        type: 'ep',
        albums: [toMetadata(albums[1])],
      },
    ]);

    comp.removeAlbumRow('ep', 0);

    expect(comp.previewSections).toEqual([]);
  });

  it('blocks save until the discography form is valid and dirty', () => {
    loadAlbums();

    expect(comp.canSave()).toBe(false);

    comp.save();

    expect(adminService.setDiscography).not.toHaveBeenCalled();
    expect(comp.response).toBe('Fix required discography fields before saving.');

    comp.discoForm.get('artistId').setValue('mayday');
    comp.discoForm.get('artistId').markAsDirty();

    expect(comp.canSave()).toBe(true);

    comp.addAlbumRow('studio');

    expect(comp.canSave()).toBe(false);

    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');

    expect(comp.canSave()).toBe(true);
  });

  it('keeps generated JSON read-only by default and syncs it from structured edits', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');

    const json = JSON.parse(comp.outputForm.value || '');

    expect(comp.readonly.value).toBe(true);
    expect(json).toEqual(comp.createFormDiscography());
    expect(json.sections[0].albums[0]).toEqual(toMetadata(albums[0]));
  });

  it('validates edited advanced JSON and shows errors near the editor', () => {
    loadAlbums();
    comp.readonly.setValue(false);
    comp.outputForm.setValue(
      JSON.stringify({
        id: 'mayday',
        sections: [
          {
            type: 'live',
            albums: [],
          },
          {
            type: 'studio',
            albums: [{ id: 'missing-album' }, { id: 'first-album' }, { id: 'first-album' }],
          },
        ],
      }),
    );
    comp.outputForm.markAsDirty();
    fixture.detectChanges();

    expect(comp.jsonValidationErrors).toEqual([
      'Section 1 has an unsupported type.',
      'Section 2 album 1 uses unknown album ID "missing-album".',
      'Section 2 album 3 duplicates album ID "first-album".',
    ]);
    expect(comp.canSave()).toBe(false);

    const errorEls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.json-error'),
    );
    expect(errorEls.map(el => el.textContent.trim())).toEqual(comp.jsonValidationErrors);
  });

  it('blocks advanced JSON saves when the edited value is invalid', () => {
    loadAlbums();
    comp.readonly.setValue(false);
    comp.outputForm.setValue('{"id": "mayday",');
    comp.outputForm.markAsDirty();

    comp.save();

    expect(adminService.setDiscography).not.toHaveBeenCalled();
    expect(comp.response).toBe('Fix advanced JSON errors before saving.');
    expect(comp.jsonValidationErrors[0]).toContain('JSON parse failed:');
  });

  it('applies valid advanced JSON into the structured editor without saving', () => {
    loadAlbums();
    comp.readonly.setValue(false);
    comp.outputForm.setValue(
      JSON.stringify({
        id: 'json-artist',
        sections: [
          {
            type: 'ep',
            albums: [{ id: 'ep-album', title: { english: 'stale' } }],
          },
        ],
      }),
    );
    comp.outputForm.markAsDirty();

    comp.applyAdvancedJson();

    expect(adminService.setDiscography).not.toHaveBeenCalled();
    expect(comp.readonly.value).toBe(true);
    expect(comp.response).toBe('Advanced JSON applied.');
    expect(comp.discoForm.get('artistId').value).toBe('json-artist');
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual([]);
    expect(comp.getSectionAlbumIds('ep').getRawValue()).toEqual(['ep-album']);
    expect(comp.hasUnsavedChanges()).toBe(true);
    expect(JSON.parse(comp.outputForm.value || '').sections[2].albums).toEqual([
      toMetadata(albums[1]),
    ]);
  });

  it('previews section imports and renders diagnostics', () => {
    loadAlbums();

    const importToggle: HTMLButtonElement =
      fixture.nativeElement.querySelector('.section-tools button');
    importToggle.click();
    fixture.detectChanges();
    comp.sectionsImport.setValue(
      ['S', 'studio', 'missing-album', '', 'S', 'ep', 'first-album', 'first-album'].join('\n'),
    );
    const previewButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.sections-import-actions button',
    );
    previewButton.click();
    fixture.detectChanges();

    expect(comp.sectionsImportDiagnostics).toEqual([
      {
        lineNumber: 3,
        message: 'Unknown album ID "missing-album".',
      },
      {
        lineNumber: 8,
        message: 'Duplicate album ID "first-album".',
      },
    ]);
    expect(comp.canApplySectionsImport()).toBe(false);

    const errorEls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.import-error'),
    );
    const previewRows: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.sections-import-preview-row'),
    );

    expect(errorEls.map(el => el.textContent.trim())).toEqual([
      'Line 3: Unknown album ID "missing-album".',
      'Line 8: Duplicate album ID "first-album".',
    ]);
    expect(previewRows).toHaveLength(3);
    expect(previewRows[0].textContent).toContain('missing-album');
    expect(previewRows[0].textContent).toContain('Unknown album');
    expect(previewRows[1].textContent).toContain('First album current zht');
  });

  it('applies valid section imports into the structured editor', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.toggleSectionsImport();
    fixture.detectChanges();
    comp.sectionsImport.setValue(
      ['S', 'studio', 'first-album', '', 'S', 'ep', 'ep-album'].join('\n'),
    );
    comp.previewSectionsImport();
    fixture.detectChanges();

    expect(comp.sectionsImportDiagnostics).toEqual([]);
    expect(comp.sectionsImportPreviewSections.map(section => section.type)).toEqual([
      'studio',
      'ep',
    ]);
    expect(comp.canApplySectionsImport()).toBe(true);

    comp.applySectionsImport();

    expect(comp.showSectionsImport).toBe(false);
    expect(comp.response).toBe('Imported 2 albums into 2 sections.');
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['first-album']);
    expect(comp.getSectionAlbumIds('compilation').getRawValue()).toEqual([]);
    expect(comp.getSectionAlbumIds('ep').getRawValue()).toEqual(['ep-album']);
    expect(comp.hasUnsavedChanges()).toBe(true);
    expect(JSON.parse(comp.outputForm.value || '')).toEqual(comp.createFormDiscography());
  });

  it('does not apply section imports while diagnostics are present', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');
    comp.sectionsImport.setValue(['S', 'studio', 'missing-album'].join('\n'));
    comp.previewSectionsImport();

    comp.applySectionsImport();

    expect(comp.response).toBe('Fix import diagnostics before applying.');
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['first-album']);
  });

  it('adds album rows and generates normalized metadata from the selected album', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');

    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');

    expect(comp.hasUnsavedChanges()).toBe(true);
    expect(comp.createFormDiscography()).toEqual({
      id: 'mayday',
      sections: [
        {
          type: 'studio',
          albums: [toMetadata(albums[0])],
        },
        {
          type: 'compilation',
          albums: [],
        },
        {
          type: 'ep',
          albums: [],
        },
        {
          type: 'other',
          albums: [],
        },
      ],
    });
  });

  it('saves valid discographies and resets dirty tracking', () => {
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');

    const expectedDiscography = comp.createFormDiscography();

    comp.save();

    expect(adminService.setDiscography).toHaveBeenCalledWith('mayday', expectedDiscography);
    expect(comp.response).toBe('Discography saved!');
    expect(comp.discoForm.enabled).toBe(true);
    expect(comp.searchDisabled).toBe(false);
    expect(comp.hasUnsavedChanges()).toBe(false);
    expect(comp.canSave()).toBe(false);
    expect(comp.canRevert()).toBe(false);
    expect(comp.discoForm.get('artistId').value).toBe('mayday');

    comp.addAlbumRow('ep');
    comp.getSectionAlbumIds('ep').at(0).setValue('ep-album');

    expect(comp.canRevert()).toBe(true);

    comp.revert();

    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['first-album']);
    expect(comp.getSectionAlbumIds('ep').getRawValue()).toEqual([]);
  });

  it('saves valid advanced JSON edits and normalizes the structured editor', () => {
    loadAlbums();
    comp.readonly.setValue(false);
    comp.outputForm.setValue(
      JSON.stringify({
        id: 'json-artist',
        sections: [
          {
            type: 'compilation',
            albums: [{ id: 'compilation-album' }],
          },
        ],
      }),
    );
    comp.outputForm.markAsDirty();

    comp.save();

    const expectedDiscography: Discography = {
      id: 'json-artist',
      sections: [
        {
          type: 'studio',
          albums: [],
        },
        {
          type: 'compilation',
          albums: [toMetadata(albums[2])],
        },
        {
          type: 'ep',
          albums: [],
        },
        {
          type: 'other',
          albums: [],
        },
      ],
    };

    expect(adminService.setDiscography).toHaveBeenCalledWith('json-artist', expectedDiscography);
    expect(comp.response).toBe('Discography saved!');
    expect(comp.readonly.value).toBe(true);
    expect(comp.discoForm.get('artistId').value).toBe('json-artist');
    expect(comp.getSectionAlbumIds('compilation').getRawValue()).toEqual(['compilation-album']);
    expect(comp.hasUnsavedChanges()).toBe(false);
    expect(comp.canSave()).toBe(false);
  });

  it('reports save failures and keeps unsaved edits available', () => {
    adminService.setDiscography.mockReturnValue(throwError(() => new Error('permission denied')));
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(0).setValue('first-album');

    comp.save();

    expect(adminService.setDiscography).toHaveBeenCalled();
    expect(comp.response).toBe('Discography save failed: permission denied');
    expect(comp.discoForm.enabled).toBe(true);
    expect(comp.searchDisabled).toBe(false);
    expect(comp.hasUnsavedChanges()).toBe(true);
    expect(comp.canSave()).toBe(true);
  });

  it('moves and removes album rows within a section', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'studio',
            albums: [toMetadata(albums[0]), toMetadata(albums[1])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.searchDiscography();

    comp.moveAlbumRow('studio', 1, -1);
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['ep-album', 'first-album']);

    comp.removeAlbumRow('studio', 1);
    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['ep-album']);
    expect(comp.createFormDiscography().sections[0].albums).toEqual([toMetadata(albums[1])]);
  });

  it('keeps icon-only album row controls labelled and tooled', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'studio',
            albums: [toMetadata(albums[0]), toMetadata(albums[1])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.searchDiscography();
    fixture.detectChanges();

    const controls = fixture.debugElement.queryAll(By.css('.album-row button')).slice(0, 3);
    const labels = controls.map(control => control.attributes['aria-label']);
    const tooltipMessages = controls.map(control => control.injector.get(MatTooltip).message);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.album-row select');

    expect(labels).toEqual(['Move album up', 'Move album down', 'Remove album']);
    expect(tooltipMessages).toEqual(['Move up', 'Move down', 'Remove']);
    expect(select.getAttribute('aria-label')).toBe('Studio Albums album 1');
  });

  it('prevents duplicate album selection across sections', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'studio',
            albums: [toMetadata(albums[0])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.searchDiscography();

    comp.addAlbumRow('ep');
    expect(comp.isAlbumOptionDisabled('first-album', 2, 0)).toBe(true);

    comp.getSectionAlbumIds('ep').at(0).setValue('first-album');

    expect(comp.getSectionAlbumIds('ep').at(0).value).toBe('');
    expect(comp.createFormDiscography().sections[0].albums).toEqual([toMetadata(albums[0])]);
    expect(comp.createFormDiscography().sections[2].albums).toEqual([]);
  });

  it('clears and reverts section edits', () => {
    adminService.getDiscography.mockReturnValue(
      of({
        id: 'mayday',
        sections: [
          {
            type: 'studio',
            albums: [toMetadata(albums[0])],
          },
        ],
      }),
    );
    loadAlbums();
    comp.discoForm.get('artistId').setValue('mayday');
    comp.searchDiscography();

    expect(comp.hasUnsavedChanges()).toBe(false);

    comp.addAlbumRow('studio');
    comp.getSectionAlbumIds('studio').at(1).setValue('ep-album');

    expect(comp.hasUnsavedChanges()).toBe(true);
    expect(comp.canRevert()).toBe(true);

    comp.revert();

    expect(comp.getSectionAlbumIds('studio').getRawValue()).toEqual(['first-album']);
    expect(comp.hasUnsavedChanges()).toBe(false);

    comp.clear();

    expect(comp.discoForm.get('artistId').value).toBe('');
    expect(comp.sectionTypes.every(type => comp.getSectionAlbumIds(type).length === 0)).toBe(true);
    expect(comp.hideOutput).toBe(true);
    expect(comp.canRevert()).toBe(false);
  });

  function loadAlbums() {
    albumsSubject.next(albums);
    fixture.detectChanges();
  }

  function createAlbum(
    id: string,
    zht: string,
    english: string,
    releaseDate: string,
    disabled: boolean = false,
  ): Album {
    return {
      id,
      type: 'studio',
      disabled,
      releaseDate,
      title: {
        chinese: {
          zht,
          zhp: `${id} zhp`,
          eng: `${id} eng`,
        },
        english,
      },
      songs: {},
    };
  }

  function toMetadata(album: Album): AlbumMetadata {
    return {
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      disabled: album.disabled,
    };
  }
});
