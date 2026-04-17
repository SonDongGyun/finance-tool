import { parseDate, parseAmount } from './parser';
import { buildRangeKey } from '../formatters';

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

function resolveMonths(config, side) {
  const arr = config[`months${side}`];
  if (Array.isArray(arr) && arr.length > 0) return arr;
  const single = config[`month${side}`];
  return single ? [single] : [];
}

function labelFromMonths(months) {
  if (months.length === 0) return '';
  if (months.length === 1) return months[0];
  const sorted = [...months].sort();
  return buildRangeKey(sorted[0], sorted[sorted.length - 1]);
}

export function analyzeMonthlyChanges(rows, config) {
  const { dateColumn, amountColumns, categoryColumn, descriptionColumn, vendorColumn } = config;

  const months1 = resolveMonths(config, 1);
  const months2 = resolveMonths(config, 2);
  const m1Set = new Set(months1);
  const m2Set = new Set(months2);
  const label1 = labelFromMonths(months1);
  const label2 = labelFromMonths(months2);

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

    if (m1Set.has(key)) m1Data.push(entry);
    else if (m2Set.has(key)) m2Data.push(entry);
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

  // Vendor-level analysis (grouped by category + vendor)
  const m1Vendors = {};
  const m2Vendors = {};

  m1Data.forEach(e => {
    const vendor = e._vendor || e._description || '기타';
    const category = e._category || '미분류';
    const key = `${category}|||${vendor}`;
    if (!m1Vendors[key]) m1Vendors[key] = { total: 0, count: 0, category, vendor, items: [] };
    m1Vendors[key].total += e._amount;
    m1Vendors[key].count++;
    m1Vendors[key].items.push(e);
  });

  m2Data.forEach(e => {
    const vendor = e._vendor || e._description || '기타';
    const category = e._category || '미분류';
    const key = `${category}|||${vendor}`;
    if (!m2Vendors[key]) m2Vendors[key] = { total: 0, count: 0, category, vendor, items: [] };
    m2Vendors[key].total += e._amount;
    m2Vendors[key].count++;
    m2Vendors[key].items.push(e);
  });

  const allVendorKeys = new Set([...Object.keys(m1Vendors), ...Object.keys(m2Vendors)]);
  const vendorComparison = [];
  allVendorKeys.forEach(key => {
    const prev = m1Vendors[key]?.total || 0;
    const curr = m2Vendors[key]?.total || 0;
    const diff = curr - prev;
    const info = m1Vendors[key] || m2Vendors[key];

    let status;
    if (prev === 0 && curr > 0) status = 'new';
    else if (prev > 0 && curr === 0) status = 'removed';
    else if (Math.abs(diff) > 0) status = diff > 0 ? 'increased' : 'decreased';
    else status = 'unchanged';

    if (status !== 'unchanged') {
      vendorComparison.push({
        vendor: info.vendor,
        category: info.category,
        prevAmount: prev,
        currAmount: curr,
        diff,
        status,
        prevItems: m1Vendors[key]?.items || [],
        currItems: m2Vendors[key]?.items || [],
      });
    }
  });
  vendorComparison.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  // Summary stats
  const m1Total = m1Data.reduce((s, e) => s + e._amount, 0);
  const m2Total = m2Data.reduce((s, e) => s + e._amount, 0);

  return {
    month1: { label: label1, total: m1Total, count: m1Data.length, months: months1 },
    month2: { label: label2, total: m2Total, count: m2Data.length, months: months2 },
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
