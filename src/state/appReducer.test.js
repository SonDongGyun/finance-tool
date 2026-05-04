import { describe, it, expect } from 'vitest';
import {
  appReducer,
  initialState,
  PASSWORD_INITIAL,
  EMPTY_RANGE,
} from './appReducer';
import {
  STEP_LANDING,
  STEP_UPLOAD,
  STEP_MAPPING,
  STEP_SELECT,
  STEP_RESULT,
  MODE_MONTHLY,
  MODE_SHEET,
} from '../constants/steps';

// Helper: build a mid-flight state so we can verify resets are exhaustive.
function midFlowState(overrides = {}) {
  return {
    ...initialState,
    step: STEP_RESULT,
    mode: MODE_SHEET,
    fileData: { rows: [{ a: 1 }], headers: ['a'] },
    columnConfig: { dateColumn: 'a' },
    months: ['2025-01', '2025-02'],
    monthlyMode: 'range',
    range1: { start: '2025-01', end: '2025-01' },
    range2: { start: '2025-02', end: '2025-02' },
    sheetInfos: [{ name: 'S1', months: ['2025-01'] }],
    side1: { sheetName: 'S1', checkedMonths: new Set(['2025-01']) },
    side2: { sheetName: 'S2', checkedMonths: new Set(['2025-02']) },
    analysisResult: { totalDiff: 100 },
    ...overrides,
  };
}

describe('initial state', () => {
  it('starts at landing in monthly mode with cleared form fields', () => {
    expect(initialState.step).toBe(STEP_LANDING);
    expect(initialState.mode).toBe(MODE_MONTHLY);
    expect(initialState.fileData).toBeNull();
    expect(initialState.analysisResult).toBeNull();
    expect(initialState.password).toEqual(PASSWORD_INITIAL);
  });
});

describe('SELECT_MODE', () => {
  it('jumps to upload step with the chosen mode and clears all prior data', () => {
    const state = midFlowState({ mode: MODE_MONTHLY });
    const next = appReducer(state, { type: 'SELECT_MODE', mode: MODE_SHEET });
    expect(next.step).toBe(STEP_UPLOAD);
    expect(next.mode).toBe(MODE_SHEET);
    expect(next.fileData).toBeNull();
    expect(next.analysisResult).toBeNull();
    expect(next.range1).toBe(EMPTY_RANGE);
  });
});

describe('BACK_TO_LANDING', () => {
  it('resets every field — regression: prior versions had to set 10 fields manually', () => {
    const state = midFlowState();
    const next = appReducer(state, { type: 'BACK_TO_LANDING' });
    expect(next).toEqual(initialState);
  });
});

describe('FILE_PARSED', () => {
  it('moves to mapping, stores parsed data, and clears any open password modal', () => {
    const state = midFlowState({
      step: STEP_UPLOAD,
      password: { open: true, file: new File([''], 'a.xlsx'), error: 'wrong', loading: true },
    });
    const parsed = { rows: [{ x: 1 }], headers: ['x'] };
    const next = appReducer(state, { type: 'FILE_PARSED', parsed });
    expect(next.step).toBe(STEP_MAPPING);
    expect(next.fileData).toBe(parsed);
    expect(next.analysisResult).toBeNull();
    expect(next.password).toEqual(PASSWORD_INITIAL);
  });
});

describe('PASSWORD lifecycle', () => {
  it('REQUIRED opens the modal with a fresh state', () => {
    const file = new File([''], 'enc.xlsx');
    const next = appReducer(initialState, { type: 'PASSWORD_REQUIRED', file });
    expect(next.password).toEqual({ open: true, file, error: '', loading: false });
  });

  it('SUBMITTING flips loading on and clears prior error without losing the file', () => {
    const file = new File([''], 'enc.xlsx');
    const open = appReducer(initialState, { type: 'PASSWORD_REQUIRED', file });
    const failed = appReducer(open, { type: 'PASSWORD_FAILED', error: '암호 오류' });
    const next = appReducer(failed, { type: 'PASSWORD_SUBMITTING' });
    expect(next.password.loading).toBe(true);
    expect(next.password.error).toBe('');
    expect(next.password.file).toBe(file);
    expect(next.password.open).toBe(true);
  });

  it('FAILED preserves file/open and surfaces the error', () => {
    const file = new File([''], 'enc.xlsx');
    const submitting = appReducer(
      appReducer(initialState, { type: 'PASSWORD_REQUIRED', file }),
      { type: 'PASSWORD_SUBMITTING' },
    );
    const next = appReducer(submitting, { type: 'PASSWORD_FAILED', error: '암호가 올바르지 않습니다.' });
    expect(next.password.loading).toBe(false);
    expect(next.password.error).toBe('암호가 올바르지 않습니다.');
    expect(next.password.file).toBe(file);
    expect(next.password.open).toBe(true);
  });

  it('CLOSED wipes the password slot completely', () => {
    const file = new File([''], 'enc.xlsx');
    const open = appReducer(initialState, { type: 'PASSWORD_REQUIRED', file });
    const next = appReducer(open, { type: 'PASSWORD_CLOSED' });
    expect(next.password).toEqual(PASSWORD_INITIAL);
  });
});

