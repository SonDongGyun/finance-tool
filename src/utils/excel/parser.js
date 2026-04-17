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
          reject({ encrypted: true, message: '암호가 설정된 엑셀 파일입니다.' });
        } else {
          reject(new Error('엑셀 파일 파싱 중 오류가 발생했습니다: ' + msg));
        }
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseDate(val) {
  if (!val) return null;
  const str = String(val).trim();

  // Handle Excel serial date numbers
  if (/^\d{5}$/.test(str)) {
    const date = new Date((Number(str) - 25569) * 86400 * 1000);
    return date;
  }

  // YYYY/MM/DD or YYYY-MM-DD
  const match = str.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  // Try native parse
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function parseAmount(val) {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  return Number(String(val).replace(/[,\s원₩]/g, '')) || 0;
}
