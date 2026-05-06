import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SheetComparator from './SheetComparator';
import type { SheetInfo, SideSelection } from '../types';

function makeSheet(name: string, year: number, months: string[]): SheetInfo {
  return {
    name,
    year,
    label: `${year}년`,
    months,
    rowCount: months.length * 10,
  };
}

interface SetupOverrides {
  sheets?: SheetInfo[];
  side1?: SideSelection;
  side2?: SideSelection;
}

function setup(overrides: SetupOverrides = {}) {
  const sheets = overrides.sheets ?? [
    makeSheet('Sheet2024', 2024, ['2024-01', '2024-02']),
    makeSheet('Sheet2025', 2025, ['2025-01', '2025-02']),
  ];
  const props = {
    sheets,
    side1: overrides.side1 ?? { sheetName: 'Sheet2024', checkedMonths: new Set(['2024-01', '2024-02']) },
    side2: overrides.side2 ?? { sheetName: 'Sheet2025', checkedMonths: new Set(['2025-01', '2025-02']) },
    onSide1Change: vi.fn(),
    onSide2Change: vi.fn(),
    onAnalyze: vi.fn(),
  };
  const utils = render(<SheetComparator {...props} />);
  return { ...utils, props };
}

describe('SheetComparator', () => {
  it('shows the helper card when fewer than 2 sheets exist', () => {
    setup({ sheets: [makeSheet('only', 2025, ['2025-01'])] });
    expect(screen.getByText(/시트 2개 이상이 필요합니다/)).toBeInTheDocument();
  });

  it('enables 분석 시작 only when both sides have at least one month and differ', async () => {
    const user = userEvent.setup();
    const { props } = setup();
    const btn = screen.getByRole('button', { name: '분석 시작' });
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(props.onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('keeps 분석 시작 disabled when no months are checked on a side', () => {
    setup({
      side1: { sheetName: 'Sheet2024', checkedMonths: new Set() },
      side2: { sheetName: 'Sheet2025', checkedMonths: new Set(['2025-01']) },
    });
    const btn = screen.getByRole('button', { name: /비교할 월을 체크/ });
    expect(btn).toBeDisabled();
  });

  it('toggles a month chip via onSide1Change when clicked', async () => {
    const user = userEvent.setup();
    const { props } = setup({
      side1: { sheetName: 'Sheet2024', checkedMonths: new Set() },
    });
    // Click the "1월" chip on the 기준 시트 side.
    const chips = screen.getAllByText(/^1월$/);
    await user.click(chips[0]);
    expect(props.onSide1Change).toHaveBeenCalledWith(
      expect.objectContaining({
        sheetName: 'Sheet2024',
        checkedMonths: expect.any(Set),
      }),
    );
    const next = props.onSide1Change.mock.calls[0][0];
    expect(next.checkedMonths.has('2024-01')).toBe(true);
  });

  it('전체선택 selects all months on that side', async () => {
    const user = userEvent.setup();
    const { props } = setup({
      side1: { sheetName: 'Sheet2024', checkedMonths: new Set() },
    });
    // The first 전체선택 button belongs to side1.
    const buttons = screen.getAllByText('전체선택');
    await user.click(buttons[0]);
    const next = props.onSide1Change.mock.calls[0][0];
    expect(Array.from(next.checkedMonths)).toEqual(['2024-01', '2024-02']);
  });
});
