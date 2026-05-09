export type Line = LyricLine | BreakLine | TextLine;

export interface LyricLine {
  type: 'lyric';
  zht: string;
  zhp: string;
  eng: string;
}

export interface BreakLine {
  type: 'break';
}

export interface TextLine {
  type: 'text';
  text: string;
}

export interface LineValidationDiagnostic {
  path: string;
  message: string;
}

export const INVALID_LINE_FALLBACK_TEXT = '[Invalid lyric line]';

export function createLyricLine(zht: string, zhp: string, eng: string): LyricLine {
  return { type: 'lyric', zht, zhp, eng };
}

export function createBreakLine(): BreakLine {
  return { type: 'break' };
}

export function createTextLine(text: string): TextLine {
  return { type: 'text', text };
}

export function isLyricLine(line: Line): line is LyricLine {
  return line.type === 'lyric';
}

export function isBreakLine(line: Line): line is BreakLine {
  return line.type === 'break';
}

export function isTextLine(line: Line): line is TextLine {
  return line.type === 'text';
}

export function isLine(value: unknown): value is Line {
  return validateLine(value).length === 0;
}

export function validateLine(value: unknown, path: string = 'line'): LineValidationDiagnostic[] {
  const diagnostics: LineValidationDiagnostic[] = [];

  if (!isPlainObject(value)) {
    diagnostics.push({
      path,
      message: 'Line must be an object.',
    });
    return diagnostics;
  }

  switch (value.type) {
    case 'lyric':
      requireString(value, 'zht', `${path}.zht`, diagnostics);
      requireString(value, 'zhp', `${path}.zhp`, diagnostics);
      requireString(value, 'eng', `${path}.eng`, diagnostics);
      break;
    case 'break':
      break;
    case 'text':
      requireString(value, 'text', `${path}.text`, diagnostics);
      break;
    default:
      diagnostics.push({
        path: `${path}.type`,
        message: 'Line type must be lyric, break, or text.',
      });
      break;
  }

  return diagnostics;
}

export function normalizeLine(
  value: unknown,
  path: string = 'line',
): {
  line: Line;
  diagnostics: LineValidationDiagnostic[];
} {
  const diagnostics = validateLine(value, path);

  if (diagnostics.length > 0) {
    return {
      line: createTextLine(INVALID_LINE_FALLBACK_TEXT),
      diagnostics,
    };
  }

  const line = value as Line;
  switch (line.type) {
    case 'lyric':
      return {
        line: createLyricLine(line.zht, line.zhp, line.eng),
        diagnostics,
      };
    case 'break':
      return {
        line: createBreakLine(),
        diagnostics,
      };
    case 'text':
      return {
        line: createTextLine(line.text),
        diagnostics,
      };
  }
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  diagnostics: LineValidationDiagnostic[],
) {
  if (typeof value[key] !== 'string') {
    diagnostics.push({
      path,
      message: `${key} must be a string.`,
    });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
