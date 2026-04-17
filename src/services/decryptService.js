import * as XLSX from 'xlsx';
import { parseWorkbook } from '../utils/excel/parser';

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

  const contentType = res.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 413) {
      throw new Error('파일 크기가 너무 큽니다. 더 작은 파일을 업로드해주세요.');
    }
    throw new Error(`서버 오류가 발생했습니다. (${res.status})`);
  }

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
  return parseWorkbook(workbook);
}
