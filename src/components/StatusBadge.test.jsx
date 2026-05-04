import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the Korean label for each known status', () => {
    const cases = [
      ['new', '신규'],
      ['removed', '제거'],
      ['increased', '증가'],
      ['decreased', '감소'],
      ['unchanged', '동일'],
    ];
    for (const [status, label] of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders nothing for an unknown status', () => {
    const { container } = render(<StatusBadge status="bogus" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('default variant includes the icon for statuses that define one', () => {
    // 'new' has Plus icon; the icon renders as an <svg>.
    const { container } = render(<StatusBadge status="new" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('compact variant omits the icon and border', () => {
    const { container } = render(<StatusBadge status="new" variant="compact" />);
    expect(container.querySelector('svg')).toBeNull();
    // Compact uses inline-block (no flex, no border) — sanity check via style.
    const span = container.querySelector('span');
    expect(span.style.display).toBe('inline-block');
  });
});
