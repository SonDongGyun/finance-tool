import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExportButtons from './ExportButtons';
import type { AnalysisResult } from '../types';

const stubResult: AnalysisResult = {
  month1: { label: '2026-01', total: 0, count: 0, months: ['2026-01'] },
  month2: { label: '2026-02', total: 0, count: 0, months: ['2026-02'] },
  totalDiff: 0,
  totalPctChange: 0,
  categoryComparison: [],
  vendorComparison: [],
  newItems: [],
  removedItems: [],
  increasedItems: [],
  decreasedItems: [],
  skippedRowCount: 0,
  skippedSummaryCount: 0,
  monthlyOnlyCategories: [],
};

describe('ExportButtons', () => {
  it('renders both PDF and PPTX buttons in idle state', () => {
    render(<ExportButtons result={stubResult} />);
    expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /PPTX/ })).toBeEnabled();
    expect(screen.getByText('내보내기')).toBeInTheDocument();
  });

  // Note: The actual click triggers a dynamic import of utils/exportPdf which
  // we don't exercise here — the export pipeline is tested by the underlying
  // util tests. This file just confirms the buttons exist and are wired.
});
