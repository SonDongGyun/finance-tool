import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Smoke-level integration tests: cover the navigation skeleton (landing → mode →
// upload, and back) without touching the file-parser or analyzer pipeline.
// File-driven flows are covered by analyzer/component unit tests separately.
//
// AnimatePresence mode="wait" delays mounting the next view until exit
// animations finish — use findBy* for cross-transition assertions.
describe('App navigation', () => {
  it('renders the landing page on initial mount', () => {
    render(<App />);
    expect(screen.getByText('어떤 방식으로 비교할까요?')).toBeInTheDocument();
    expect(screen.getByText('월별 비교')).toBeInTheDocument();
    expect(screen.getByText('시트별 비교')).toBeInTheDocument();
  });

  it('moves into the upload step (월별) and exposes the file dropzone', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('월별 비교'));
    // Wait for the AnimatePresence exit→enter transition.
    expect(await screen.findByText(/월별 비교 모드/)).toBeInTheDocument();
    expect(screen.queryByText('어떤 방식으로 비교할까요?')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/엑셀 파일 업로드/)).toBeInTheDocument();
  });

  it('moves into the upload step (시트별) and labels the mode accordingly', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('시트별 비교'));
    expect(await screen.findByText(/시트별 비교 모드/)).toBeInTheDocument();
    expect(screen.getByLabelText(/엑셀 파일 업로드/)).toBeInTheDocument();
  });

  it('returns to landing when "모드 선택으로" is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('월별 비교'));
    const backBtn = await screen.findByRole('button', { name: /모드 선택으로/ });
    await user.click(backBtn);
    expect(await screen.findByText('어떤 방식으로 비교할까요?')).toBeInTheDocument();
  });
});
