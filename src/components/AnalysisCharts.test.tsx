import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalysisCharts from './AnalysisCharts';
import type { AnalysisResult, CategoryComparison } from '../types';

function makeCat(name: string, prev: number, curr: number): CategoryComparison {
  return {
    category: name,
    prevAmount: prev,
    currAmount: curr,
    diff: curr - prev,
    pctChange: prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0,
    status: curr > prev ? 'increased' : 'decreased',
    prevItems: [],
    currItems: [],
  };
}

function makeResult(): AnalysisResult {
  return {
    month1: { label: '2026-01', total: 3000, count: 3, months: ['2026-01'] },
    month2: { label: '2026-02', total: 4500, count: 3, months: ['2026-02'] },
    totalDiff: 1500,
    totalPctChange: 50,
    categoryComparison: [
      makeCat('식비', 1000, 1500),
      makeCat('교통비', 800, 1200),
      makeCat('통신비', 1200, 1800),
    ],
    vendorComparison: [],
    newItems: [],
    removedItems: [],
    increasedItems: [],
    decreasedItems: [],
    skippedRowCount: 0,
    skippedSummaryCount: 0,
    monthlyOnlyCategories: [],
  };
}

describe('AnalysisCharts', () => {
  it('renders the section heading and both view toggle buttons', () => {
    render(<AnalysisCharts result={makeResult()} />);
    expect(screen.getByText('카테고리별 비교')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /막대/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /파이/ })).toBeInTheDocument();
  });

  it('renders bar legend in bar view (default)', () => {
    render(<AnalysisCharts result={makeResult()} />);
    // Legend at bottom shows the two month labels.
    const legend1 = screen.getAllByText('2026년 1월');
    expect(legend1.length).toBeGreaterThan(0);
  });

  it('switches to pie view when 파이 is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalysisCharts result={makeResult()} />);
    await user.click(screen.getByRole('button', { name: /파이/ }));
    // AnimatePresence mode="wait" — wait for the new view to mount.
    const labels = await screen.findAllByText('2026년 1월');
    expect(labels.length).toBeGreaterThan(0);
  });
});
