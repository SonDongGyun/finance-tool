// Backward compatibility - re-exports from modular files
export { parseExcelFile } from './excel/parser';
export { detectDateColumn, detectAmountColumns, detectCategoryColumn, detectDescriptionColumn, detectVendorColumn } from './excel/detector';
export { analyzeMonthlyChanges, extractMonths } from './excel/analyzer';
export { formatMoney, formatMonthLabel, expandMonthRange, buildRangeKey } from './formatters';
export { decryptAndParse } from '../services/decryptService';
