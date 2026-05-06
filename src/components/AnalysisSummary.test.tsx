import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisSummary from './AnalysisSummary';
import type { AnalysisResult, CategoryComparison } from '../types';

function makeCategory(overrides: Partial<CategoryComparison> = {}): CategoryComparison {
  return {
    category: '식비',
    prevAmount: 0,
    currAmount: 0,
    diff: 0,
    pctChange: 0,
    status: 'unchanged',
    prevItems: [],
    currItems: [],
    ...overrides,
  };
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    month1: { label: '2026-01', total: 1_000_000, count: 10, months: ['2026-01'] },
    month2: { label: '2026-02', total: 1_500_000, count: 12, months: ['2026-02'] },
    totalDiff: 500_000,
    totalPctChange: 50,
    categoryComparison: [],
    vendorComparison: [],
    newItems: [],
    removedItems: [],
    increasedItems: [],
    decreasedItems: [],
    skippedRowCount: 0,
    skippedSummaryCount: 0,
    monthlyOnlyCategories: [],
    ...overrides,
  };
}

describe('AnalysisSummary', () => {
  it('renders the section heading', () => {
    render(<AnalysisSummary result={makeResult()} />);
    expect(screen.getByText('분석 요약')).toBeInTheDocument();
  });

  it('shows the total-diff sentence (increase phrasing)', () => {
    render(<AnalysisSummary result={makeResult()} />);
    expect(screen.getByText(/총 비용이 .* 증가했습니다/)).toBeInTheDocument();
  });

  it('shows decrease phrasing when totalDiff < 0', () => {
    render(<AnalysisSummary result={makeResult({
      totalDiff: -200_000,
      totalPctChange: -20,
    })} />);
    expect(screen.getByText(/감소했습니다/)).toBeInTheDocument();
  });

  it('shows the 주요 비용 변동 panel only when there are new/removed items', () => {
    const { rerender } = render(<AnalysisSummary result={makeResult()} />);
    expect(screen.queryByText('주요 비용 변동')).not.toBeInTheDocument();
    rerender(<AnalysisSummary result={makeResult({
      newItems: [makeCategory({ category: '신규', currAmount: 1_000_000, status: 'new' })],
    })} />);
    expect(screen.getByText('주요 비용 변동')).toBeInTheDocument();
  });

  it('renders empty placeholder when both lines and key changes are absent', () => {
    render(<AnalysisSummary result={makeResult({
      totalDiff: 0,
      totalPctChange: 0,
    })} />);
    // Equal totals path: produces a "총 비용이 동일합니다" line, so the empty
    // placeholder should NOT show — guard against a regression that would.
    expect(screen.queryByText('변동 사항이 없습니다.')).not.toBeInTheDocument();
    expect(screen.getByText(/총 비용이 동일합니다/)).toBeInTheDocument();
  });
});
