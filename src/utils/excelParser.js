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
        if (msg.includes('password') || msg.includes('encrypt') || msg.includes('cfb')) {
          reject(new Error('암호가 설정된 엑셀 파일입니다. 엑셀에서 암호를 해제한 후 다시 업로드해주세요.'));
        } else {
          reject(new Error('엑셀 파일 파싱 중 오류가 발생했습니다: ' + msg));
        }
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

export function detectDateColumn(headers) {
  const dateKeywords = ['일자', '날짜', '일시', 'date', '회계일자', '거래일', '발생일'];
  return headers.find(h => dateKeywords.some(k => h.toLowerCase().includes(k))) || null;
}

export function detectAmountColumns(headers) {
  const debitKeywords = ['차변', 'debit', '출금', '지출'];
  const creditKeywords = ['대변', 'credit', '입금', '수입'];
  const amountKeywords = ['금액', 'amount', '거래금액', '거래액'];

  const debit = headers.find(h => debitKeywords.some(k => h.toLowerCase().includes(k)));
  const credit = headers.find(h => creditKeywords.some(k => h.toLowerCase().includes(k)));
  const amount = headers.find(h => amountKeywords.some(k => h.toLowerCase().includes(k)));

  return { debit, credit, amount };
}

export function detectCategoryColumn(headers) {
  const keywords = ['계정', '과목', '항목', 'category', 'account', '적요', '비목'];
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || null;
}

export function detectDescriptionColumn(headers) {
  const keywords = ['적요', '내용', '설명', 'description', '비고', '메모'];
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || null;
}

export function detectVendorColumn(headers) {
  const keywords = ['거래처', '업체', 'vendor', '상호', '공급자'];
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || null;
}

function parseDate(val) {
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

function parseAmount(val) {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  return Number(String(val).replace(/[,\s원₩]/g, '')) || 0;
}

export function extractMonths(rows, dateColumn) {
  const months = new Set();
  rows.forEach(row => {
    const d = parseDate(row[dateColumn]);
    if (d) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    }
  });
  return Array.from(months).sort();
}

export function analyzeMonthlyChanges(rows, config) {
  const { dateColumn, amountColumns, categoryColumn, descriptionColumn, vendorColumn, month1, month2 } = config;

  // Group data by month
  const m1Data = [];
  const m2Data = [];

  rows.forEach(row => {
    const d = parseDate(row[dateColumn]);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const amount = amountColumns.debit
      ? parseAmount(row[amountColumns.debit]) - parseAmount(row[amountColumns.credit] || 0)
      : parseAmount(row[amountColumns.amount]);

    const category = categoryColumn ? String(row[categoryColumn] || '미분류') : '미분류';
    const description = descriptionColumn ? String(row[descriptionColumn] || '') : '';
    const vendor = vendorColumn ? String(row[vendorColumn] || '') : '';

    const entry = { ...row, _amount: amount, _category: category, _description: description, _vendor: vendor, _date: d };

    if (key === month1) m1Data.push(entry);
    else if (key === month2) m2Data.push(entry);
  });

  // Category-level analysis
  const m1Categories = {};
  const m2Categories = {};

  m1Data.forEach(e => {
    if (!m1Categories[e._category]) m1Categories[e._category] = { total: 0, items: [] };
    m1Categories[e._category].total += e._amount;
    m1Categories[e._category].items.push(e);
  });

  m2Data.forEach(e => {
    if (!m2Categories[e._category]) m2Categories[e._category] = { total: 0, items: [] };
    m2Categories[e._category].total += e._amount;
    m2Categories[e._category].items.push(e);
  });

  const allCategories = new Set([...Object.keys(m1Categories), ...Object.keys(m2Categories)]);

  const categoryComparison = [];
  allCategories.forEach(cat => {
    const prev = m1Categories[cat]?.total || 0;
    const curr = m2Categories[cat]?.total || 0;
    const diff = curr - prev;
    const pctChange = prev > 0 ? ((diff / prev) * 100) : (curr > 0 ? 100 : 0);

    let status;
    if (prev === 0 && curr > 0) status = 'new';
    else if (prev > 0 && curr === 0) status = 'removed';
    else if (diff > 0) status = 'increased';
    else if (diff < 0) status = 'decreased';
    else status = 'unchanged';

    categoryComparison.push({
      category: cat,
      prevAmount: prev,
      currAmount: curr,
      diff,
      pctChange: Math.round(pctChange * 10) / 10,
      status,
      prevItems: m1Categories[cat]?.items || [],
      currItems: m2Categories[cat]?.items || [],
    });
  });

  categoryComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Vendor-level analysis
  const m1Vendors = {};
  const m2Vendors = {};

  m1Data.forEach(e => {
    const key = e._vendor || e._description || '기타';
    if (!m1Vendors[key]) m1Vendors[key] = { total: 0, count: 0 };
    m1Vendors[key].total += e._amount;
    m1Vendors[key].count++;
  });

  m2Data.forEach(e => {
    const key = e._vendor || e._description || '기타';
    if (!m2Vendors[key]) m2Vendors[key] = { total: 0, count: 0 };
    m2Vendors[key].total += e._amount;
    m2Vendors[key].count++;
  });

  const allVendors = new Set([...Object.keys(m1Vendors), ...Object.keys(m2Vendors)]);
  const vendorComparison = [];
  allVendors.forEach(v => {
    const prev = m1Vendors[v]?.total || 0;
    const curr = m2Vendors[v]?.total || 0;
    const diff = curr - prev;

    let status;
    if (prev === 0 && curr > 0) status = 'new';
    else if (prev > 0 && curr === 0) status = 'removed';
    else if (Math.abs(diff) > 0) status = diff > 0 ? 'increased' : 'decreased';
    else status = 'unchanged';

    if (status !== 'unchanged') {
      vendorComparison.push({ vendor: v, prevAmount: prev, currAmount: curr, diff, status });
    }
  });
  vendorComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Summary stats
  const m1Total = m1Data.reduce((s, e) => s + e._amount, 0);
  const m2Total = m2Data.reduce((s, e) => s + e._amount, 0);

  return {
    month1: { label: month1, total: m1Total, count: m1Data.length },
    month2: { label: month2, total: m2Total, count: m2Data.length },
    totalDiff: m2Total - m1Total,
    totalPctChange: m1Total > 0 ? Math.round(((m2Total - m1Total) / m1Total) * 1000) / 10 : 0,
    categoryComparison,
    vendorComparison,
    newItems: categoryComparison.filter(c => c.status === 'new'),
    removedItems: categoryComparison.filter(c => c.status === 'removed'),
    increasedItems: categoryComparison.filter(c => c.status === 'increased'),
    decreasedItems: categoryComparison.filter(c => c.status === 'decreased'),
  };
}

export function formatMoney(amount) {
  if (amount === 0) return '0';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ko-KR');
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return `${year}년 ${Number(month)}월`;
}
