import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusFilterBar, { type StatusFilterCounts } from './StatusFilterBar';

const COUNTS: StatusFilterCounts = { new: 3, removed: 1, increased: 5, decreased: 2 };

describe('StatusFilterBar', () => {
  it('renders five filter buttons in the documented order', () => {
    render(<StatusFilterBar value="all" onChange={() => {}} counts={COUNTS} />);
    const labels = screen.getAllByRole('button').map(b => b.textContent ?? '');
    // counts get inlined into the button text — match the leading label.
    expect(labels[0].startsWith('전체')).toBe(true);
    expect(labels[1].startsWith('신규')).toBe(true);
    expect(labels[2].startsWith('제거')).toBe(true);
    expect(labels[3].startsWith('증가')).toBe(true);
    expect(labels[4].startsWith('감소')).toBe(true);
  });

  it('shows count beside each non-all button', () => {
    render(<StatusFilterBar value="all" onChange={() => {}} counts={COUNTS} />);
    expect(screen.getByText('신규').closest('button')?.textContent).toBe('신규3');
    expect(screen.getByText('증가').closest('button')?.textContent).toBe('증가5');
  });

  it('does not show a count next to "전체"', () => {
    render(<StatusFilterBar value="all" onChange={() => {}} counts={COUNTS} />);
    const allBtn = screen.getByText('전체').closest('button');
    expect(allBtn?.textContent).toBe('전체');
  });

  it('falls back to 0 when a status is missing from counts', () => {
    render(<StatusFilterBar value="all" onChange={() => {}} counts={{ new: 7 }} />);
    expect(screen.getByText('제거').closest('button')?.textContent).toBe('제거0');
  });

  it('omits counts entirely when counts prop is not provided', () => {
    render(<StatusFilterBar value="all" onChange={() => {}} />);
    const newBtn = screen.getByText('신규').closest('button');
    expect(newBtn?.textContent).toBe('신규');
  });

  it('invokes onChange with the clicked filter key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusFilterBar value="all" onChange={onChange} counts={COUNTS} />);
    const btn = screen.getByText('증가').closest('button');
    if (!btn) throw new Error('button not found');
    await user.click(btn);
    expect(onChange).toHaveBeenCalledWith('increased');
  });

  it('renders compact size with smaller padding', () => {
    const { rerender } = render(<StatusFilterBar value="all" onChange={() => {}} />);
    const defaultPadding = (screen.getByText('전체').closest('button') as HTMLButtonElement).style.padding;

    rerender(<StatusFilterBar value="all" onChange={() => {}} size="compact" />);
    const compactPadding = (screen.getByText('전체').closest('button') as HTMLButtonElement).style.padding;

    expect(defaultPadding).toBe('8px 16px');
    expect(compactPadding).toBe('6px 14px');
  });
});
