// Substring matchers for header auto-detection. Each detector picks the first
// header whose lowercased text contains any of the listed substrings.
//
// Editing notes:
// - '적요' lives only under DESCRIPTION (was duplicated in CATEGORY before; that
//   caused the same column to be auto-selected for both fields).
// - English keywords are matched case-insensitively because detector
//   lowercases the header before testing.
export const COLUMN_KEYWORDS = {
  date:        ['일자', '날짜', '일시', 'date', '회계일자', '거래일', '발생일'],
  debit:       ['차변', 'debit', '출금', '지출'],
  credit:      ['대변', 'credit', '입금', '수입'],
  amount:      ['금액', 'amount', '거래금액', '거래액'],
  category:    ['계정', '과목', '항목', 'category', 'account', '비목'],
  description: ['적요', '내용', '설명', 'description', '비고', '메모'],
  vendor:      ['거래처', '업체', 'vendor', '상호', '공급자'],
};
