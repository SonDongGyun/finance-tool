import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from './SearchInput';

function setup(overrides = {}) {
  const props = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    term: '',
    onClear: vi.fn(),
    placeholder: '검색',
    ariaLabel: '검색 입력',
    ...overrides,
  };
  const utils = render(<SearchInput {...props} />);
  return { ...utils, props };
}

describe('SearchInput', () => {
  it('renders placeholder and aria-label on the input', () => {
    setup({ placeholder: '카테고리 검색', ariaLabel: '카테고리 검색 라벨' });
    const input = screen.getByLabelText('카테고리 검색 라벨');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '카테고리 검색');
  });

  it('fires onChange for each typed character', async () => {
    const user = userEvent.setup();
    const { props } = setup();
    const input = screen.getByLabelText('검색 입력');
    await user.type(input, 'abc');
    expect(props.onChange).toHaveBeenCalledTimes(3);
    // Last call carries the most recent character — value is controlled
    // by parent, so consecutive calls all see '' + key.
    expect(props.onChange).toHaveBeenLastCalledWith('c');
  });

  it('fires onSubmit on Enter, not on other keys', async () => {
    const user = userEvent.setup();
    const { props } = setup({ value: 'query' });
    const input = screen.getByLabelText('검색 입력');
    await user.type(input, '{Tab}'); // not Enter
    expect(props.onSubmit).not.toHaveBeenCalled();
    await user.type(input, '{Enter}');
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('hides the clear button when term is empty', () => {
    setup({ term: '' });
    expect(screen.queryByLabelText('검색어 지우기')).not.toBeInTheDocument();
  });

  it('shows the clear button when a term is committed and fires onClear when clicked', async () => {
    const user = userEvent.setup();
    const { props } = setup({ term: 'committed', value: 'committed' });
    const clear = screen.getByLabelText('검색어 지우기');
    expect(clear).toBeInTheDocument();
    await user.click(clear);
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it('respects the width prop on the input', () => {
    setup({ width: 220 });
    const input = screen.getByLabelText('검색 입력');
    expect(input.style.width).toBe('220px');
  });
});
