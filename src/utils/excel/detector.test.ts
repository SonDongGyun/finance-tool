import { describe, it, expect } from 'vitest';
import {
  detectDateColumn,
  detectAmountColumns,
  detectCategoryColumn,
  detectDescriptionColumn,
  detectVendorColumn,
} from './detector';

describe('detectDateColumn', () => {
  it('matches Korean date keywords', () => {
    expect(detectDateColumn(['일자', '계정', '금액'])).toBe('일자');
    expect(detectDateColumn(['거래일', '금액'])).toBe('거래일');
    expect(detectDateColumn(['회계일자', '항목'])).toBe('회계일자');
  });

  it('matches English date keyword case-insensitively', () => {
    expect(detectDateColumn(['Date', 'Amount'])).toBe('Date');
    expect(detectDateColumn(['DATE', 'amount'])).toBe('DATE');
  });

  it('returns null when nothing matches', () => {
    expect(detectDateColumn(['금액', '계정', '거래처'])).toBeNull();
  });
});

describe('detectAmountColumns', () => {
  it('finds debit/credit pair', () => {
    expect(detectAmountColumns(['일자', '차변', '대변', '계정'])).toEqual({
      debit: '차변',
      credit: '대변',
      amount: undefined,
    });
  });

  it('finds single amount column', () => {
    const result = detectAmountColumns(['일자', '금액', '계정']);
    expect(result.amount).toBe('금액');
  });

  it('returns undefined fields when not found', () => {
    const result = detectAmountColumns(['일자', '계정']);
    expect(result.debit).toBeUndefined();
    expect(result.credit).toBeUndefined();
    expect(result.amount).toBeUndefined();
  });
});

describe('detectCategoryColumn', () => {
  it('matches account/category keywords', () => {
    expect(detectCategoryColumn(['일자', '계정과목', '금액'])).toBe('계정과목');
    expect(detectCategoryColumn(['일자', '비목', '금액'])).toBe('비목');
  });

  it('does NOT match 적요 (regression: that keyword belongs to description)', () => {
    // Before the fix, '적요' was in both category and description keyword
    // lists, causing the same column to be auto-selected for both fields.
    expect(detectCategoryColumn(['일자', '적요', '금액'])).toBeNull();
  });
});

describe('detectDescriptionColumn', () => {
  it('matches description keywords including 적요', () => {
    expect(detectDescriptionColumn(['일자', '적요', '금액'])).toBe('적요');
    expect(detectDescriptionColumn(['일자', '비고', '금액'])).toBe('비고');
    expect(detectDescriptionColumn(['일자', '메모', '금액'])).toBe('메모');
  });
});

describe('detectVendorColumn', () => {
  it('matches vendor keywords', () => {
    expect(detectVendorColumn(['일자', '거래처', '금액'])).toBe('거래처');
    expect(detectVendorColumn(['일자', '공급자', '금액'])).toBe('공급자');
  });

  it('returns null when none match', () => {
    expect(detectVendorColumn(['일자', '금액', '계정'])).toBeNull();
  });
});
