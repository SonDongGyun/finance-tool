import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColumnMapper from './ColumnMapper';

const koreanHeaders = ['회계일자', '계정과목', '차변', '대변', '적요', '거래처'];
const englishHeaders = ['date', 'category', 'amount', 'description', 'vendor'];

describe('ColumnMapper', () => {
  it('auto-detects standard Korean headers and pre-fills selects', () => {
    render(<ColumnMapper headers={koreanHeaders} onConfirm={vi.fn()} />);
    // Auto-detection wires 회계일자 → date column.
    const dateLabel = screen.getByText(/날짜 컬럼/);
    const dateSelect = dateLabel.closest('div')?.querySelector('select');
    expect(dateSelect).toHaveValue('회계일자');
  });

  it('switches between debit/credit and single-amount mode', async () => {
    const user = userEvent.setup();
    render(<ColumnMapper headers={englishHeaders} onConfirm={vi.fn()} />);
    // English headers lack 차변/대변, so we should default to single 금액.
    expect(screen.getByText(/금액 컬럼/)).toBeInTheDocument();
    // Switching to 차변/대변 reveals the two amount fields.
    await user.click(screen.getByText('차변/대변'));
    expect(screen.getByText(/차변\(지출\) 컬럼/)).toBeInTheDocument();
    expect(screen.getByText(/대변\(수입\) 컬럼/)).toBeInTheDocument();
  });

  it('emits the assembled ColumnConfig on confirm with debit/credit mode', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ColumnMapper headers={koreanHeaders} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /컬럼 매핑 확인/ }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      dateColumn: '회계일자',
      amountColumns: { debit: '차변', credit: '대변' },
      categoryColumn: '계정과목',
    }));
  });

  it('disables confirm button when required selections are blank', () => {
    // No headers means no auto-detect and the date select stays empty.
    render(<ColumnMapper headers={[]} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /컬럼 매핑 확인/ })).toBeDisabled();
  });
});
