import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  Album,
  ALBUM_TYPE_LABELS,
  AlbumMetadata,
  AlbumType,
  Discography,
  isSupportedAlbumType,
  Section,
  SUPPORTED_ALBUM_TYPES,
} from '../../model';
import { AdminService } from '../admin.service';
import {
  ParsedDiscographySection,
  ParsedDiscographySectionDetail,
  SectionsParseDiagnostic,
  SectionsParser,
  SectionsParseResult,
} from './sections-parser';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!hasTrimmedValue(value)) {
    return { required: true };
  }

  return null;
}

function hasTrimmedValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

interface SectionsImportPreviewAlbum {
  id: string;
  lineNumber: number;
  metadata: AlbumMetadata | null;
}

interface SectionsImportPreviewSection {
  type: AlbumType;
  albums: SectionsImportPreviewAlbum[];
}

@Component({
  selector: 'app-discography-creator',
  templateUrl: './discography-creator.component.html',
  styleUrls: ['./discography-creator.component.css'],
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatCheckbox,
    MatButton,
    DatePipe,
    RouterLink,
  ],
})
export class DiscographyCreatorComponent implements AfterViewInit, OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  sectionsForm: FormArray = this.fb.array([]);
  discoForm = this.fb.group({
    artistId: ['', trimmedRequired],
    sections: this.sectionsForm,
  });
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);
  sectionsImport = this.fb.control('');

  readonly sectionTypes = SUPPORTED_ALBUM_TYPES;
  readonly albumTypeLabels = ALBUM_TYPE_LABELS;

  @ViewChild('artistId', { static: false }) artistIdEl: ElementRef;

  albums: Album[];
  hideOutput: boolean;
  output: Discography;
  previewDiscography: Discography;
  previewSections: Section[];
  buttonsDisabled: boolean;

  searchDisabled: boolean;
  searchError: string;
  response: string;
  jsonValidationErrors: string[];
  showSectionsImport: boolean;
  sectionsImportResult: SectionsParseResult;
  sectionsImportPreviewSections: SectionsImportPreviewSection[];

  private originalDiscography: Discography | null;
  private albumMetadataById: Map<string, AlbumMetadata>;
  private albumsLoaded: boolean;
  private sectionsParser: SectionsParser;

  constructor() {
    this.albums = [];
    this.hideOutput = true;
    this.previewDiscography = { id: '', sections: [] };
    this.previewSections = [];
    this.buttonsDisabled = false;

    this.searchDisabled = true;
    this.searchError = '';
    this.response = '';
    this.jsonValidationErrors = [];
    this.showSectionsImport = false;
    this.sectionsImportResult = this.createEmptySectionsImportResult();
    this.sectionsImportPreviewSections = [];
    this.originalDiscography = null;
    this.albumMetadataById = new Map<string, AlbumMetadata>();
    this.albumsLoaded = false;
    this.sectionsParser = new SectionsParser();

    this.setSectionForms();
    this.updatePreviewDiscography();

    this.discoForm.valueChanges.subscribe(() => {
      this.syncGeneratedJson();
    });

    this.outputForm.valueChanges.subscribe(value => {
      if (!this.readonly.value) {
        this.validateAdvancedJson(value || '');
      }
    });

    this.readonly.valueChanges.subscribe(() => {
      this.syncGeneratedJson();
      this.validateAdvancedJson();
    });
  }

  ngOnInit() {
    this.setFormsEnabled(false);
    this.adminService.getAlbums().subscribe({
      next: albums => {
        this.setAlbums(albums || []);
        this.albumsLoaded = true;
        this.setFormsEnabled(true);
        this.searchDisabled = false;
        this.previewSectionsImport();
        this.syncGeneratedJson();
      },
      error: err => {
        this.searchDisabled = true;
        this.searchError = `Album lookup failed: ${this.formatError(err)}`;
      },
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.artistIdEl.nativeElement.focus(), 10);
  }

  searchDiscography() {
    if (!this.albumsLoaded) {
      return;
    }

    this.hideOutput = true;
    const artistId = (this.discoForm.get('artistId').value || '').trim();

    if (!!artistId) {
      this.response = '';
      this.searchError = '';
      this.searchDisabled = true;

      this.adminService.getDiscography(artistId).subscribe({
        next: disco => {
          this.searchDisabled = false;

          if (disco) {
            this.fillForm(disco);
          } else {
            this.searchError = `Discography not found: ${artistId}`;
          }
        },
        error: err => {
          this.searchDisabled = false;
          this.searchError = this.createDiscographySearchError(artistId, err);
        },
      });
    }
  }

  fillForm(discography: Discography) {
    this.originalDiscography = this.cloneDiscography(discography);
    this.applyDiscographyToForm(discography);
  }

  createFormDiscography(): Discography {
    const discography = new Discography();
    discography.id = (this.discoForm.getRawValue().artistId || '').trim();
    discography.sections = this.sectionTypes.map((type, index) => {
      const section = new Section();
      section.type = type;
      section.albums = this.getSectionAlbumIds(index)
        .getRawValue()
        .map(albumId => this.albumMetadataById.get(albumId))
        .filter((album): album is AlbumMetadata => !!album);
      return section;
    });
    return discography;
  }

  generateJson() {
    this.syncGeneratedJson(true);
    this.hideOutput = false;
    this.searchError = '';
    this.response = '';
  }

  clear() {
    this.discoForm.get('artistId').reset('', { emitEvent: false });
    this.setSectionForms();
    this.originalDiscography = null;
    this.hideOutput = true;
    this.readonly.setValue(true, { emitEvent: false });
    this.outputForm.setValue('', { emitEvent: false });
    this.jsonValidationErrors = [];
    this.sectionsImport.reset('', { emitEvent: false });
    this.sectionsImportResult = this.createEmptySectionsImportResult();
    this.sectionsImportPreviewSections = [];
    this.showSectionsImport = false;
    this.searchError = '';
    this.response = '';
    this.updatePreviewDiscography();
    this.markEditorPristine();
  }

  revert() {
    if (!this.originalDiscography) {
      return;
    }

    this.applyDiscographyToForm(this.originalDiscography);
  }

  canRevert(): boolean {
    return !!this.originalDiscography && this.hasUnsavedChanges();
  }

  hasUnsavedChanges(): boolean {
    return this.discoForm.dirty;
  }

  canSave(): boolean {
    if (!this.readonly.value) {
      return (
        this.albumsLoaded &&
        !this.buttonsDisabled &&
        this.discoForm.enabled &&
        this.jsonValidationErrors.length === 0 &&
        hasTrimmedValue(this.outputForm.value) &&
        this.outputForm.dirty
      );
    }

    return (
      this.albumsLoaded &&
      !this.buttonsDisabled &&
      this.discoForm.enabled &&
      this.discoForm.valid &&
      this.hasUnsavedChanges()
    );
  }

  save() {
    if (!this.readonly.value) {
      this.saveAdvancedJson();
      return;
    }

    this.discoForm.markAllAsTouched();
    this.sectionsForm.updateValueAndValidity();

    if (!this.discoForm.valid) {
      this.response = 'Fix required discography fields before saving.';
      return;
    }

    if (!this.hasUnsavedChanges()) {
      this.response = 'No discography changes to save.';
      return;
    }

    const discography = this.createFormDiscography();
    this.response = '';
    this.buttonsDisabled = true;
    this.searchDisabled = true;
    this.setFormsEnabled(false);

    this.adminService.setDiscography(discography.id, discography).subscribe({
      next: () => {
        this.handleSaveSuccess(discography);
      },
      error: err => {
        this.handleSaveFailure(err);
      },
    });
  }

  canApplyAdvancedJson(): boolean {
    return (
      !this.readonly.value &&
      this.discoForm.enabled &&
      this.jsonValidationErrors.length === 0 &&
      hasTrimmedValue(this.outputForm.value)
    );
  }

  applyAdvancedJson() {
    const result = this.validateAdvancedJson();

    if (result.errors.length > 0) {
      this.response = 'Fix advanced JSON errors before applying.';
      return;
    }

    this.readonly.setValue(true, { emitEvent: false });
    this.jsonValidationErrors = [];
    this.applyDiscographyToForm(result.discography, false);
    this.response = 'Advanced JSON applied.';
  }

  toggleSectionsImport() {
    this.showSectionsImport = !this.showSectionsImport;

    if (this.showSectionsImport) {
      this.previewSectionsImport();
    }
  }

  get sectionsImportDiagnostics(): SectionsParseDiagnostic[] {
    return this.sectionsImportResult.diagnostics;
  }

  previewSectionsImport(): SectionsParseResult {
    this.sectionsImportResult = this.sectionsParser.parseWithDiagnostics(
      this.sectionsImport.value || '',
      {
        knownAlbumIds: new Set(this.albumMetadataById.keys()),
        rejectDuplicateAlbumIds: true,
        rejectDuplicateSectionTypes: true,
      },
    );
    this.sectionsImportPreviewSections = this.createSectionsImportPreview(
      this.sectionsImportResult.sectionDetails,
    );
    return this.sectionsImportResult;
  }

  canApplySectionsImport(): boolean {
    return (
      this.discoForm.enabled &&
      this.sectionsImportResult.diagnostics.length === 0 &&
      this.sectionsImportResult.sections.length > 0
    );
  }

  applySectionsImport() {
    const result = this.previewSectionsImport();

    if (result.diagnostics.length > 0) {
      this.response = 'Fix import diagnostics before applying.';
      return;
    }

    if (result.sections.length === 0) {
      this.response = 'Paste at least one section block before applying.';
      return;
    }

    const importedAlbumCount = result.sections.reduce(
      (count, section) => count + section.albumIds.length,
      0,
    );

    this.applyDiscographyToForm(this.createDiscographyFromParsedSections(result.sections), false);
    this.showSectionsImport = false;
    this.response = `Imported ${importedAlbumCount} album${
      importedAlbumCount === 1 ? '' : 's'
    } into ${result.sections.length} section${result.sections.length === 1 ? '' : 's'}.`;
  }

  validateAdvancedJson(value: string = this.outputForm.value || ''): {
    discography: Discography | null;
    errors: string[];
  } {
    const result = this.parseAdvancedJson(value);
    this.jsonValidationErrors = result.errors;
    return result;
  }

  addAlbumRow(section: number | AlbumType) {
    if (this.discoForm.disabled) {
      return;
    }

    this.getSectionAlbumIds(section).push(this.createAlbumIdControl(''));
    this.markSectionsChanged();
  }

  removeAlbumRow(section: number | AlbumType, albumIndex: number) {
    if (this.discoForm.disabled) {
      return;
    }

    const albumIds = this.getSectionAlbumIds(section);
    if (albumIndex < 0 || albumIndex >= albumIds.length) {
      return;
    }

    albumIds.removeAt(albumIndex);
    this.markSectionsChanged();
  }

  moveAlbumRow(section: number | AlbumType, albumIndex: number, direction: -1 | 1) {
    if (this.discoForm.disabled) {
      return;
    }

    const albumIds = this.getSectionAlbumIds(section);
    const nextIndex = albumIndex + direction;

    if (albumIndex < 0 || nextIndex < 0 || albumIndex >= albumIds.length) {
      return;
    }

    if (nextIndex >= albumIds.length) {
      return;
    }

    const control = albumIds.at(albumIndex);
    albumIds.removeAt(albumIndex);
    albumIds.insert(nextIndex, control);
    this.markSectionsChanged();
  }

  isAlbumOptionDisabled(albumId: string, sectionIndex: number, albumIndex: number): boolean {
    const control = this.getSectionAlbumIds(sectionIndex).at(albumIndex);
    return (
      !!albumId && control?.value !== albumId && this.isAlbumIdSelectedElsewhere(albumId, control)
    );
  }

  getSectionAlbumIds(section: number | AlbumType): FormArray {
    const sectionIndex =
      typeof section === 'number' ? section : this.sectionTypes.findIndex(type => type === section);
    return this.sectionsForm.at(sectionIndex).get('albumIds') as FormArray;
  }

  getSectionType(index: number): AlbumType {
    return this.sectionsForm.at(index).get('type').value as AlbumType;
  }

  getSectionLabel(type: AlbumType): string {
    return this.albumTypeLabels[type];
  }

  getAlbumMetadata(albumId: string): AlbumMetadata {
    return this.albumMetadataById.get(albumId);
  }

  private applyDiscographyToForm(discography: Discography, markPristine: boolean = true) {
    this.discoForm.get('artistId').setValue(discography.id || this.discoForm.get('artistId').value);
    this.setSectionForms(discography);
    this.generateJson();
    this.hideOutput = false;
    this.searchError = '';

    if (markPristine) {
      this.markEditorPristine();
    } else {
      this.markSectionsChanged();
    }
  }

  private saveAdvancedJson() {
    const result = this.validateAdvancedJson();

    if (result.errors.length > 0) {
      this.response = 'Fix advanced JSON errors before saving.';
      return;
    }

    const discography = result.discography;
    this.response = '';
    this.buttonsDisabled = true;
    this.searchDisabled = true;
    this.setFormsEnabled(false);

    this.adminService.setDiscography(discography.id, discography).subscribe({
      next: () => {
        this.readonly.setValue(true, { emitEvent: false });
        this.jsonValidationErrors = [];
        this.handleSaveSuccess(discography);
      },
      error: err => {
        this.handleSaveFailure(err);
      },
    });
  }

  private handleSaveSuccess(discography: Discography) {
    this.buttonsDisabled = false;
    this.setFormsEnabled(true);
    this.searchDisabled = false;
    this.originalDiscography = this.cloneDiscography(discography);
    this.applyDiscographyToForm(discography);
    this.outputForm.markAsPristine();
    this.response = 'Discography saved!';
  }

  private handleSaveFailure(err: any) {
    this.buttonsDisabled = false;
    this.setFormsEnabled(true);
    this.searchDisabled = false;
    this.response = `Discography save failed: ${this.formatError(err)}`;
  }

  private setFormsEnabled(enabled: boolean) {
    if (enabled) {
      this.discoForm.enable({ emitEvent: false });
      this.sectionsImport.enable({ emitEvent: false });
    } else {
      this.discoForm.disable({ emitEvent: false });
      this.sectionsImport.disable({ emitEvent: false });
    }
  }

  private setAlbums(albums: Album[]) {
    this.albums = [...albums].sort((a, b) => a.id.localeCompare(b.id));
    this.albumMetadataById = new Map(
      this.albums.map(album => [album.id, this.createAlbumMetadata(album)]),
    );
  }

  private setSectionForms(discography?: Discography) {
    const albumIdsByType = this.createAlbumIdsByType(discography);

    this.sectionsForm.clear({ emitEvent: false });
    this.sectionTypes.forEach(type => {
      this.sectionsForm.push(
        this.fb.group({
          type: [type],
          albumIds: this.fb.array(
            (albumIdsByType.get(type) || []).map(albumId => this.createAlbumIdControl(albumId)),
          ),
        }),
        { emitEvent: false },
      );
    });

    this.sectionsForm.updateValueAndValidity();
  }

  private createAlbumIdsByType(discography?: Discography): Map<AlbumType, string[]> {
    const albumIdsByType = new Map<AlbumType, string[]>();

    if (!discography?.sections) {
      return albumIdsByType;
    }

    discography.sections.forEach(section => {
      if (!section || !isSupportedAlbumType(section.type)) {
        return;
      }

      albumIdsByType.set(
        section.type,
        (section.albums || []).map(album => album.id).filter(albumId => !!albumId),
      );
    });

    return albumIdsByType;
  }

  private createAlbumIdControl(albumId: string) {
    const control = this.fb.control(albumId, control => this.albumIdValidator(control));
    control.valueChanges.subscribe(value => {
      if (!value || !this.isAlbumIdSelectedElsewhere(value, control)) {
        return;
      }

      control.setValue('', { emitEvent: false });
      control.markAsDirty();
      this.markSectionsChanged();
    });
    return control;
  }

  private albumIdValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (typeof value !== 'string' || value.trim().length === 0) {
      return { required: true };
    }

    return this.albumMetadataById.has(value) ? null : { unknownAlbum: true };
  }

  private isAlbumIdSelectedElsewhere(albumId: string, controlToIgnore: any): boolean {
    return this.sectionsForm.controls.some(section => {
      const albumIds = section.get('albumIds') as FormArray;
      return albumIds.controls.some(
        control => control !== controlToIgnore && control.value === albumId,
      );
    });
  }

  private markSectionsChanged() {
    this.sectionsForm.markAsDirty();
    this.discoForm.markAsDirty();
    this.syncGeneratedJson(true);
  }

  private markEditorPristine() {
    this.sectionsForm.markAsPristine();
    this.discoForm.markAsPristine();
  }

  private createAlbumMetadata(album: Album): AlbumMetadata {
    return {
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      disabled: album.disabled,
    };
  }

  private syncGeneratedJson(force: boolean = false) {
    this.updatePreviewDiscography();

    if (!force && !this.readonly.value) {
      return;
    }

    this.output = this.previewDiscography;
    this.outputForm.setValue(JSON.stringify(this.output, null, 2), {
      emitEvent: false,
    });

    if (this.readonly.value) {
      this.jsonValidationErrors = [];
      this.outputForm.markAsPristine();
    }
  }

  private updatePreviewDiscography() {
    this.previewDiscography = this.createFormDiscography();
    this.previewSections = this.previewDiscography.sections.filter(
      section => section.albums.length > 0,
    );
  }

  private createDiscographySearchError(artistId: string, err: any): string {
    const message = this.formatError(err);

    if (message.toLowerCase().includes('discography not found')) {
      return `Discography not found: ${artistId}`;
    }

    return `Discography lookup failed: ${message}`;
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

  private cloneDiscography(discography: Discography): Discography {
    return JSON.parse(JSON.stringify(discography));
  }

  private createEmptySectionsImportResult(): SectionsParseResult {
    return {
      sections: [],
      sectionDetails: [],
      diagnostics: [],
    };
  }

  private createSectionsImportPreview(
    sections: ParsedDiscographySectionDetail[],
  ): SectionsImportPreviewSection[] {
    return sections.map(section => ({
      type: section.type,
      albums: section.albums.map(album => ({
        id: album.id,
        lineNumber: album.lineNumber,
        metadata: this.albumMetadataById.get(album.id) || null,
      })),
    }));
  }

  private createDiscographyFromParsedSections(
    parsedSections: ParsedDiscographySection[],
  ): Discography {
    const discography = new Discography();
    discography.id = (this.discoForm.getRawValue().artistId || '').trim();

    const albumIdsByType = new Map<AlbumType, string[]>();
    parsedSections.forEach(section => {
      albumIdsByType.set(section.type, section.albumIds);
    });

    discography.sections = this.sectionTypes.map(type => {
      const section = new Section();
      section.type = type;
      section.albums = (albumIdsByType.get(type) || [])
        .map(albumId => this.albumMetadataById.get(albumId))
        .filter((album): album is AlbumMetadata => !!album);
      return section;
    });

    return discography;
  }

  private parseAdvancedJson(value: string): { discography: Discography | null; errors: string[] } {
    if (!hasTrimmedValue(value)) {
      return { discography: null, errors: ['JSON is required.'] };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(value);
    } catch (err) {
      return { discography: null, errors: [`JSON parse failed: ${this.formatError(err)}`] };
    }

    const errors = this.validateDiscographyObject(parsed);
    return {
      discography: errors.length > 0 ? null : this.normalizeParsedDiscography(parsed),
      errors,
    };
  }

  private validateDiscographyObject(value: any): string[] {
    const errors: string[] = [];

    if (!this.isPlainObject(value)) {
      return ['JSON must be a discography object.'];
    }

    this.requireTrimmedString(value, 'id', 'Artist ID', errors);

    if (!Array.isArray(value.sections)) {
      errors.push('Sections must be an array.');
      return errors;
    }

    const seenSectionTypes = new Set<AlbumType>();
    const seenAlbumIds = new Set<string>();

    value.sections.forEach((section: any, sectionIndex: number) => {
      const sectionLabel = `Section ${sectionIndex + 1}`;

      if (!this.isPlainObject(section)) {
        errors.push(`${sectionLabel} must be an object.`);
        return;
      }

      if (!isSupportedAlbumType(section.type)) {
        errors.push(`${sectionLabel} has an unsupported type.`);
      } else if (seenSectionTypes.has(section.type)) {
        errors.push(`${sectionLabel} duplicates section type "${section.type}".`);
      } else {
        seenSectionTypes.add(section.type);
      }

      if (!Array.isArray(section.albums)) {
        errors.push(`${sectionLabel} albums must be an array.`);
        return;
      }

      section.albums.forEach((album: any, albumIndex: number) => {
        const albumLabel = `${sectionLabel} album ${albumIndex + 1}`;

        if (!this.isPlainObject(album)) {
          errors.push(`${albumLabel} must be an object.`);
          return;
        }

        if (!hasTrimmedValue(album.id)) {
          errors.push(`${albumLabel} ID is required.`);
          return;
        }

        const albumId = album.id.trim();
        if (!this.albumMetadataById.has(albumId)) {
          errors.push(`${albumLabel} uses unknown album ID "${albumId}".`);
          return;
        }

        if (seenAlbumIds.has(albumId)) {
          errors.push(`${albumLabel} duplicates album ID "${albumId}".`);
          return;
        }

        seenAlbumIds.add(albumId);
      });
    });

    return errors;
  }

  private normalizeParsedDiscography(value: any): Discography {
    const discography = new Discography();
    discography.id = value.id.trim();

    const albumIdsByType = new Map<AlbumType, string[]>();
    value.sections.forEach((section: any) => {
      if (!isSupportedAlbumType(section.type)) {
        return;
      }

      albumIdsByType.set(
        section.type,
        section.albums.map((album: any) => album.id.trim()),
      );
    });

    discography.sections = this.sectionTypes.map(type => {
      const section = new Section();
      section.type = type;
      section.albums = (albumIdsByType.get(type) || []).map(albumId =>
        this.albumMetadataById.get(albumId),
      );
      return section;
    });

    return discography;
  }

  private requireTrimmedString(value: any, key: string, label: string, errors: string[]) {
    if (!hasTrimmedValue(value?.[key])) {
      errors.push(`${label} is required.`);
    }
  }

  private isPlainObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
