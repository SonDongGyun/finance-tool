import type { CSSProperties } from 'react';
import { COLORS } from '../constants/colors';

export type CellAlign = 'left' | 'right' | 'center';

// Header cell. clickable=true gives a pointer cursor for sortable columns.
// align defaults to left; right is used for amount columns, center for
// status/badge columns.
export const thStyle = (clickable: boolean = false, align: CellAlign = 'left'): CSSProperties => ({
  textAlign: align,
  padding: '14px 16px',
  fontSize: '12px',
  fontWeight: 700,
  color: COLORS.sub,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  cursor: clickable ? 'pointer' : 'default',
});

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
};

// Pagination/list-action button — DetailTable·VendorTable use 'md' inside table
// pagination footers; AnalysisSummary uses 'sm' inside dense section cards.
export type ListBtnSize = 'sm' | 'md';

const LIST_BTN_BASE: CSSProperties = {
  borderRadius: '8px',
  fontWeight: 600,
  flex: 1,
  background: 'rgba(100,116,139,0.1)',
  color: COLORS.sub,
  border: '1px solid rgba(100,116,139,0.15)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

export const listBtnStyle = (size: ListBtnSize = 'md'): CSSProperties => ({
  ...LIST_BTN_BASE,
  padding: size === 'sm' ? '8px 16px' : '10px 16px',
  fontSize: size === 'sm' ? '12px' : '13px',
});
