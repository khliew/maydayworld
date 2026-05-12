import { createBreakLine, createLyricLine, createTextLine, Line } from '../../model';

export type LyricsImportMode = 'structured' | 'three-column';
export type LyricsImportDelimiter = 'auto' | 'tab' | 'comma';

export interface LyricsImportOptions {
  mode: LyricsImportMode;
  delimiter?: LyricsImportDelimiter;
  blankRowsAsBreaks?: boolean;
}

export interface LyricsImportDiagnostic {
  rowNumber: number;
  field?: string;
  message: string;
}

export interface LyricsImportResult {
  lines: Line[];
  diagnostics: LyricsImportDiagnostic[];
  delimiter: Exclude<LyricsImportDelimiter, 'auto'>;
}

type SupportedImportColumn = 'type' | 'zht' | 'zhp' | 'eng' | 'text';
type ImportLineType = 'lyric' | 'break' | 'text';

interface ParsedRow {
  rowNumber: number;
  cells: string[];
}

export class LyricsImporter {
  private readonly supportedColumns = new Set<SupportedImportColumn>([
    'type',
    'zht',
    'zhp',
    'eng',
    'text',
  ]);

  parse(input: string, options: LyricsImportOptions): LyricsImportResult {
    const delimiter = this.resolveDelimiter(input || '', options.delimiter || 'auto');
    const rows = this.parseDelimitedRows(input || '', delimiter);
    const diagnostics: LyricsImportDiagnostic[] = [];
    const lines =
      options.mode === 'structured'
        ? this.parseStructuredRows(rows, options, diagnostics)
        : this.parseThreeColumnRows(rows, options, diagnostics);

    return {
      lines,
      diagnostics,
      delimiter,
    };
  }

  private parseStructuredRows(
    rows: ParsedRow[],
    options: LyricsImportOptions,
    diagnostics: LyricsImportDiagnostic[],
  ): Line[] {
    const headerIndex = rows.findIndex(row => !this.isBlankRow(row.cells));
    if (headerIndex < 0) {
      return [];
    }

    const lines: Line[] = [];
    const headerRow = rows[headerIndex];
    const columns = this.parseHeader(headerRow, diagnostics);
    const hasTypeColumn = columns.includes('type');

    if (!hasTypeColumn) {
      diagnostics.push({
        rowNumber: headerRow.rowNumber,
        field: 'type',
        message: 'Structured import header must include a type column.',
      });
      return lines;
    }

    for (let index = headerIndex + 1; index < rows.length; index++) {
      const row = rows[index];

      if (this.isBlankRow(row.cells)) {
        if (options.blankRowsAsBreaks) {
          lines.push(this.createBreak());
        }
        continue;
      }

      const rowValue = this.createStructuredRowValue(columns, row.cells);
      const rowDiagnostics: LyricsImportDiagnostic[] = [];
      const line = this.createLineFromStructuredRow(rowValue, row.rowNumber, rowDiagnostics);
      diagnostics.push(...rowDiagnostics);

      if (rowDiagnostics.length === 0 && line) {
        lines.push(line);
      }
    }

    return lines;
  }

  private parseThreeColumnRows(
    rows: ParsedRow[],
    options: LyricsImportOptions,
    diagnostics: LyricsImportDiagnostic[],
  ): Line[] {
    const lines: Line[] = [];

    rows.forEach(row => {
      if (this.isBlankRow(row.cells)) {
        if (options.blankRowsAsBreaks) {
          lines.push(this.createBreak());
        }
        return;
      }

      const rowDiagnostics: LyricsImportDiagnostic[] = [];
      const zht = this.trimCell(row.cells[0]);
      const zhp = this.trimCell(row.cells[1]);
      const eng = this.trimCell(row.cells[2]);
      const extraCells = row.cells.slice(3).filter(cell => this.trimCell(cell).length > 0);

      this.requireField(rowDiagnostics, row.rowNumber, 'zht', zht);
      this.requireField(rowDiagnostics, row.rowNumber, 'zhp', zhp);
      this.requireField(rowDiagnostics, row.rowNumber, 'eng', eng);

      if (extraCells.length > 0) {
        rowDiagnostics.push({
          rowNumber: row.rowNumber,
          field: 'columns',
          message: 'Unexpected extra columns. Use structured mode for type or text rows.',
        });
      }

      diagnostics.push(...rowDiagnostics);

      if (rowDiagnostics.length === 0) {
        lines.push(this.createLyric(zht, zhp, eng));
      }
    });

    return lines;
  }

  private parseHeader(
    headerRow: ParsedRow,
    diagnostics: LyricsImportDiagnostic[],
  ): Array<SupportedImportColumn | null> {
    const seen = new Set<SupportedImportColumn>();

    return headerRow.cells.map(cell => {
      const column = this.normalizeColumnName(cell);

      if (!this.isSupportedColumn(column)) {
        diagnostics.push({
          rowNumber: headerRow.rowNumber,
          field: column || '(blank)',
          message: `Unsupported import column "${cell.trim()}".`,
        });
        return null;
      }

      if (seen.has(column)) {
        diagnostics.push({
          rowNumber: headerRow.rowNumber,
          field: column,
          message: `Duplicate import column "${column}".`,
        });
        return null;
      }

      seen.add(column);
      return column;
    });
  }

  private createStructuredRowValue(
    columns: Array<SupportedImportColumn | null>,
    cells: string[],
  ): Record<SupportedImportColumn, string> {
    const rowValue: Record<SupportedImportColumn, string> = {
      type: '',
      zht: '',
      zhp: '',
      eng: '',
      text: '',
    };

    columns.forEach((column, index) => {
      if (column) {
        rowValue[column] = this.trimCell(cells[index]);
      }
    });

    return rowValue;
  }

