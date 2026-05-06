import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VendorTable from './VendorTable';
import type { AnalysisResult, VendorComparison } from '../types';

function makeVendor(overrides: Partial<VendorComparison>): VendorComparison {
  return {
    vendor: 'A업체',
    category: '식비',
    prevAmount: 0,
    currAmount: 0,
    diff: 0,
    status: 'increased',
    prevItems: [],
    currItems: [],
    ...overrides,
  };
}

function makeResult(vendors: VendorComparison[]): AnalysisResult {
  return {
    month1: { label: '2026-01', total: 0, count: 0, months: ['2026-01'] },
    month2: { label: '2026-02', total: 0, count: 0, months: ['2026-02'] },
    totalDiff: 0,
    totalPctChange: 0,
    categoryComparison: [],
    vendorComparison: vendors,
    newItems: [],
    removedItems: [],
    increasedItems: [],
    decreasedItems: [],
    skippedRowCount: 0,
    skippedSummaryCount: 0,
    monthlyOnlyCategories: [],
  };
}

describe('VendorTable', () => {
  it('renders nothing when there are no vendor comparisons', () => {
    const { container } = render(<VendorTable result={makeResult([])} />);
    expect(container.firstChild).toBeNull();
  });

  it('lists vendor rows and total count', () => {
    render(<VendorTable result={makeResult([
      makeVendor({ vendor: 'A업체', currAmount: 1000, diff: 1000, status: 'new' }),
      makeVendor({ vendor: 'B업체', prevAmount: 500, currAmount: 1500, diff: 1000, status: 'increased' }),
    ])} />);
    expect(screen.getByText('A업체')).toBeInTheDocument();
    expect(screen.getByText('B업체')).toBeInTheDocument();
    expect(screen.getByText('(2건)')).toBeInTheDocument();
  });

  it('filters by status when 신규 chip clicked', async () => {
    const user = userEvent.setup();
    render(<VendorTable result={makeResult([
      makeVendor({ vendor: 'NEW업체', currAmount: 1000, diff: 1000, status: 'new' }),
      makeVendor({ vendor: 'INC업체', prevAmount: 500, currAmount: 1500, diff: 1000, status: 'increased' }),
    ])} />);
    await user.click(screen.getByRole('button', { name: /^신규/ }));
    expect(screen.getByText('NEW업체')).toBeInTheDocument();
    expect(screen.queryByText('INC업체')).not.toBeInTheDocument();
  });

  it('filters by search term when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<VendorTable result={makeResult([
      makeVendor({ vendor: '특이업체', currAmount: 1000, diff: 1000, status: 'new' }),
      makeVendor({ vendor: '평범업체', currAmount: 1000, diff: 1000, status: 'new' }),
    ])} />);
    const search = screen.getByLabelText(/거래처 검색/);
    await user.type(search, '특이{Enter}');
    expect(screen.getByText('특이업체')).toBeInTheDocument();
    expect(screen.queryByText('평범업체')).not.toBeInTheDocument();
  });
});
