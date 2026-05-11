import { AlbumType, isSupportedAlbumType } from '../../model';

export interface ParsedDiscographySection {
  type: AlbumType;
  albumIds: string[];
}

export interface ParsedDiscographyAlbum {
  id: string;
  lineNumber: number;
}

export interface ParsedDiscographySectionDetail {
  type: AlbumType;
  lineNumber: number;
  albums: ParsedDiscographyAlbum[];
}

export interface SectionsParseDiagnostic {
  lineNumber: number;
  message: string;
}

export interface SectionsParseResult {
  sections: ParsedDiscographySection[];
  sectionDetails: ParsedDiscographySectionDetail[];
  diagnostics: SectionsParseDiagnostic[];
}

export interface SectionsParseOptions {
  knownAlbumIds?: ReadonlySet<string>;
  rejectDuplicateAlbumIds?: boolean;
  rejectDuplicateSectionTypes?: boolean;
}

export class SectionsParser {
  parse(input: string): ParsedDiscographySection[] {
    return this.parseWithDiagnostics(input).sections;
  }

  parseWithDiagnostics(input: string, options: SectionsParseOptions = {}): SectionsParseResult {
    const lines = this.normalizeLineEndings(input || '').split('\n');
    const sections: ParsedDiscographySection[] = [];
    const sectionDetails: ParsedDiscographySectionDetail[] = [];
    const diagnostics: SectionsParseDiagnostic[] = [];
    const seenAlbumIds = new Set<string>();
    const seenSectionTypes = new Set<AlbumType>();
    let index = 0;

    while (index < lines.length) {
      const token = lines[index].trim();

      if (!token) {
        index++;
        continue;
      }

      if (token !== 'S') {
        diagnostics.push({
          lineNumber: index + 1,
          message: `Unexpected token "${token}". Expected "S".`,
        });
        index++;
        continue;
      }

      const result = this.parseSection(lines, index);
      diagnostics.push(...result.diagnostics);

      if (result.section && result.sectionDetail) {
        this.validateSection(result.sectionDetail, options, seenAlbumIds, seenSectionTypes).forEach(
          diagnostic => diagnostics.push(diagnostic),
        );
        sections.push(result.section);
        sectionDetails.push(result.sectionDetail);
      }

      index = result.nextIndex;
    }

    return { sections, sectionDetails, diagnostics };
  }

  private parseSection(
    lines: string[],
    startIndex: number,
  ): {
    section: ParsedDiscographySection | null;
    sectionDetail: ParsedDiscographySectionDetail | null;
    diagnostics: SectionsParseDiagnostic[];
    nextIndex: number;
  } {
    const diagnostics: SectionsParseDiagnostic[] = [];
    let index = startIndex + 1;
    const typeLineNumber = index + 1;
    const rawType = (lines[index] || '').trim();

    if (!rawType) {
      diagnostics.push({
        lineNumber: startIndex + 1,
        message: 'Section block is missing a section type.',
      });
      return { section: null, sectionDetail: null, diagnostics, nextIndex: index + 1 };
    }

    index++;
    const albums: ParsedDiscographyAlbum[] = [];

    while (index < lines.length) {
      const value = lines[index].trim();

      if (!value) {
        index++;
        break;
      }

      if (value === 'S') {
        diagnostics.push({
          lineNumber: index + 1,
          message: 'Section blocks must be separated by a blank line.',
        });
        break;
      }

      albums.push({
        id: value,
        lineNumber: index + 1,
      });
      index++;
    }

    if (!isSupportedAlbumType(rawType)) {
      diagnostics.push({
        lineNumber: typeLineNumber,
        message: `Unsupported section type "${rawType}".`,
      });
      return { section: null, sectionDetail: null, diagnostics, nextIndex: index };
    }

    return {
      section: {
        type: rawType,
        albumIds: albums.map(album => album.id),
      },
      sectionDetail: {
        type: rawType,
        lineNumber: typeLineNumber,
        albums,
      },
      diagnostics,
      nextIndex: index,
    };
  }

  private validateSection(
    section: ParsedDiscographySectionDetail,
    options: SectionsParseOptions,
    seenAlbumIds: Set<string>,
    seenSectionTypes: Set<AlbumType>,
  ): SectionsParseDiagnostic[] {
    const diagnostics: SectionsParseDiagnostic[] = [];

    if (options.rejectDuplicateSectionTypes) {
      if (seenSectionTypes.has(section.type)) {
        diagnostics.push({
          lineNumber: section.lineNumber,
          message: `Duplicate section type "${section.type}".`,
        });
      } else {
        seenSectionTypes.add(section.type);
      }
    }

    section.albums.forEach(album => {
      if (options.knownAlbumIds && !options.knownAlbumIds.has(album.id)) {
        diagnostics.push({
          lineNumber: album.lineNumber,
          message: `Unknown album ID "${album.id}".`,
        });
      }

      if (options.rejectDuplicateAlbumIds) {
        if (seenAlbumIds.has(album.id)) {
          diagnostics.push({
            lineNumber: album.lineNumber,
            message: `Duplicate album ID "${album.id}".`,
          });
        } else {
          seenAlbumIds.add(album.id);
        }
      }
    });

    return diagnostics;
  }

  private normalizeLineEndings(input: string): string {
    return input.replace(/\r\n?/g, '\n');
  }
}
