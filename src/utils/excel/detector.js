import { COLUMN_KEYWORDS } from '../../constants/columnKeywords';

function findByKeywords(headers, keywords) {
  return headers.find(h => {
    const lower = h.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }) || null;
}

export function detectDateColumn(headers) {
  return findByKeywords(headers, COLUMN_KEYWORDS.date);
}

export function detectAmountColumns(headers) {
  return {
    debit:  findByKeywords(headers, COLUMN_KEYWORDS.debit) || undefined,
    credit: findByKeywords(headers, COLUMN_KEYWORDS.credit) || undefined,
    amount: findByKeywords(headers, COLUMN_KEYWORDS.amount) || undefined,
  };
}

export function detectCategoryColumn(headers) {
  return findByKeywords(headers, COLUMN_KEYWORDS.category);
}

export function detectDescriptionColumn(headers) {
  return findByKeywords(headers, COLUMN_KEYWORDS.description);
}

export function detectVendorColumn(headers) {
  return findByKeywords(headers, COLUMN_KEYWORDS.vendor);
}
