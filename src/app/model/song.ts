import { Line, normalizeLine } from './line';
import { Title } from './title';

export class Song {
  id: string;
  title: Title;
  lyricist: string;
  composer: string;
  arranger: string;
  disabled?: boolean;
  lyrics: Line[];
}

export interface SongValidationDiagnostic {
  path: string;
  message: string;
  repaired?: boolean;
}

export interface SongValidationResult {
  song: Song | null;
  diagnostics: SongValidationDiagnostic[];
}

export function validateFirestoreSong(value: unknown, fallbackId?: string): SongValidationResult {
  const diagnostics: SongValidationDiagnostic[] = [];
  const fatalDiagnostics: SongValidationDiagnostic[] = [];

  if (!isPlainObject(value)) {
    addFatal(diagnostics, fatalDiagnostics, 'song', 'Song document must be an object.');
    return { song: null, diagnostics };
  }

  const id = readSongId(value, fallbackId, diagnostics, fatalDiagnostics);
  const title = readTitle(value.title, diagnostics, fatalDiagnostics);
  const disabled = readOptionalBoolean(value, 'disabled', false, diagnostics);
  const lyricist = readOptionalString(value, 'lyricist', diagnostics);
  const composer = readOptionalString(value, 'composer', diagnostics);
  const arranger = readOptionalString(value, 'arranger', diagnostics);
  const lyrics = readLyrics(value.lyrics, diagnostics);

  if (fatalDiagnostics.length > 0) {
    return { song: null, diagnostics };
  }

  const song = new Song();
  song.id = id;
  song.title = title;
  song.disabled = disabled;
  song.lyricist = lyricist;
  song.composer = composer;
  song.arranger = arranger;
  song.lyrics = lyrics;

  return { song, diagnostics };
}

export function parseFirestoreSong(value: unknown, fallbackId?: string): Song {
  const result = validateFirestoreSong(value, fallbackId);

  if (!result.song) {
    const details = result.diagnostics
      .map(diagnostic => `${diagnostic.path}: ${diagnostic.message}`)
      .join('; ');
    throw new Error(`Invalid song document${fallbackId ? ` ${fallbackId}` : ''}: ${details}`);
  }

  return result.song;
}

function readSongId(
  value: Record<string, unknown>,
  fallbackId: string,
  diagnostics: SongValidationDiagnostic[],
  fatalDiagnostics: SongValidationDiagnostic[],
): string {
  if (typeof value.id === 'string' && value.id.trim().length > 0) {
    return value.id;
  }

  if (fallbackId && fallbackId.trim().length > 0) {
    diagnostics.push({
      path: 'id',
      message: 'Song ID is missing; using the Firestore document ID.',
      repaired: true,
    });
    return fallbackId;
  }

  addFatal(diagnostics, fatalDiagnostics, 'id', 'Song ID is required.');
  return '';
}

function readTitle(
  value: unknown,
  diagnostics: SongValidationDiagnostic[],
  fatalDiagnostics: SongValidationDiagnostic[],
): Title {
  const title = new Title();
  title.chinese = { zht: '', zhp: '', eng: '' };
  title.english = '';

  if (!isPlainObject(value)) {
    addFatal(diagnostics, fatalDiagnostics, 'title', 'Title must be an object.');
    return title;
  }

  if (!isPlainObject(value.chinese)) {
    addFatal(diagnostics, fatalDiagnostics, 'title.chinese', 'Chinese title must be an object.');
  } else {
    title.chinese.zht = readRequiredString(
      value.chinese,
      'zht',
      'title.chinese.zht',
      diagnostics,
      fatalDiagnostics,
    );
    title.chinese.zhp = readRequiredString(
      value.chinese,
      'zhp',
      'title.chinese.zhp',
      diagnostics,
      fatalDiagnostics,
    );
    title.chinese.eng = readRequiredString(
      value.chinese,
      'eng',
      'title.chinese.eng',
      diagnostics,
      fatalDiagnostics,
    );
  }

  title.english = readRequiredString(
    value,
    'english',
    'title.english',
    diagnostics,
    fatalDiagnostics,
  );

  return title;
}

function readLyrics(value: unknown, diagnostics: SongValidationDiagnostic[]): Line[] {
  if (typeof value === 'undefined') {
    diagnostics.push({
      path: 'lyrics',
      message: 'Lyrics are missing; using an empty lyrics array.',
      repaired: true,
    });
    return [];
  }

  if (!Array.isArray(value)) {
    diagnostics.push({
      path: 'lyrics',
      message: 'Lyrics must be an array; using an empty lyrics array.',
      repaired: true,
    });
    return [];
  }

  return value.map((line, index) => {
    const result = normalizeLine(line, `lyrics[${index}]`);

    result.diagnostics.forEach(diagnostic => {
      diagnostics.push({
        path: diagnostic.path,
        message: `${diagnostic.message} Replaced with fallback text.`,
        repaired: true,
      });
    });

    return result.line;
  });
}

function readRequiredString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  diagnostics: SongValidationDiagnostic[],
  fatalDiagnostics: SongValidationDiagnostic[],
): string {
  if (typeof value[key] === 'string') {
    return value[key] as string;
  }

  addFatal(diagnostics, fatalDiagnostics, path, `${key} must be a string.`);
  return '';
}

function readOptionalString(
  value: Record<string, unknown>,
  key: string,
  diagnostics: SongValidationDiagnostic[],
): string {
  if (typeof value[key] === 'undefined') {
    return '';
  }

  if (typeof value[key] === 'string') {
    return value[key] as string;
  }

  diagnostics.push({
    path: key,
    message: `${key} must be a string; using an empty string.`,
    repaired: true,
  });
  return '';
}

function readOptionalBoolean(
  value: Record<string, unknown>,
  key: string,
  fallback: boolean,
  diagnostics: SongValidationDiagnostic[],
): boolean {
  if (typeof value[key] === 'undefined') {
    return fallback;
  }

  if (typeof value[key] === 'boolean') {
    return value[key] as boolean;
  }

  diagnostics.push({
    path: key,
    message: `${key} must be a boolean; using ${fallback}.`,
    repaired: true,
  });
  return fallback;
}

function addFatal(
  diagnostics: SongValidationDiagnostic[],
  fatalDiagnostics: SongValidationDiagnostic[],
  path: string,
  message: string,
) {
  const diagnostic = { path, message };
  diagnostics.push(diagnostic);
  fatalDiagnostics.push(diagnostic);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
