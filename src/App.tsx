import { useCallback, useEffect, useReducer } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import DataPreview from './components/DataPreview';
import MonthSelector from './components/MonthSelector';
import SheetComparator from './components/SheetComparator';
import SummaryCards from './components/SummaryCards';
import AnalysisSummary from './components/AnalysisSummary';
import AnalysisCharts from './components/AnalysisCharts';
import DetailTable from './components/DetailTable';
import VendorTable from './components/VendorTable';
import ExportButtons from './components/ExportButtons';
import PasswordModal from './components/PasswordModal';
import { parseExcelFile, EncryptedFileError } from './utils/excel/parser';
import { extractMonths, analyzeSheets, analyzeMonthlyChanges, analyzeSheetComparison } from './utils/excel/analyzer';
import { expandMonthRange, monthRangesOverlap } from './utils/formatters';
import { decryptAndParse } from './services/decryptService';
import { useWindowSize } from './hooks/useWindowSize';
import {
  STEP_LANDING,
  STEP_MAPPING,
  STEP_SELECT,
  STEP_RESULT,
  MODE_MONTHLY,
  MODE_SHEET,
  type AppMode,
} from './constants/steps';
import { appReducer, initialState, type AppAction, type MonthlyMode } from './state/appReducer';
import type { ColumnConfig, DateRange, SideSelection } from './types';
import './App.css';

