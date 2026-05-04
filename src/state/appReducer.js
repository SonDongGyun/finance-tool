import {
  STEP_LANDING,
  STEP_UPLOAD,
  STEP_MAPPING,
  STEP_SELECT,
  STEP_RESULT,
  MODE_MONTHLY,
} from '../constants/steps';

export const EMPTY_RANGE = { start: '', end: '' };
export const EMPTY_SIDE = { sheetName: '', checkedMonths: new Set() };
export const PASSWORD_INITIAL = { open: false, file: null, error: '', loading: false };

export const initialState = {
  step: STEP_LANDING,
  mode: MODE_MONTHLY,
  fileData: null,
  columnConfig: null,
  months: [],
  monthlyMode: 'single',
  range1: EMPTY_RANGE,
  range2: EMPTY_RANGE,
  sheetInfos: [],
  side1: EMPTY_SIDE,
  side2: EMPTY_SIDE,
  analysisResult: null,
  password: PASSWORD_INITIAL,
};

// Single source of truth for all step/mode/file/comparison transitions.
// Previously these were 13 separate useStates whose resets had to be kept in
// sync manually — easy to forget a field on a new transition.
export function appReducer(state, action) {
  switch (action.type) {
    case 'SELECT_MODE':
      return { ...initialState, mode: action.mode, step: STEP_UPLOAD };

    case 'BACK_TO_LANDING':
      return { ...initialState };

    case 'FILE_PARSED':
      return {
        ...state,
        fileData: action.parsed,
        step: STEP_MAPPING,
        analysisResult: null,
        password: PASSWORD_INITIAL,
      };

    case 'PASSWORD_REQUIRED':
      return {
        ...state,
        password: { open: true, file: action.file, error: '', loading: false },
      };

    case 'PASSWORD_SUBMITTING':
      return {
        ...state,
        password: { ...state.password, loading: true, error: '' },
      };

    case 'PASSWORD_FAILED':
      return {
        ...state,
        password: { ...state.password, loading: false, error: action.error },
      };

    case 'PASSWORD_CLOSED':
      return { ...state, password: PASSWORD_INITIAL };

    case 'COLUMN_CONFIRMED':
      return {
        ...state,
        columnConfig: action.config,
        months: action.months ?? state.months,
        sheetInfos: action.sheetInfos ?? state.sheetInfos,
        range1: action.range1 ?? state.range1,
        range2: action.range2 ?? state.range2,
        side1: action.side1 ?? state.side1,
        side2: action.side2 ?? state.side2,
        step: STEP_SELECT,
      };

    case 'ANALYSIS_DONE':
      return { ...state, analysisResult: action.result, step: STEP_RESULT };

    case 'BACK_TO_SELECT':
      return { ...state, step: STEP_SELECT, analysisResult: null };

    case 'SET_MONTHLY_MODE':
      return { ...state, monthlyMode: action.value };

    case 'SET_RANGE1':
      return { ...state, range1: action.value };

    case 'SET_RANGE2':
      return { ...state, range2: action.value };

    case 'SET_SIDE1':
      return { ...state, side1: action.value };

    case 'SET_SIDE2':
      return { ...state, side2: action.value };

    default:
      return state;
  }
}
