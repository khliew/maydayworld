import { beforeEach, describe, expect, it } from 'vitest';
import { LyricsImporter } from './lyrics-importer';

describe('LyricsImporter', () => {
  let importer: LyricsImporter;

  beforeEach(() => {
    importer = new LyricsImporter();
  });

  it('imports structured TSV rows with lyric, break, and text line types', () => {
    const result = importer.parse(
      [
        'type\tzht\tzhp\teng\ttext',
        'lyric\t然後呢\tran hou ne\tAnd then?\t',
        'break\t\t\t\t',
        'text\t\t\t\tTranslator note',
      ].join('\n'),
      { mode: 'structured' },
    );

    expect(result.delimiter).toBe('tab');
    expect(result.diagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      {
        type: 'lyric',
        zht: '然後呢',
        zhp: 'ran hou ne',
        eng: 'And then?',
      },
      { type: 'break' },
      { type: 'text', text: 'Translator note' },
    ]);
  });

  it('imports structured CSV rows with quoted commas', () => {
    const result = importer.parse(
      [
        'type,zht,zhp,eng,text',
        'lyric,突然好想你,tu ran hao xiang ni,"Suddenly, I miss you so much",',
        'text,,,,"Translator note, second sentence"',
      ].join('\n'),
      { mode: 'structured' },
    );

    expect(result.delimiter).toBe('comma');
    expect(result.diagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      {
        type: 'lyric',
        zht: '突然好想你',
        zhp: 'tu ran hao xiang ni',
        eng: 'Suddenly, I miss you so much',
      },
      { type: 'text', text: 'Translator note, second sentence' },
    ]);
  });

  it('imports simple three-column lyric rows', () => {
    const result = importer.parse(
      [
        '倔強\tjue jiang\tStubborn',
        '我和我最後的倔強\two he wo zui hou de jue jiang\tMe and my last stubbornness',
      ].join('\n'),
      { mode: 'three-column' },
    );

    expect(result.diagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      {
        type: 'lyric',
        zht: '倔強',
        zhp: 'jue jiang',
        eng: 'Stubborn',
      },
      {
        type: 'lyric',
        zht: '我和我最後的倔強',
        zhp: 'wo he wo zui hou de jue jiang',
        eng: 'Me and my last stubbornness',
      },
    ]);
  });

  it('turns blank spreadsheet rows into breaks when enabled', () => {
    const result = importer.parse(
      ['倔強,jue jiang,Stubborn', '', '然後呢,ran hou ne,And then?'].join('\n'),
      {
        mode: 'three-column',
        blankRowsAsBreaks: true,
      },
    );

    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      {
        type: 'lyric',
        zht: '倔強',
        zhp: 'jue jiang',
        eng: 'Stubborn',
      },
      { type: 'break' },
      {
        type: 'lyric',
        zht: '然後呢',
        zhp: 'ran hou ne',
        eng: 'And then?',
      },
    ]);
  });

  it('skips blank spreadsheet rows when breaks are disabled', () => {
    const result = importer.parse(
      ['倔強,jue jiang,Stubborn', '', '然後呢,ran hou ne,And then?'].join('\n'),
      {
        mode: 'three-column',
        blankRowsAsBreaks: false,
      },
    );

    expect(result.lines.map(line => line.type)).toEqual(['lyric', 'lyric']);
  });

  it('reports row-level field errors without returning invalid rows', () => {
    const result = importer.parse(
      ['type,zht,zhp,eng,text', 'lyric,倔強,,Stubborn,', 'text,,,English in wrong field,'].join(
        '\n',
      ),
      { mode: 'structured' },
    );

    expect(result.diagnostics).toEqual([
      {
        rowNumber: 2,
        field: 'zhp',
        message: 'zhp is required.',
      },
      {
        rowNumber: 3,
        field: 'text',
        message: 'text is required.',
      },
      {
        rowNumber: 3,
        field: 'eng',
        message: 'Text rows cannot include eng.',
      },
    ]);
    expect(result.lines).toEqual([]);
  });

  it('reports invalid simple three-column rows with row numbers and field names', () => {
    const result = importer.parse(
      ['倔強,,Stubborn', '然後呢,ran hou ne,And then?,extra'].join('\n'),
      {
        mode: 'three-column',
      },
    );

    expect(result.diagnostics).toEqual([
      {
        rowNumber: 1,
        field: 'zhp',
        message: 'zhp is required.',
      },
      {
        rowNumber: 2,
        field: 'columns',
        message: 'Unexpected extra columns. Use structured mode for type or text rows.',
      },
    ]);
    expect(result.lines).toEqual([]);
  });
});
