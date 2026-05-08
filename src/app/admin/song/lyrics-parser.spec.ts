import { beforeEach, describe, expect, it } from 'vitest';
import { LyricsParser } from './lyrics-parser';

describe('LyricsParser', () => {
  let parser: LyricsParser;

  beforeEach(() => {
    parser = new LyricsParser();
  });

  it('parses valid lyrics into the existing line shape', () => {
    const input = [
      'L',
      '然後呢',
      'ran hou ne',
      'And then?',
      '',
      'B',
      '',
      'T',
      'Translator note',
    ].join('\n');

    const result = parser.parseWithDiagnostics(input);

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
    expect(parser.parse(input)).toEqual(result.lines);
  });

  it('reports incomplete lyric blocks', () => {
    const result = parser.parseWithDiagnostics(['L', '然後呢', 'ran hou ne'].join('\n'));

    expect(result.diagnostics).toEqual([
      {
        lineNumber: 1,
        message: 'Lyric block is missing English translation.',
      },
    ]);
    expect(result.lines[0].eng).toBe('');
  });

  it('reports text blocks with missing note text', () => {
    const result = parser.parseWithDiagnostics(['T', '', 'B'].join('\n'));

    expect(result.diagnostics).toEqual([
      {
        lineNumber: 2,
        message: 'Text block is missing note text.',
      },
    ]);
    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      { type: 'text', text: '' },
      { type: 'break' },
    ]);
  });

  it('reports unknown control tokens', () => {
    const result = parser.parseWithDiagnostics(
      ['X', 'L', '然後呢', 'ran hou ne', 'And then?'].join('\n'),
    );

    expect(result.diagnostics).toEqual([
      {
        lineNumber: 1,
        message: 'Unknown control token "X". Expected L, B, or T.',
      },
    ]);
  });

  it('ignores blank lines between blocks', () => {
    const result = parser.parseWithDiagnostics(
      [
        '',
        '',
        'L',
        '他們說你的心',
        'ta men shuo ni de xin',
        'They said that your heart',
        '',
        '',
        'B',
        '',
      ].join('\n'),
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.lines.map(line => line.type)).toEqual(['lyric', 'break']);
  });

  it('normalizes line endings and trims trailing whitespace', () => {
    const input = [
      'L   ',
      '然後呢   ',
      'ran hou ne\t',
      'And then?   ',
      'T\t',
      'Translator note   ',
    ].join('\r\n');

    const result = parser.parseWithDiagnostics(input);

    expect(result.diagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.lines))).toEqual([
      {
        type: 'lyric',
        zht: '然後呢',
        zhp: 'ran hou ne',
        eng: 'And then?',
      },
      { type: 'text', text: 'Translator note' },
    ]);
  });
});
