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
