import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('엑셀 파일에 데이터가 없습니다.'));
          return;
        }

        resolve({
          sheetName,
          headers: Object.keys(jsonData[0]),
          rows: jsonData,
          totalRows: jsonData.length,
        });
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
