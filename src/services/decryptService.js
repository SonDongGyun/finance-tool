import * as XLSX from 'xlsx';

export async function decryptAndParse(file, password) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), '')
  );

  const res = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: base64, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '복호화에 실패했습니다.');
  }

  // base64 → Uint8Array → XLSX parse
  const decoded = atob(data.file);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }

  const workbook = XLSX.read(bytes, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (jsonData.length === 0) {
    throw new Error('복호화된 파일에 데이터가 없습니다.');
  }

  return {
    sheetName,
    headers: Object.keys(jsonData[0]),
    rows: jsonData,
    totalRows: jsonData.length,
  };
}
