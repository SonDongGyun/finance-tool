import * as XLSX from 'xlsx';
import type { ParsedFile, ParsedRow } from '../../types';

// Plain Error subclass so callers can `if (err instanceof EncryptedFileError)`
// or check `err.encrypted` without losing the stack.
export class EncryptedFileError extends Error {
  encrypted = true as const;
  constructor(message = '암호가 설정된 엑셀 파일입니다.') {
    super(message);
    this.name = 'EncryptedFileError';
  }
}

export function parseWorkbook(workbook: XLSX.WorkBook): ParsedFile {
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('엑셀 파일에 시트가 없습니다.');
  }

  const allRows: ParsedRow[] = [];
  const rowsBySheet: Record<string, ParsedRow[]> = {};
  const nonEmptySheets: string[] = [];
  let headers: string[] | null = null;

  sheetNames.forEach(name => {
    const ws = workbook.Sheets[name];
    if (!ws) return;
    const rows = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: '' });
    if (rows.length === 0) return;
    if (!headers) headers = Object.keys(rows[0]);
    const tagged: ParsedRow[] = rows.map(r => ({ ...r, _sheet: name }));
    rowsBySheet[name] = tagged;
    nonEmptySheets.push(name);
    tagged.forEach(r => allRows.push(r));
  });

  if (allRows.length === 0) {
    throw new Error('엑셀 파일에 데이터가 없습니다.');
  }

  return {
    sheetName: nonEmptySheets.join(', '),
    sheetNames: nonEmptySheets,
    headers: headers ?? [],
    rows: allRows,
    rowsBySheet,
    totalRows: allRows.length,
  };
}

export function parseExcelFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error('파일을 읽을 수 없습니다.'));
          return;
        }
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(parseWorkbook(workbook));
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('password') || msg.includes('encrypt') || msg.includes('cfb') || msg.includes('Unsupported')) {
          reject(new EncryptedFileError());
        } else {
          reject(new Error('엑셀 파일 파싱 중 오류가 발생했습니다: ' + msg));
        }
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

// Excel serial date epoch: 1899-12-30 (accounts for Lotus 1900 leap-year bug).
// 73000 ≈ 2099-12; clamps out 8-digit numbers like 20240101 from being misread.
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const EXCEL_SERIAL_MIN = 1;
const EXCEL_SERIAL_MAX = 73000;

export function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === '') return null;

  // Native Date object straight from XLSX cellDates option (not used here, but defensive).
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : toUtcMidnight(val);
  }

  const str = String(val).trim();
  if (str === '') return null;

  // Excel serial number (integer or decimal). Restricted to a sensible range.
  if (/^\d{1,6}(\.\d+)?$/.test(str)) {
    const num = Number(str);
    if (num >= EXCEL_SERIAL_MIN && num <= EXCEL_SERIAL_MAX) {
      return new Date(EXCEL_EPOCH_MS + num * 86400 * 1000);
    }
  }

  // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD — interpret as UTC to align with monthKeyOf.
  const match = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  // Native parse fallback — normalize to UTC midnight of the parsed local date.
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return toUtcMidnight(d);
}

function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function parseAmount(val: unknown): number {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;

  let str = String(val).trim();
  if (str === '' || str === '-') return 0;

  // Korean accounting negative markers (△, ▲): leading sign
  let sign = 1;
  if (/^[△▲]/.test(str)) {
    sign = -1;
    str = str.replace(/^[△▲]\s*/, '');
  }

  // Parentheses-wrapped negative: (1,000) → -1000
  if (/^\(.*\)$/.test(str)) {
    sign = -sign;
    str = str.slice(1, -1).trim();
  }

  const cleaned = str.replace(/[,\s원₩]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  // `sign * 0` produces -0 when sign is -1 — normalize to +0 so consumers
  // (display, Object.is, JSON) see a single canonical zero.
  return (sign * num) || 0;
}
