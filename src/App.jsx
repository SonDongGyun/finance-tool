import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import MonthSelector from './components/MonthSelector';
import SheetComparator from './components/SheetComparator';
import SummaryCards from './components/SummaryCards';
import AnalysisSummary from './components/AnalysisSummary';
import AnalysisCharts from './components/AnalysisCharts';
import DetailTable from './components/DetailTable';
import VendorTable from './components/VendorTable';
import ExportButtons from './components/ExportButtons';
import PasswordModal from './components/PasswordModal';
import {
  parseExcelFile,
  decryptAndParse,
  extractMonths,
  analyzeSheets,
  analyzeMonthlyChanges,
  expandMonthRange,
} from './utils/excelParser';
import { useWindowSize } from './hooks/useWindowSize';
import {
  STEP_LANDING,
  STEP_UPLOAD,
  STEP_MAPPING,
  STEP_SELECT,
  STEP_RESULT,
  MODE_MONTHLY,
  MODE_SHEET,
} from './constants/steps';
import './App.css';

function App() {
  const { isMobile } = useWindowSize();
  const [step, setStep] = useState(STEP_LANDING);
  const [mode, setMode] = useState(MODE_MONTHLY);
  const [fileData, setFileData] = useState(null);
  const [columnConfig, setColumnConfig] = useState(null);

  // 월별 비교 상태
  const [months, setMonths] = useState([]);
  const [monthlyMode, setMonthlyMode] = useState('single');
  const [range1, setRange1] = useState({ start: '', end: '' });
  const [range2, setRange2] = useState({ start: '', end: '' });

  // 시트별 비교 상태
  const [sheetInfos, setSheetInfos] = useState([]);
  const [side1, setSide1] = useState({ sheetName: '', checkedMonths: new Set() });
  const [side2, setSide2] = useState({ sheetName: '', checkedMonths: new Set() });

  const [analysisResult, setAnalysisResult] = useState(null);

  // 암호 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleSelectMode = useCallback((m) => {
    setMode(m);
    setStep(STEP_UPLOAD);
    setFileData(null);
    setColumnConfig(null);
    setAnalysisResult(null);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setStep(STEP_LANDING);
    setFileData(null);
    setColumnConfig(null);
    setAnalysisResult(null);
    setMonths([]);
    setSheetInfos([]);
    setRange1({ start: '', end: '' });
    setRange2({ start: '', end: '' });
    setSide1({ sheetName: '', checkedMonths: new Set() });
    setSide2({ sheetName: '', checkedMonths: new Set() });
  }, []);

  const handleFileSuccess = useCallback((parsed) => {
    setFileData(parsed);
    setStep(STEP_MAPPING);
    setAnalysisResult(null);
    setShowPasswordModal(false);
    setPendingFile(null);
    setPasswordError('');
  }, []);

  const handleFileLoaded = useCallback(async (file) => {
    try {
      const parsed = await parseExcelFile(file);
      handleFileSuccess(parsed);
    } catch (err) {
      if (err && err.encrypted) {
        setPendingFile(file);
        setPasswordError('');
        setShowPasswordModal(true);
      } else {
        throw err;
      }
    }
  }, [handleFileSuccess]);

  const handlePasswordSubmit = useCallback(async (password) => {
    if (!pendingFile) return;
    setIsDecrypting(true);
    setPasswordError('');
    try {
      const parsed = await decryptAndParse(pendingFile, password);
      handleFileSuccess(parsed);
    } catch (err) {
      setPasswordError(err.message || '복호화에 실패했습니다.');
    }
    setIsDecrypting(false);
  }, [pendingFile, handleFileSuccess]);

  const handlePasswordClose = useCallback(() => {
    setShowPasswordModal(false);
    setPendingFile(null);
    setPasswordError('');
  }, []);

  const handleColumnConfirm = useCallback((config) => {
    setColumnConfig(config);

    if (mode === MODE_MONTHLY) {
      const monthList = extractMonths(fileData.rows, config.dateColumn);
      setMonths(monthList);
      if (monthList.length >= 2) {
        const prev = monthList[monthList.length - 2];
        const curr = monthList[monthList.length - 1];
        setRange1({ start: prev, end: prev });
        setRange2({ start: curr, end: curr });
      }
    } else if (mode === MODE_SHEET) {
      const infos = analyzeSheets(fileData.rowsBySheet || {}, config.dateColumn);
      setSheetInfos(infos);
      if (infos.length >= 2) {
        setSide1({ sheetName: infos[0].name, checkedMonths: new Set(infos[0].months) });
        setSide2({ sheetName: infos[1].name, checkedMonths: new Set(infos[1].months) });
      } else if (infos.length === 1) {
        setSide1({ sheetName: infos[0].name, checkedMonths: new Set() });
        setSide2({ sheetName: '', checkedMonths: new Set() });
      }
    }

    setStep(STEP_SELECT);
  }, [fileData, mode]);

  const handleAnalyze = useCallback(() => {
    if (mode === MODE_MONTHLY) {
      const months1 = expandMonthRange(range1.start, range1.end);
      const months2 = expandMonthRange(range2.start, range2.end);
      if (months1.length === 0 || months2.length === 0) return;
      if (range1.start === range2.start && range1.end === range2.end) return;

      const result = analyzeMonthlyChanges(fileData.rows, {
        ...columnConfig,
        months1,
        months2,
      });
      setAnalysisResult(result);
      setStep(STEP_RESULT);
    } else if (mode === MODE_SHEET) {
      const months1 = Array.from(side1.checkedMonths);
      const months2 = Array.from(side2.checkedMonths);
      if (months1.length === 0 || months2.length === 0) return;
      if (side1.sheetName === side2.sheetName) return;

      const sheet1Rows = fileData.rowsBySheet?.[side1.sheetName] || [];
      const sheet2Rows = fileData.rowsBySheet?.[side2.sheetName] || [];
      const rows = [...sheet1Rows, ...sheet2Rows];

      const result = analyzeMonthlyChanges(rows, {
        ...columnConfig,
        months1,
        months2,
      });
      setAnalysisResult(result);
      setStep(STEP_RESULT);
    }
  }, [mode, fileData, columnConfig, range1, range2, side1, side2]);

  const handleBackToSelect = useCallback(() => {
    setStep(STEP_SELECT);
    setAnalysisResult(null);
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

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    position: 'relative', zIndex: 10,
                    maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto',
                    marginTop: '24px',
                  }}
                >
                  <div className="glass-light" style={{ borderRadius: '16px', padding: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                      데이터 미리보기 (총 {fileData.totalRows}행
                      {fileData.sheetNames?.length > 1 ? ` · 시트 ${fileData.sheetNames.length}개` : ''})
                    </p>
                    <div style={{ overflowX: 'auto', fontSize: '12px' }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                            {fileData.headers.slice(0, 8).map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.rows.slice(0, 5).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(15,23,42,0.2)' }}>
                              {fileData.headers.slice(0, 8).map(h => (
                                <td key={h} style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {String(row[h] || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
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
                  onModeChange={setMonthlyMode}
                  range1={range1}
                  range2={range2}
                  onRange1Change={setRange1}
                  onRange2Change={setRange2}
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
                  onSide1Change={setSide1}
                  onSide2Change={setSide2}
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
            <p>다비치 재무팀 분석 툴 &copy; {new Date().getFullYear()}</p>
          </footer>
        </main>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
        error={passwordError}
        isLoading={isDecrypting}
      />
    </div>
  );
}

export default App;
