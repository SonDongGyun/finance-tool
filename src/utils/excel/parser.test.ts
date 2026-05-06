import { describe, it, expect } from 'vitest';
import { parseDate, parseAmount, parseSummaryLabel } from './parser';

describe('parseDate', () => {
  it('returns null for empty inputs', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('   ')).toBeNull();
  });

  it('parses Excel serial numbers in the supported range', () => {
    // 25569 = 1970-01-01 (Unix epoch start, classic XLSX serial reference).
    const epoch = parseDate('25569');
    expect(epoch).not.toBeNull();
    expect(epoch!.getUTCFullYear()).toBe(1970);
    expect(epoch!.getUTCMonth()).toBe(0);
    expect(epoch!.getUTCDate()).toBe(1);

    // 45292 = 2024-01-01 — typical modern serial.
    const recent = parseDate('45292');
    expect(recent).not.toBeNull();
    expect(recent!.getUTCFullYear()).toBe(2024);
    expect(recent!.getUTCMonth()).toBe(0);
    expect(recent!.getUTCDate()).toBe(1);
  });

  it('accepts 4-digit serials too (regression: previously the regex required exactly 5)', () => {
    // 1000 = 1902-09-26 (well within Excel epoch territory).
    const d = parseDate('1000');
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(1902);
  });

  it('rejects 8-digit numbers like 20240101 from being misread as serials', () => {
    // 20240101 is way out of the serial range (>73000), so it should fall
    // through to native Date parsing and likely return Invalid Date → null.
    const d = parseDate('20240101');
    // Either null (couldn't parse) or a sensible parse — but definitely NOT
    // some date in year 57000.
    if (d !== null) {
      expect(d.getUTCFullYear()).toBeLessThan(2200);
    }
  });

  it('parses ISO and slash/dot date strings as UTC midnight', () => {
    for (const input of ['2025-03-15', '2025/03/15', '2025.03.15']) {
      const d = parseDate(input);
      expect(d).not.toBeNull();
      expect(d!.getUTCFullYear()).toBe(2025);
      expect(d!.getUTCMonth()).toBe(2);
      expect(d!.getUTCDate()).toBe(15);
      expect(d!.getUTCHours()).toBe(0);
      expect(d!.getUTCMinutes()).toBe(0);
    }
  });

  it('passes Date instances through normalized to UTC midnight', () => {
    const input = new Date(2025, 5, 20, 14, 30); // local June 20 2025 14:30
    const d = parseDate(input);
    expect(d).not.toBeNull();
    expect(d!.getUTCHours()).toBe(0);
  });

  it('returns null for unparseable strings', () => {
    expect(parseDate('not a date')).toBeNull();
    expect(parseDate('xyz')).toBeNull();
  });
});

describe('parseAmount', () => {
  it('returns 0 for empty inputs', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount('-')).toBe(0);
  });

  it('passes finite numbers through and zeroes non-finite ones', () => {
    expect(parseAmount(1000)).toBe(1000);
    expect(parseAmount(-500)).toBe(-500);
    expect(parseAmount(0)).toBe(0);
    expect(parseAmount(Number.NaN)).toBe(0);
    expect(parseAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('strips commas, currency suffixes, and surrounding whitespace', () => {
    expect(parseAmount('1,000')).toBe(1000);
    expect(parseAmount('  1,234,567  ')).toBe(1234567);
    expect(parseAmount('1,000원')).toBe(1000);
    expect(parseAmount('₩1,000')).toBe(1000);
  });

  it('handles Korean accounting negative markers (△, ▲)', () => {
    expect(parseAmount('△1,000')).toBe(-1000);
    expect(parseAmount('▲1,000')).toBe(-1000);
    expect(parseAmount('△ 1,000')).toBe(-1000);
  });

  it('handles parenthesis-wrapped negatives', () => {
    expect(parseAmount('(1,000)')).toBe(-1000);
    expect(parseAmount('(0)')).toBe(0);
  });

  it('combines markers correctly: △ and parens cancel to positive', () => {
    // △ flips sign to negative, then parens flip again → net positive.
    expect(parseAmount('△(1,000)')).toBe(1000);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('not a number')).toBe(0);
  });
});

describe('parseSummaryLabel', () => {
  it('returns null for blank or non-summary values', () => {
    expect(parseSummaryLabel(null)).toBeNull();
    expect(parseSummaryLabel(undefined)).toBeNull();
    expect(parseSummaryLabel('')).toBeNull();
    expect(parseSummaryLabel('   ')).toBeNull();
    expect(parseSummaryLabel('2025-01-15')).toBeNull();
    expect(parseSummaryLabel('not a label')).toBeNull();
  });

  it('recognizes 월계 as monthly summary', () => {
    expect(parseSummaryLabel('월계')).toBe('monthly');
    expect(parseSummaryLabel('  월계  ')).toBe('monthly');
  });

  it('recognizes 누계 as cumulative', () => {
    expect(parseSummaryLabel('누계')).toBe('cumulative');
  });

  it('recognizes 소계/합계/총계 as generic subtotals', () => {
    expect(parseSummaryLabel('소계')).toBe('subtotal');
    expect(parseSummaryLabel('합계')).toBe('subtotal');
    expect(parseSummaryLabel('총계')).toBe('subtotal');
  });

  it('does NOT match labels that merely contain the keywords', () => {
    // Strict equality avoids false positives like a vendor or memo containing
    // these substrings being misclassified as a summary row.
    expect(parseSummaryLabel('월계산서')).toBeNull();
    expect(parseSummaryLabel('누계 (참고)')).toBeNull();
  });
});