  private createLineFromStructuredRow(
    rowValue: Record<SupportedImportColumn, string>,
    rowNumber: number,
    diagnostics: LyricsImportDiagnostic[],
  ): Line | null {
    const type = this.normalizeLineType(rowValue.type);

    if (!type) {
      diagnostics.push({
        rowNumber,
        field: 'type',
        message: `Unsupported row type "${rowValue.type}". Use lyric, break, or text.`,
      });
      return null;
    }

    switch (type) {
      case 'lyric':
        return this.createStructuredLyric(rowValue, rowNumber, diagnostics);
      case 'break':
        return this.createStructuredBreak(rowValue, rowNumber, diagnostics);
      case 'text':
        return this.createStructuredText(rowValue, rowNumber, diagnostics);
    }
  }

  private createStructuredLyric(
    rowValue: Record<SupportedImportColumn, string>,
    rowNumber: number,
    diagnostics: LyricsImportDiagnostic[],
  ): Line | null {
    this.requireField(diagnostics, rowNumber, 'zht', rowValue.zht);
    this.requireField(diagnostics, rowNumber, 'zhp', rowValue.zhp);
    this.requireField(diagnostics, rowNumber, 'eng', rowValue.eng);

    if (diagnostics.length > 0) {
      return null;
    }

    return this.createLyric(rowValue.zht, rowValue.zhp, rowValue.eng);
  }

  private createStructuredBreak(
    rowValue: Record<SupportedImportColumn, string>,
    rowNumber: number,
    diagnostics: LyricsImportDiagnostic[],
  ): Line | null {
    (['zht', 'zhp', 'eng', 'text'] as SupportedImportColumn[]).forEach(field => {
      if (rowValue[field]) {
        diagnostics.push({
          rowNumber,
          field,
          message: `Break rows cannot include ${field}.`,
        });
      }
    });

    return diagnostics.length > 0 ? null : this.createBreak();
  }

  private createStructuredText(
    rowValue: Record<SupportedImportColumn, string>,
    rowNumber: number,
    diagnostics: LyricsImportDiagnostic[],
  ): Line | null {
    this.requireField(diagnostics, rowNumber, 'text', rowValue.text);

    (['zht', 'zhp', 'eng'] as SupportedImportColumn[]).forEach(field => {
      if (rowValue[field]) {
        diagnostics.push({
          rowNumber,
          field,
          message: `Text rows cannot include ${field}.`,
        });
      }
    });

    if (diagnostics.length > 0) {
      return null;
    }

    return createTextLine(rowValue.text);
  }

  private requireField(
    diagnostics: LyricsImportDiagnostic[],
    rowNumber: number,
    field: SupportedImportColumn,
    value: string,
  ) {
    if (!value) {
      diagnostics.push({
        rowNumber,
        field,
        message: `${field} is required.`,
      });
    }
  }

  private createLyric(zht: string, zhp: string, eng: string): Line {
    return createLyricLine(zht, zhp, eng);
  }

  private createBreak(): Line {
    return createBreakLine();
  }

  private parseDelimitedRows(
    input: string,
    delimiter: Exclude<LyricsImportDelimiter, 'auto'>,
  ): ParsedRow[] {
    const normalizedInput = this.normalizeLineEndings(input || '');

    if (normalizedInput.trim().length === 0) {
      return [];
    }

    const delimiterChar = delimiter === 'tab' ? '\t' : ',';
    const rows: ParsedRow[] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    let rowNumber = 1;

    for (let index = 0; index < normalizedInput.length; index++) {
      const char = normalizedInput[index];

      if (char === '"') {
        if (inQuotes && normalizedInput[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiterChar && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(cell);
        rows.push({ rowNumber, cells: row });
        row = [];
        cell = '';
        rowNumber++;
      } else {
        cell += char;
      }
    }

    row.push(cell);
    rows.push({ rowNumber, cells: row });

    if (normalizedInput.endsWith('\n')) {
      rows.pop();
    }

    return rows;
  }

  private resolveDelimiter(
    input: string,
    delimiter: LyricsImportDelimiter,
  ): Exclude<LyricsImportDelimiter, 'auto'> {
    if (delimiter === 'tab' || delimiter === 'comma') {
      return delimiter;
    }

    const firstRow = this.normalizeLineEndings(input || '')
      .split('\n')
      .find(row => row.trim().length > 0);

    if (firstRow && firstRow.includes('\t')) {
      return 'tab';
    }

    return 'comma';
  }

  private normalizeLineEndings(input: string): string {
    return input.replace(/\r\n?/g, '\n');
  }

  private normalizeColumnName(column: string): string {
    return column.trim().toLowerCase();
  }

  private isSupportedColumn(column: string): column is SupportedImportColumn {
    return this.supportedColumns.has(column as SupportedImportColumn);
  }

  private normalizeLineType(type: string): ImportLineType | null {
    switch (type.trim().toLowerCase()) {
      case 'l':
      case 'lyric':
        return 'lyric';
      case 'b':
      case 'break':
        return 'break';
      case 't':
      case 'text':
        return 'text';
      default:
        return null;
    }
  }

  private isBlankRow(cells: string[]): boolean {
    return cells.every(cell => this.trimCell(cell).length === 0);
  }

  private trimCell(cell: string): string {
    return (cell || '').trim();
  }
}
