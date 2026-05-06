import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import FileUpload from './FileUpload';

// Object.defineProperty avoids actually allocating 51 MB of buffer just to
// produce a File with `.size` set.
function makeFile(name: string, sizeBytes: number): File {
  const file = new File([''], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error('file input not found');
  return input;
}

describe('FileUpload', () => {
  it('rejects unsupported extensions before calling onFileLoaded', () => {
    const onFileLoaded = vi.fn();
    const { container } = render(<FileUpload onFileLoaded={onFileLoaded} isLoaded={false} />);
    const input = getFileInput(container);
    const pdf = makeFile('report.pdf', 1024);
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(onFileLoaded).not.toHaveBeenCalled();
    expect(screen.getByText(/엑셀 파일.*또는 CSV 파일/)).toBeInTheDocument();
  });

  it('rejects files over the 50MB cap before reading them', () => {
    const onFileLoaded = vi.fn();
    const { container } = render(<FileUpload onFileLoaded={onFileLoaded} isLoaded={false} />);
    const input = getFileInput(container);
    const big = makeFile('huge.xlsx', 51 * 1024 * 1024); // 51 MB
    fireEvent.change(input, { target: { files: [big] } });
    expect(onFileLoaded).not.toHaveBeenCalled();
    // Error string includes the rendered MB and the 50MB limit.
    expect(screen.getByText(/51\.0MB.*50MB/)).toBeInTheDocument();
  });

  it('accepts valid extensions within the size cap', async () => {
    const onFileLoaded = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<FileUpload onFileLoaded={onFileLoaded} isLoaded={false} />);
    const input = getFileInput(container);
    const file = makeFile('data.xlsx', 1024 * 1024); // 1 MB
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onFileLoaded).toHaveBeenCalledTimes(1));
    expect(onFileLoaded).toHaveBeenCalledWith(file);
  });

  it('resets input.value after change so re-selecting the same file fires onChange again', () => {
    const { container } = render(<FileUpload onFileLoaded={vi.fn()} isLoaded={false} />);
    const input = getFileInput(container);
    const file = makeFile('data.xlsx', 1024);
    fireEvent.change(input, { target: { files: [file] } });
    // After our handler runs, the value should be cleared so a subsequent
    // selection of the same file path still emits a change event.
    expect(input.value).toBe('');
  });

  it('surfaces async errors from onFileLoaded', async () => {
    const onFileLoaded = vi.fn().mockRejectedValue(new Error('파일 형식이 잘못되었습니다'));
    const { container } = render(<FileUpload onFileLoaded={onFileLoaded} isLoaded={false} />);
    const input = getFileInput(container);
    const file = makeFile('data.xlsx', 1024);
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('파일 형식이 잘못되었습니다')).toBeInTheDocument();
    });
  });

  it('shows loaded confirmation when isLoaded is true', () => {
    render(<FileUpload onFileLoaded={vi.fn()} isLoaded />);
    expect(screen.getByText('파일 로드 완료')).toBeInTheDocument();
  });

  it('csv extension is accepted alongside xlsx', () => {
    const onFileLoaded = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<FileUpload onFileLoaded={onFileLoaded} isLoaded={false} />);
    const input = getFileInput(container);
    const csv = makeFile('rows.csv', 1024);
    fireEvent.change(input, { target: { files: [csv] } });
    expect(onFileLoaded).toHaveBeenCalledWith(csv);
  });
});
