import { parseDate, parseAmount } from './parser';
import { buildRangeKey } from '../formatters';
import { UNCATEGORIZED, UNKNOWN_VENDOR } from '../../constants/defaults';

// UTC-based to align with parseDate, which normalizes all inputs to UTC midnight.
// Mixing local/UTC here was misclassifying month-boundary rows by one month.
function monthKeyOf(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function extractMonths(rows, dateColumn) {
  const months = new Set();
  rows.forEach(row => {
    const d = parseDate(row[dateColumn]);
    if (d) months.add(monthKeyOf(d));
  });
  return Array.from(months).sort();
}

export function analyzeSheets(rowsBySheet, dateColumn) {
  const sheets = [];
  Object.entries(rowsBySheet).forEach(([name, rows]) => {
    const yearCount = {};
    const months = new Set();
    rows.forEach(row => {
      const d = parseDate(row[dateColumn]);
      if (!d) return;
      const y = d.getUTCFullYear();
      yearCount[y] = (yearCount[y] || 0) + 1;
      months.add(monthKeyOf(d));
    });

    let dominantYear = null;
    let maxCount = 0;
    Object.entries(yearCount).forEach(([y, c]) => {
      if (c > maxCount) {
        maxCount = c;
        dominantYear = Number(y);
      }
    });

    sheets.push({
      name,
      year: dominantYear,
      label: dominantYear ? `${dominantYear}년` : name,
      months: Array.from(months).sort(),
      rowCount: rows.length,
    });
  });

  sheets.sort((a, b) => {
    if (a.year && b.year) return a.year - b.year;
    return a.name.localeCompare(b.name);
  });

  return sheets;
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

function buildEntry(row, date, config) {
  const { amountColumns, categoryColumn, descriptionColumn, vendorColumn } = config;

  const amount = amountColumns.debit
    ? parseAmount(row[amountColumns.debit]) - parseAmount(row[amountColumns.credit])
    : parseAmount(row[amountColumns.amount]);

  const rawCategory = categoryColumn ? String(row[categoryColumn] ?? '').trim() : '';
  const rawDescription = descriptionColumn ? String(row[descriptionColumn] ?? '').trim() : '';
  const rawVendor = vendorColumn ? String(row[vendorColumn] ?? '').trim() : '';

  return {
    ...row,
    _amount: amount,
    _category: rawCategory || UNCATEGORIZED,
    _description: rawDescription,
    _vendor: rawVendor,
    _date: date,
  };
}

// Prepare entries from rows: filters by allowed months, parses fields, counts skipped (unparseable date) rows.
function prepareEntries(rows, config, allowedMonths) {
  const monthSet = new Set(allowedMonths);
  const entries = [];
  let skipped = 0;

  rows.forEach(row => {
    const d = parseDate(row[config.dateColumn]);
    if (!d) {
      skipped++;
      return;
    }
    if (monthSet.size > 0 && !monthSet.has(monthKeyOf(d))) return;
    entries.push(buildEntry(row, d, config));
  });

  return { entries, skipped };
}

// Single-pass variant for the monthly mode where both sides share the same rows.
// The two month sets are disjoint by UI guard (monthRangesOverlap check), so each
// matching row goes to at most one bucket — but we keep the dual-bucket assignment
// defensive in case that guard is bypassed.
function prepareEntriesPair(rows, config, months1, months2) {
  const set1 = new Set(months1);
  const set2 = new Set(months2);
  const entries1 = [];
  const entries2 = [];
  let skipped = 0;

  rows.forEach(row => {
    const d = parseDate(row[config.dateColumn]);
    if (!d) {
      skipped++;
      return;
    }
    const key = monthKeyOf(d);
    const in1 = set1.has(key);
    const in2 = set2.has(key);
    if (!in1 && !in2) return;
    const entry = buildEntry(row, d, config);
    if (in1) entries1.push(entry);
    if (in2) entries2.push(entry);
  });

  return { entries1, entries2, skipped };
}

// Uses |prev| as denominator so negative-prev categories (e.g. refunds) yield
// a sensible signed percentage instead of always 0/100.
function pctChangeOf(prev, curr) {
  const diff = curr - prev;
  if (prev === 0) return curr === 0 ? 0 : (curr > 0 ? 100 : -100);
  return Math.round((diff / Math.abs(prev)) * 1000) / 10;
}

function aggregateByCategory(entries) {
  const map = {};
  entries.forEach(e => {
    if (!map[e._category]) map[e._category] = { total: 0, items: [] };
    map[e._category].total += e._amount;
    map[e._category].items.push(e);
  });
  return map;
}

function aggregateByVendor(entries) {
  const map = {};
  entries.forEach(e => {
    const vendor = e._vendor || e._description || UNKNOWN_VENDOR;
    const category = e._category || UNCATEGORIZED;
    const key = `${category}|||${vendor}`;
    if (!map[key]) map[key] = { total: 0, count: 0, category, vendor, items: [] };
    map[key].total += e._amount;
    map[key].count++;
    map[key].items.push(e);
  });
  return map;
}

function compareEntries({ entries1, entries2, months1, months2, skipped }) {
  const label1 = labelFromMonths(months1);
  const label2 = labelFromMonths(months2);

  const m1Categories = aggregateByCategory(entries1);
  const m2Categories = aggregateByCategory(entries2);

  const allCategories = new Set([...Object.keys(m1Categories), ...Object.keys(m2Categories)]);
  const categoryComparison = [];
  allCategories.forEach(cat => {
    const prev = m1Categories[cat]?.total || 0;
    const curr = m2Categories[cat]?.total || 0;
    const diff = curr - prev;

    let status;
    if (prev === 0 && curr !== 0) status = 'new';
    else if (prev !== 0 && curr === 0) status = 'removed';
    else if (diff > 0) status = 'increased';
    else if (diff < 0) status = 'decreased';
    else status = 'unchanged';

    categoryComparison.push({
      category: cat,
      prevAmount: prev,
      currAmount: curr,
      diff,
      pctChange: pctChangeOf(prev, curr),
      status,
      prevItems: m1Categories[cat]?.items || [],
      currItems: m2Categories[cat]?.items || [],
    });
  });
  categoryComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const m1Vendors = aggregateByVendor(entries1);
  const m2Vendors = aggregateByVendor(entries2);

  const allVendorKeys = new Set([...Object.keys(m1Vendors), ...Object.keys(m2Vendors)]);
  const vendorComparison = [];
  allVendorKeys.forEach(key => {
    const prev = m1Vendors[key]?.total || 0;
    const curr = m2Vendors[key]?.total || 0;
    const diff = curr - prev;
    const info = m1Vendors[key] || m2Vendors[key];

    let status;
    if (prev === 0 && curr !== 0) status = 'new';
    else if (prev !== 0 && curr === 0) status = 'removed';
    else if (diff > 0) status = 'increased';
    else if (diff < 0) status = 'decreased';
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

  const m1Total = entries1.reduce((s, e) => s + e._amount, 0);
  const m2Total = entries2.reduce((s, e) => s + e._amount, 0);

  return {
    month1: { label: label1, total: m1Total, count: entries1.length, months: months1 },
    month2: { label: label2, total: m2Total, count: entries2.length, months: months2 },
    totalDiff: m2Total - m1Total,
    totalPctChange: pctChangeOf(m1Total, m2Total),
    categoryComparison,
    vendorComparison,
    newItems: categoryComparison.filter(c => c.status === 'new'),
    removedItems: categoryComparison.filter(c => c.status === 'removed'),
    increasedItems: categoryComparison.filter(c => c.status === 'increased'),
    decreasedItems: categoryComparison.filter(c => c.status === 'decreased'),
    skippedRowCount: skipped,
  };
}

// Monthly mode: single source of rows, partitioned by month keys in one pass.
export function analyzeMonthlyChanges(rows, config) {
  const months1 = resolveMonths(config, 1);
  const months2 = resolveMonths(config, 2);
  const { entries1, entries2, skipped } = prepareEntriesPair(rows, config, months1, months2);
  return compareEntries({ entries1, entries2, months1, months2, skipped });
}

// Sheet mode: rows already partitioned by source sheet, then filtered by months per side.
export function analyzeSheetComparison(rows1, rows2, config, months1, months2) {
  const { entries: entries1, skipped: skipped1 } = prepareEntries(rows1, config, months1);
  const { entries: entries2, skipped: skipped2 } = prepareEntries(rows2, config, months2);
  return compareEntries({
    entries1,
    entries2,
    months1,
    months2,
    skipped: skipped1 + skipped2,
  });
}
