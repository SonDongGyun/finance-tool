import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryTabs from './CategoryTabs';

describe('CategoryTabs', () => {
  it('renders an 전체 tab plus one tab per category', () => {
    render(<CategoryTabs categories={['식비', '교통비']} selected="all" onSelect={vi.fn()} />);
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('식비')).toBeInTheDocument();
    expect(screen.getByText('교통비')).toBeInTheDocument();
  });

  it('emits the category key when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CategoryTabs categories={['식비', '교통비']} selected="all" onSelect={onSelect} />);
    await user.click(screen.getByText('식비'));
    expect(onSelect).toHaveBeenCalledWith('식비');
  });

  it('emits "all" when 전체 tab is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CategoryTabs categories={['식비']} selected="식비" onSelect={onSelect} />);
    await user.click(screen.getByText('전체'));
    expect(onSelect).toHaveBeenCalledWith('all');
  });
});