function App() {
  const { isMobile } = useWindowSize();
  const [state, dispatch] = useReducer(appReducer, initialState);

  const {
    step, mode, fileData, columnConfig, months, monthlyMode,
    range1, range2, sheetInfos, side1, side2, analysisResult, password,
  } = state;

  const handleSelectMode = useCallback((m: AppMode) => {
    // pushState before dispatch so user-initiated mode picks add a history
    // entry — back button then returns to the landing page naturally.
    if (typeof window !== 'undefined' && window.location.search !== `?mode=${m}`) {
      window.history.pushState({}, '', `/?mode=${m}`);
    }
    dispatch({ type: 'SELECT_MODE', mode: m });
  }, []);

  const handleBackToLanding = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.search !== '') {
      window.history.pushState({}, '', '/');
    }
    dispatch({ type: 'BACK_TO_LANDING' });
  }, []);

  // (1) Hydrate state from URL on mount: /?mode=monthly|sheet jumps straight
  // into the upload step for that mode. Other paths fall through to landing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === MODE_MONTHLY || m === MODE_SHEET) {
      dispatch({ type: 'SELECT_MODE', mode: m });
    }
    // Run-once on mount; deliberately not reactive to URL changes.
  }, []);

  // (2) Sync browser back/forward to state. Listener is mounted once with no
  // deps — it reads the current URL fresh on each pop, so no stale closure.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === MODE_MONTHLY || m === MODE_SHEET) {
        dispatch({ type: 'SELECT_MODE', mode: m });
      } else {
        dispatch({ type: 'BACK_TO_LANDING' });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleFileLoaded = useCallback(async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      dispatch({ type: 'FILE_PARSED', parsed });
    } catch (err) {
      if (err instanceof EncryptedFileError) {
        dispatch({ type: 'PASSWORD_REQUIRED', file });
      } else {
        throw err;
      }
    }
  }, []);

  const handlePasswordSubmit = useCallback(async (pwd: string) => {
    if (!password.file) return;
    dispatch({ type: 'PASSWORD_SUBMITTING' });
    try {
      const parsed = await decryptAndParse(password.file, pwd);
      dispatch({ type: 'FILE_PARSED', parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : '복호화에 실패했습니다.';
      dispatch({ type: 'PASSWORD_FAILED', error: message });
    }
  }, [password.file]);

  const handlePasswordClose = useCallback(() => {
    dispatch({ type: 'PASSWORD_CLOSED' });
  }, []);

  const handleColumnConfirm = useCallback((config: ColumnConfig) => {
    if (!fileData) return;

    if (mode === MODE_MONTHLY) {
      const monthList = extractMonths(fileData.rows, config.dateColumn);
      const action: AppAction = {
        type: 'COLUMN_CONFIRMED',
        config,
        months: monthList,
        sheetInfos: [],
      };
      if (monthList.length >= 2) {
        const prev = monthList[monthList.length - 2];
        const curr = monthList[monthList.length - 1];
        action.range1 = { start: prev, end: prev };
        action.range2 = { start: curr, end: curr };
      }
      dispatch(action);
    } else if (mode === MODE_SHEET) {
      const infos = analyzeSheets(fileData.rowsBySheet || {}, config.dateColumn);
      const action: AppAction = {
        type: 'COLUMN_CONFIRMED',
        config,
        months: [],
        sheetInfos: infos,
      };
      if (infos.length >= 2) {
        action.side1 = { sheetName: infos[0].name, checkedMonths: new Set(infos[0].months) };
        action.side2 = { sheetName: infos[1].name, checkedMonths: new Set(infos[1].months) };
      } else if (infos.length === 1) {
        action.side1 = { sheetName: infos[0].name, checkedMonths: new Set() };
        action.side2 = { sheetName: '', checkedMonths: new Set() };
      }
      dispatch(action);
    }
  }, [fileData, mode]);

  const handleAnalyze = useCallback(() => {
    if (!fileData || !columnConfig) return;

    if (mode === MODE_MONTHLY) {
      const months1 = expandMonthRange(range1.start, range1.end);
      const months2 = expandMonthRange(range2.start, range2.end);
      if (months1.length === 0 || months2.length === 0) return;
      if (range1.start === range2.start && range1.end === range2.end) return;
      if (monthRangesOverlap(months1, months2)) {
        alert('두 비교 범위가 겹칩니다. 같은 월은 한쪽 기간에만 포함되도록 범위를 조정해주세요.');
        return;
      }
      const result = analyzeMonthlyChanges(fileData.rows, {
        ...columnConfig,
        months1,
        months2,
      });
      dispatch({ type: 'ANALYSIS_DONE', result });
    } else if (mode === MODE_SHEET) {
      const months1 = Array.from(side1.checkedMonths);
      const months2 = Array.from(side2.checkedMonths);
      if (months1.length === 0 || months2.length === 0) return;
      if (side1.sheetName === side2.sheetName) return;
      const sheet1Rows = fileData.rowsBySheet?.[side1.sheetName] || [];
      const sheet2Rows = fileData.rowsBySheet?.[side2.sheetName] || [];
      const result = analyzeSheetComparison(
        sheet1Rows,
        sheet2Rows,
        columnConfig,
        months1,
        months2,
      );
      dispatch({ type: 'ANALYSIS_DONE', result });
    }
  }, [mode, fileData, columnConfig, range1, range2, side1, side2]);

  const handleBackToSelect = useCallback(() => {
    dispatch({ type: 'BACK_TO_SELECT' });
  }, []);

  const handleSetMonthlyMode = useCallback((value: MonthlyMode) => {
    dispatch({ type: 'SET_MONTHLY_MODE', value });
  }, []);
  const handleSetRange1 = useCallback((value: DateRange) => {
    dispatch({ type: 'SET_RANGE1', value });
  }, []);
  const handleSetRange2 = useCallback((value: DateRange) => {
    dispatch({ type: 'SET_RANGE2', value });
  }, []);
  const handleSetSide1 = useCallback((value: SideSelection) => {
    dispatch({ type: 'SET_SIDE1', value });
  }, []);
  const handleSetSide2 = useCallback((value: SideSelection) => {
    dispatch({ type: 'SET_SIDE2', value });
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <div className="bg-particles" />

      <div style={{
        width: '100%',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: isMobile ? '16px' : '32px',
        paddingRight: isMobile ? '16px' : '32px',
        position: 'relative',
        zIndex: 1,
      }}>
        <Header isCompact={step !== STEP_LANDING} />

        <main style={{ width: '100%', paddingBottom: '64px' }}>
          <AnimatePresence mode="wait">
            {step === STEP_LANDING && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LandingPage onSelectMode={handleSelectMode} />
              </motion.div>
            )}

            {step !== STEP_LANDING && (
              <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ position: 'relative', zIndex: 10, marginTop: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={handleBackToLanding}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                      background: 'rgba(51,65,85,0.4)', color: '#cbd5e1',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <ArrowLeft style={{ width: '14px', height: '14px' }} />
                    모드 선택으로
                  </button>
                  <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b' }}>
                    {mode === MODE_MONTHLY ? '월별 비교' : '시트별 비교'} 모드
                  </span>
                </div>

                <FileUpload
                  onFileLoaded={handleFileLoaded}
                  isLoaded={!!fileData}
                />
              </motion.div>
            )}

            {step === STEP_MAPPING && fileData && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ColumnMapper
                  headers={fileData.headers}
                  onConfirm={handleColumnConfirm}
                />

                <DataPreview file={fileData} />
              </motion.div>
            )}

            {step === STEP_SELECT && mode === MODE_MONTHLY && (
              <motion.div
                key="select-monthly"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MonthSelector
                  months={months}
                  mode={monthlyMode}
                  onModeChange={handleSetMonthlyMode}
                  range1={range1}
                  range2={range2}
                  onRange1Change={handleSetRange1}
                  onRange2Change={handleSetRange2}
                  onAnalyze={handleAnalyze}
                />
              </motion.div>
            )}

            {step === STEP_SELECT && mode === MODE_SHEET && (
              <motion.div
                key="select-sheet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SheetComparator
                  sheets={sheetInfos}
                  side1={side1}
                  side2={side2}
                  onSide1Change={handleSetSide1}
                  onSide2Change={handleSetSide2}
                  onAnalyze={handleAnalyze}
                />
              </motion.div>
            )}

            {step === STEP_RESULT && analysisResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ position: 'relative', zIndex: 10, marginTop: '24px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackToSelect}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '14px',
                      background: 'rgba(51,65,85,0.4)', color: '#cbd5e1',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    ← 다시 선택하기
                  </motion.button>
                </div>

                <ExportButtons result={analysisResult} />
                <SummaryCards result={analysisResult} />
                <AnalysisSummary result={analysisResult} />
                <AnalysisCharts result={analysisResult} />
                <DetailTable result={analysisResult} />
                <VendorTable result={analysisResult} />
              </motion.div>
            )}
          </AnimatePresence>

          <footer style={{
            position: 'relative', zIndex: 10,
            textAlign: 'center', padding: '40px 0',
            fontSize: '14px', color: '#64748b',
          }}>
            <p>재무 분석 툴 &copy; {new Date().getFullYear()}</p>
          </footer>
        </main>
      </div>

      <PasswordModal
        isOpen={password.open}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
        error={password.error}
        isLoading={password.loading}
      />
    </div>
  );
}

export default App;
