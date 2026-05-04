// Shared domain types — referenced from utils, state, and components.
// Kept in one file to avoid circular re-exports as the surface grows.

export type Status = 'new' | 'removed' | 'increased' | 'decreased' | 'unchanged';

export type Mode = 'monthly' | 'sheet';

export interface AmountColumns {
  debit?: string;
  credit?: string;
  amount?: string;
}

export interface ColumnConfig {
  dateColumn: string;
  amountColumns: AmountColumns;
  categoryColumn: string | null;
  descriptionColumn: string | null;
  vendorColumn: string | null;
}

// Output of parseWorkbook / parseExcelFile. Rows are tagged with `_sheet`
// so cross-sheet aggregation can identify origin.
export interface ParsedRow {
  _sheet?: string;
  [key: string]: unknown;
}

export interface ParsedFile {
  sheetName: string;
  sheetNames: string[];
  headers: string[];
  rows: ParsedRow[];
  rowsBySheet: Record<string, ParsedRow[]>;
  totalRows: number;
}

// Per-row analysis tuple after parseDate/parseAmount + categorization.
export interface AnalysisEntry extends ParsedRow {
  _amount: number;
  _category: string;
  _description: string;
  _vendor: string;
  _date: Date;
}

export interface SideSummary {
  label: string;
  total: number;
  count: number;
  months: string[];
}

export interface CategoryComparison {
  category: string;
  prevAmount: number;
  currAmount: number;
  diff: number;
  pctChange: number;
  status: Status;
  prevItems: AnalysisEntry[];
  currItems: AnalysisEntry[];
}

export interface VendorComparison {
  vendor: string;
  category: string;
  prevAmount: number;
  currAmount: number;
  diff: number;
  status: Exclude<Status, 'unchanged'>;
  prevItems: AnalysisEntry[];
  currItems: AnalysisEntry[];
}

export interface AnalysisResult {
  month1: SideSummary;
  month2: SideSummary;
  totalDiff: number;
  totalPctChange: number;
  categoryComparison: CategoryComparison[];
  vendorComparison: VendorComparison[];
  newItems: CategoryComparison[];
  removedItems: CategoryComparison[];
  increasedItems: CategoryComparison[];
  decreasedItems: CategoryComparison[];
  skippedRowCount: number;
  // 월계/누계 라벨로 자동 인식되어 silently 처리된 행 수.
  // 사용자에게 "데이터 손실 아님" 정보용으로 표시.
  skippedSummaryCount: number;
  // 개별 거래 없이 월계 행으로만 분석된 계정 목록 (분석 신뢰성 안내용).
  monthlyOnlyCategories: string[];
}

// Sheet-mode analysis: each sheet contributes its dominant year + months.
export interface SheetInfo {
  name: string;
  year: number | null;
  label: string;
  months: string[];
  rowCount: number;
}

// Side selection for sheet-mode comparison.
export interface SideSelection {
  sheetName: string;
  checkedMonths: Set<string>;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface DetectedAmountColumns {
  debit: string | undefined;
  credit: string | undefined;
  amount: string | undefined;
}

// Internal extension of ColumnConfig used by analyzer to pass partitioned months.
export interface AnalyzeMonthlyConfig extends ColumnConfig {
  months1?: string[];
  months2?: string[];
  month1?: string;
  month2?: string;
}
