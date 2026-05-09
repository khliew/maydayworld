import { describe, expect, it } from 'vitest';
import { INVALID_LINE_FALLBACK_TEXT } from './line';
import { parseFirestoreSong, validateFirestoreSong } from './song';

describe('Firestore song validation', () => {
  it('keeps valid song data in the persisted line shape', () => {
    const result = validateFirestoreSong({
      id: 'song-id',
      disabled: true,
      title: {
        chinese: { zht: '倔強', zhp: 'jue jiang', eng: 'Stubborn' },
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

    expect(result.diagnostics).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.song))).toEqual({
      id: 'song-id',
      disabled: true,
      title: {
        chinese: { zht: '倔強', zhp: 'jue jiang', eng: 'Stubborn' },
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
  });

  it('repairs malformed Firestore lyric rows with a text fallback', () => {
    const result = validateFirestoreSong({
      id: 'song-id',
      title: {
        chinese: { zht: '倔強', zhp: 'jue jiang', eng: 'Stubborn' },
        english: 'Stubborn',
      },
      lyrics: [
        {
          type: 'lyric',
          zht: '我和我最後的倔強',
          eng: 'Me and my last stubbornness',
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        path: 'lyrics[0].zhp',
        message: 'zhp must be a string. Replaced with fallback text.',
        repaired: true,
      },
    ]);
    expect(result.song.lyrics).toEqual([{ type: 'text', text: INVALID_LINE_FALLBACK_TEXT }]);
  });

  it('rejects Firestore song documents with invalid required title data', () => {
    const result = validateFirestoreSong(
      {
        lyrics: [],
        title: {
          chinese: { zht: '倔強', eng: 'Stubborn' },
        },
      },
      'song-id',
    );

    expect(result.song).toBeNull();
    expect(result.diagnostics).toContainEqual({
      path: 'id',
      message: 'Song ID is missing; using the Firestore document ID.',
      repaired: true,
    });
    expect(result.diagnostics).toContainEqual({
      path: 'title.chinese.zhp',
      message: 'zhp must be a string.',
    });
    expect(result.diagnostics).toContainEqual({
      path: 'title.english',
      message: 'english must be a string.',
    });
  });

  it('throws a detailed error when parsing an invalid Firestore song document', () => {
    expect(() => parseFirestoreSong({ id: 'song-id', lyrics: [] }, 'song-id')).toThrow(
      'Invalid song document song-id: title: Title must be an object.',
    );
  });
});
