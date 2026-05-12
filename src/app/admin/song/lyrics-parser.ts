import { createBreakLine, createLyricLine, createTextLine, Line } from '../../model';

export interface LyricsParseDiagnostic {
  lineNumber: number;
  message: string;
}

export interface LyricsParseResult {
  lines: Line[];
  diagnostics: LyricsParseDiagnostic[];
}

export class LyricsParser {
  private readonly controlTokens = new Set(['L', 'B', 'T']);

  parse(lyrics: string): Line[] {
    return this.parseWithDiagnostics(lyrics).lines;
  }

  parseWithDiagnostics(lyrics: string): LyricsParseResult {
    const lines: Line[] = [];
    const diagnostics: LyricsParseDiagnostic[] = [];
    const tokens = this.normalizeLineEndings(lyrics || '').split('\n');

    let index = 0;
    while (index < tokens.length) {
      const token = tokens[index];
      const controlToken = this.getControlToken(token);

      if (this.isBlank(token)) {
        index++;
        continue;
      }

      switch (controlToken) {
        case 'L': {
          const result = this.createLyric(tokens, index, diagnostics);
          lines.push(result.line);
          index = result.nextIndex;
          break;
        }
        case 'B': {
          lines.push(this.createBreak());
          index++;
          break;
        }
        case 'T': {
          const result = this.createText(tokens, index, diagnostics);
          lines.push(result.line);
          index = result.nextIndex;
          break;
        }
        default: {
          diagnostics.push({
            lineNumber: index + 1,
            message: `Unknown control token "${token.trim()}". Expected L, B, or T.`,
          });
          index++;
          break;
        }
      }
    }

    return {
      lines,
      diagnostics,
    };
  }

  private createLyric(
    tokens: string[],
    startIndex: number,
    diagnostics: LyricsParseDiagnostic[],
  ): { line: Line; nextIndex: number } {
    const zht = this.readRequiredField(
      tokens,
      startIndex,
      startIndex + 1,
      'Traditional Chinese lyric',
      diagnostics,
    );

    const zhp = this.readRequiredField(tokens, startIndex, zht.nextIndex, 'pinyin', diagnostics);

    const eng = this.readRequiredField(
      tokens,
      startIndex,
      zhp.nextIndex,
      'English translation',
      diagnostics,
    );

    return {
      line: createLyricLine(zht.value, zhp.value, eng.value),
      nextIndex: eng.nextIndex,
    };
  }

  private readRequiredField(
    tokens: string[],
    controlIndex: number,
    fieldIndex: number,
    fieldName: string,
    diagnostics: LyricsParseDiagnostic[],
  ): { value: string; nextIndex: number } {
    const token = tokens[fieldIndex];
    if (typeof token === 'undefined') {
      diagnostics.push({
        lineNumber: controlIndex + 1,
        message: `Lyric block is missing ${fieldName}.`,
      });
      return { value: '', nextIndex: fieldIndex };
    }

    if (this.isControlToken(token)) {
      diagnostics.push({
        lineNumber: fieldIndex + 1,
        message: `Lyric block is missing ${fieldName}.`,
      });
      return { value: '', nextIndex: fieldIndex };
    }

    if (this.isBlank(token)) {
      diagnostics.push({
        lineNumber: fieldIndex + 1,
        message: `Lyric block is missing ${fieldName}.`,
      });
      return { value: '', nextIndex: fieldIndex + 1 };
    }

    return { value: token.trimEnd(), nextIndex: fieldIndex + 1 };
  }

  private createBreak(): Line {
    return createBreakLine();
  }

  private createText(
    tokens: string[],
    startIndex: number,
    diagnostics: LyricsParseDiagnostic[],
  ): { line: Line; nextIndex: number } {
    const fieldIndex = startIndex + 1;
    const token = tokens[fieldIndex];

    if (typeof token === 'undefined') {
      diagnostics.push({
        lineNumber: startIndex + 1,
        message: 'Text block is missing note text.',
      });
      return { line: createTextLine(''), nextIndex: fieldIndex };
    }

    if (this.isControlToken(token)) {
      diagnostics.push({
        lineNumber: fieldIndex + 1,
        message: 'Text block is missing note text.',
      });
      return { line: createTextLine(''), nextIndex: fieldIndex };
    }

    if (this.isBlank(token)) {
      diagnostics.push({
        lineNumber: fieldIndex + 1,
        message: 'Text block is missing note text.',
      });
      return { line: createTextLine(''), nextIndex: fieldIndex + 1 };
    }

    return { line: createTextLine(token.trimEnd()), nextIndex: fieldIndex + 1 };
  }

  private normalizeLineEndings(lyrics: string): string {
    return lyrics.replace(/\r\n?/g, '\n');
  }

  private getControlToken(token: string): string {
    return token.trim();
  }

  private isControlToken(token: string): boolean {
    return this.controlTokens.has(this.getControlToken(token));
  }

  private isBlank(token: string): boolean {
    return token.trim().length === 0;
  }
}
