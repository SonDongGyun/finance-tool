import * as XLSX from 'xlsx';

export function parseWorkbook(workbook) {
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('엑셀 파일에 시트가 없습니다.');
  }

  const allRows = [];
  const rowsBySheet = {};
  const nonEmptySheets = [];
  let headers = null;

  sheetNames.forEach(name => {
    const ws = workbook.Sheets[name];
    if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (rows.length === 0) return;
    if (!headers) headers = Object.keys(rows[0]);
    const tagged = rows.map(r => ({ ...r, _sheet: name }));
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
    headers,
    rows: allRows,
    rowsBySheet,
    totalRows: allRows.length,
  };
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(parseWorkbook(workbook));
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('password') || msg.includes('encrypt') || msg.includes('cfb') || msg.includes('Unsupported')) {
          const e = new Error('암호가 설정된 엑셀 파일입니다.');
          e.encrypted = true;
          reject(e);
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

export function parseDate(val) {
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

function toUtcMidnight(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function parseAmount(val) {
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
  return Number.isFinite(num) ? sign * num : 0;
}
