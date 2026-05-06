import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders the brand title in both compact and hero variants', () => {
    const { rerender } = render(<Header isCompact />);
    expect(screen.getByText('다비치 재무팀 분석 툴')).toBeInTheDocument();
    rerender(<Header isCompact={false} />);
    expect(screen.getByText('다비치 재무팀 분석 툴')).toBeInTheDocument();
  });

  it('renders feature cards only in the hero variant', () => {
    const { rerender } = render(<Header isCompact />);
    expect(screen.queryByText('엑셀 업로드')).not.toBeInTheDocument();
    rerender(<Header isCompact={false} />);
    expect(screen.getByText('엑셀 업로드')).toBeInTheDocument();
    expect(screen.getByText('기간·연도별 비교')).toBeInTheDocument();
    expect(screen.getByText('인사이트 도출')).toBeInTheDocument();
  });
});
