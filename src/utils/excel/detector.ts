import { COLUMN_KEYWORDS } from '../../constants/columnKeywords';
import type { DetectedAmountColumns } from '../../types';

function findByKeywords(headers: string[], keywords: string[]): string | null {
  return (
    headers.find(h => {
      const lower = h.toLowerCase();
      return keywords.some(k => lower.includes(k));
    }) || null
  );
}

export function detectDateColumn(headers: string[]): string | null {
  return findByKeywords(headers, COLUMN_KEYWORDS.date);
}

export function detectAmountColumns(headers: string[]): DetectedAmountColumns {
  return {
    debit: findByKeywords(headers, COLUMN_KEYWORDS.debit) || undefined,
    credit: findByKeywords(headers, COLUMN_KEYWORDS.credit) || undefined,
    amount: findByKeywords(headers, COLUMN_KEYWORDS.amount) || undefined,
  };
}

export function detectCategoryColumn(headers: string[]): string | null {
  return findByKeywords(headers, COLUMN_KEYWORDS.category);
}

export function detectDescriptionColumn(headers: string[]): string | null {
  return findByKeywords(headers, COLUMN_KEYWORDS.description);
}

export function detectVendorColumn(headers: string[]): string | null {
  return findByKeywords(headers, COLUMN_KEYWORDS.vendor);
}