describe('COLUMN_CONFIRMED', () => {
  it('moves to select step and stores the column config', () => {
    const state = { ...initialState, step: STEP_MAPPING };
    const config = { dateColumn: 'date', amountColumns: { amount: 'amt' } };
    const next = appReducer(state, {
      type: 'COLUMN_CONFIRMED',
      config,
      months: ['2025-01', '2025-02'],
      sheetInfos: [],
    });
    expect(next.step).toBe(STEP_SELECT);
    expect(next.columnConfig).toBe(config);
    expect(next.months).toEqual(['2025-01', '2025-02']);
  });

  it('keeps existing range/side when action omits them (?? state.range1 fallback)', () => {
    const state = midFlowState({ step: STEP_MAPPING });
    const next = appReducer(state, {
      type: 'COLUMN_CONFIRMED',
      config: { dateColumn: 'date' },
      months: ['2025-03'],
      sheetInfos: [],
    });
    // Ranges weren't in the action → should retain mid-flow values.
    expect(next.range1).toEqual({ start: '2025-01', end: '2025-01' });
    expect(next.range2).toEqual({ start: '2025-02', end: '2025-02' });
  });

  it('overrides range/side when action provides them', () => {
    const state = { ...initialState, step: STEP_MAPPING };
    const newRange1 = { start: '2025-01', end: '2025-01' };
    const newRange2 = { start: '2025-02', end: '2025-02' };
    const next = appReducer(state, {
      type: 'COLUMN_CONFIRMED',
      config: { dateColumn: 'date' },
      months: ['2025-01', '2025-02'],
      sheetInfos: [],
      range1: newRange1,
      range2: newRange2,
    });
    expect(next.range1).toBe(newRange1);
    expect(next.range2).toBe(newRange2);
  });
});

describe('ANALYSIS_DONE / BACK_TO_SELECT', () => {
  it('ANALYSIS_DONE jumps to result with the computed payload', () => {
    const state = { ...initialState, step: STEP_SELECT };
    const result = { totalDiff: 1000, categoryComparison: [] };
    const next = appReducer(state, { type: 'ANALYSIS_DONE', result });
    expect(next.step).toBe(STEP_RESULT);
    expect(next.analysisResult).toBe(result);
  });

  it('BACK_TO_SELECT returns to selection and clears the result', () => {
    const state = midFlowState();
    const next = appReducer(state, { type: 'BACK_TO_SELECT' });
    expect(next.step).toBe(STEP_SELECT);
    expect(next.analysisResult).toBeNull();
    // Other fields preserved.
    expect(next.columnConfig).toBe(state.columnConfig);
  });
});

describe('SET_* setters are pure field assignments', () => {
  it('SET_MONTHLY_MODE updates only monthlyMode', () => {
    const next = appReducer(initialState, { type: 'SET_MONTHLY_MODE', value: 'range' });
    expect(next.monthlyMode).toBe('range');
    expect(next.step).toBe(initialState.step);
  });

  it('SET_RANGE1 / SET_RANGE2 update independent slots', () => {
    const r1 = appReducer(initialState, {
      type: 'SET_RANGE1',
      value: { start: '2025-01', end: '2025-02' },
    });
    expect(r1.range1).toEqual({ start: '2025-01', end: '2025-02' });
    expect(r1.range2).toBe(initialState.range2);

    const r2 = appReducer(r1, {
      type: 'SET_RANGE2',
      value: { start: '2025-03', end: '2025-04' },
    });
    expect(r2.range1).toEqual({ start: '2025-01', end: '2025-02' });
    expect(r2.range2).toEqual({ start: '2025-03', end: '2025-04' });
  });

  it('SET_SIDE1 / SET_SIDE2 carry the Set instance through', () => {
    const months = new Set(['2025-01', '2025-02']);
    const next = appReducer(initialState, {
      type: 'SET_SIDE1',
      value: { sheetName: 'S1', checkedMonths: months },
    });
    expect(next.side1.sheetName).toBe('S1');
    expect(next.side1.checkedMonths).toBe(months);
  });
});

describe('unknown action', () => {
  it('returns state unchanged for unknown action types', () => {
    const next = appReducer(initialState, { type: 'NOT_A_REAL_ACTION' });
    expect(next).toBe(initialState);
  });
});
