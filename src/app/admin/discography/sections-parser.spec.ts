import { describe, expect, it } from 'vitest';
import { SectionsParser } from './sections-parser';

describe('SectionsParser', () => {
  it('keeps the legacy token import format while returning typed sections', () => {
    const parser = new SectionsParser();

    expect(
      parser.parse(['S', 'studio', 'first-album', 'second-album', '', 'S', 'ep'].join('\n')),
    ).toEqual([
      {
        type: 'studio',
        albumIds: ['first-album', 'second-album'],
      },
      {
        type: 'ep',
        albumIds: [],
      },
    ]);
  });

  it('reports unsupported section types with line numbers', () => {
    const parser = new SectionsParser();

    const result = parser.parseWithDiagnostics(['S', 'live', 'live-album'].join('\n'));

    expect(result.sections).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        lineNumber: 2,
        message: 'Unsupported section type "live".',
      },
    ]);
  });

  it('reports album and section import diagnostics with line numbers', () => {
    const parser = new SectionsParser();

    const result = parser.parseWithDiagnostics(
      ['S', 'studio', 'first-album', 'missing-album', '', 'S', 'studio', 'first-album'].join('\n'),
      {
        knownAlbumIds: new Set(['first-album']),
        rejectDuplicateAlbumIds: true,
        rejectDuplicateSectionTypes: true,
      },
    );

    expect(result.sections).toEqual([
      {
        type: 'studio',
        albumIds: ['first-album', 'missing-album'],
      },
      {
        type: 'studio',
        albumIds: ['first-album'],
      },
    ]);
    expect(result.sectionDetails[0].albums).toEqual([
      {
        id: 'first-album',
        lineNumber: 3,
      },
      {
        id: 'missing-album',
        lineNumber: 4,
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        lineNumber: 4,
        message: 'Unknown album ID "missing-album".',
      },
      {
        lineNumber: 7,
        message: 'Duplicate section type "studio".',
      },
      {
        lineNumber: 8,
        message: 'Duplicate album ID "first-album".',
      },
    ]);
  });

  it('reports malformed section blocks', () => {
    const parser = new SectionsParser();

    const result = parser.parseWithDiagnostics(['first-album', 'S', '', 'S', 'ep', 'S'].join('\n'));

    expect(result.sections).toEqual([
      {
        type: 'ep',
        albumIds: [],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        lineNumber: 1,
        message: 'Unexpected token "first-album". Expected "S".',
      },
      {
        lineNumber: 2,
        message: 'Section block is missing a section type.',
      },
      {
        lineNumber: 6,
        message: 'Section blocks must be separated by a blank line.',
      },
      {
        lineNumber: 6,
        message: 'Section block is missing a section type.',
      },
    ]);
  });
});
