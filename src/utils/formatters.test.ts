import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMonthLabel,
  expandMonthRange,
  buildRangeKey,
  monthRangesOverlap,
} from './formatters';

describe('formatMoney', () => {
  it('returns "0" for zero', () => {
    expect(formatMoney(0)).toBe('0');
  });

  it('formats positive amounts with Korean locale grouping', () => {
    expect(formatMoney(1000)).toBe('1,000');
    expect(formatMoney(1234567)).toBe('1,234,567');
  });

  it('prefixes negatives with a minus', () => {
    expect(formatMoney(-1000)).toBe('-1,000');
    expect(formatMoney(-1234567)).toBe('-1,234,567');
  });
});

describe('formatMonthLabel', () => {
  it('formats a single month key as Korean year/month', () => {
    expect(formatMonthLabel('2025-03')).toBe('2025년 3월');
    expect(formatMonthLabel('2025-12')).toBe('2025년 12월');
  });

  it('formats a same-year range compactly', () => {
    expect(formatMonthLabel('2025-01~2025-03')).toBe('2025년 1~3월');
  });

  it('formats a cross-year range with both years', () => {
    expect(formatMonthLabel('2024-11~2025-02')).toBe('2024년 11월 ~ 2025년 2월');
  });

  it('returns empty string for empty input', () => {
    expect(formatMonthLabel('')).toBe('');
    // Defensive: nullish inputs are coerced to '' by the implementation.
    expect(formatMonthLabel(null as unknown as string)).toBe('');
    expect(formatMonthLabel(undefined as unknown as string)).toBe('');
  });
});

describe('expandMonthRange', () => {
  it('expands a same-month range to a single key', () => {
    expect(expandMonthRange('2025-03', '2025-03')).toEqual(['2025-03']);
  });

  it('expands within a year', () => {
    expect(expandMonthRange('2025-01', '2025-04')).toEqual([
      '2025-01', '2025-02', '2025-03', '2025-04',
    ]);
  });

  it('expands across a year boundary', () => {
    expect(expandMonthRange('2024-11', '2025-02')).toEqual([
      '2024-11', '2024-12', '2025-01', '2025-02',
    ]);
  });

  it('auto-orders reversed inputs', () => {
    // Documented behavior: rather than failing, swap and produce the range.
    expect(expandMonthRange('2025-04', '2025-01')).toEqual([
      '2025-01', '2025-02', '2025-03', '2025-04',
    ]);
  });

  it('returns [] for empty inputs', () => {
    expect(expandMonthRange('', '2025-01')).toEqual([]);
    expect(expandMonthRange('2025-01', '')).toEqual([]);
    expect(expandMonthRange('', '')).toEqual([]);
  });
});

describe('buildRangeKey', () => {
  it('returns the single key when start equals end', () => {
    expect(buildRangeKey('2025-03', '2025-03')).toBe('2025-03');
  });

  it('joins start and end with ~ in chronological order', () => {
    expect(buildRangeKey('2025-01', '2025-04')).toBe('2025-01~2025-04');
    expect(buildRangeKey('2025-04', '2025-01')).toBe('2025-01~2025-04');
  });

  it('returns empty string when either side is missing', () => {
    expect(buildRangeKey('', '2025-01')).toBe('');
    expect(buildRangeKey('2025-01', '')).toBe('');
  });
});

describe('monthRangesOverlap', () => {
  it('detects overlap by shared month key', () => {
    expect(monthRangesOverlap(['2025-01', '2025-02'], ['2025-02', '2025-03'])).toBe(true);
  });

  it('returns false when ranges are disjoint', () => {
    expect(monthRangesOverlap(['2025-01', '2025-02'], ['2025-03', '2025-04'])).toBe(false);
  });

  it('returns false for non-array inputs', () => {
    // Defensive guard tested directly — runtime accepts these even though the
    // signature requires arrays.
    expect(monthRangesOverlap(null as unknown as string[], ['2025-01'])).toBe(false);
    expect(monthRangesOverlap(['2025-01'], undefined as unknown as string[])).toBe(false);
  });

  it('returns false when either side is empty', () => {
    expect(monthRangesOverlap([], ['2025-01'])).toBe(false);
    expect(monthRangesOverlap(['2025-01'], [])).toBe(false);
  });
});
