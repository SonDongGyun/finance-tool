import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DetailTable from './DetailTable';
import type { AnalysisResult, CategoryComparison } from '../types';

function makeCategory(overrides: Partial<CategoryComparison>): CategoryComparison {
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

function makeResult(cats: CategoryComparison[]): AnalysisResult {
  return {
    month1: { label: '2026-01', total: 0, count: 0, months: ['2026-01'] },
    month2: { label: '2026-02', total: 0, count: 0, months: ['2026-02'] },
    totalDiff: 0,
    totalPctChange: 0,
    categoryComparison: cats,
    vendorComparison: [],
    newItems: cats.filter(c => c.status === 'new'),
    removedItems: cats.filter(c => c.status === 'removed'),
    increasedItems: cats.filter(c => c.status === 'increased'),
    decreasedItems: cats.filter(c => c.status === 'decreased'),
    skippedRowCount: 0,
    skippedSummaryCount: 0,
    monthlyOnlyCategories: [],
  };
}

describe('DetailTable', () => {
  it('renders all category rows with month-formatted column headers', () => {
    render(<DetailTable result={makeResult([
      makeCategory({ category: '식비', prevAmount: 1000, currAmount: 1500, diff: 500, status: 'increased' }),
      makeCategory({ category: '교통비', prevAmount: 800, currAmount: 600, diff: -200, status: 'decreased' }),
    ])} />);
    expect(screen.getByText('식비')).toBeInTheDocument();
    expect(screen.getByText('교통비')).toBeInTheDocument();
    // Header columns use formatMonthLabel.
    expect(screen.getByText('2026년 1월')).toBeInTheDocument();
    expect(screen.getByText('2026년 2월')).toBeInTheDocument();
  });

  it('filters rows by status chip', async () => {
    const user = userEvent.setup();
    render(<DetailTable result={makeResult([
      makeCategory({ category: '신규카테', currAmount: 1000, diff: 1000, status: 'new' }),
      makeCategory({ category: '증가카테', prevAmount: 500, currAmount: 1500, diff: 1000, status: 'increased' }),
    ])} />);
    await user.click(screen.getByRole('button', { name: /^신규/ }));
    expect(screen.getByText('신규카테')).toBeInTheDocument();
    expect(screen.queryByText('증가카테')).not.toBeInTheDocument();
  });

  it('filters rows by search term', async () => {
    const user = userEvent.setup();
    render(<DetailTable result={makeResult([
      makeCategory({ category: '광고비', currAmount: 1000, diff: 1000, status: 'new' }),
      makeCategory({ category: '복리후생비', currAmount: 2000, diff: 2000, status: 'new' }),
    ])} />);
    const search = screen.getByLabelText(/카테고리 검색/);
    await user.type(search, '광고{Enter}');
    expect(screen.getByText('광고비')).toBeInTheDocument();
    expect(screen.queryByText('복리후생비')).not.toBeInTheDocument();
  });

  it('shows the empty placeholder when no rows match', async () => {
    const user = userEvent.setup();
    render(<DetailTable result={makeResult([
      makeCategory({ category: '식비', currAmount: 1000, diff: 1000, status: 'new' }),
    ])} />);
    const search = screen.getByLabelText(/카테고리 검색/);
    await user.type(search, '없음{Enter}');
    expect(screen.getByText('해당하는 항목이 없습니다')).toBeInTheDocument();
  });
});
