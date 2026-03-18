import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import MonthSelector from './components/MonthSelector';
import SummaryCards from './components/SummaryCards';
import AnalysisSummary from './components/AnalysisSummary';
import AnalysisCharts from './components/AnalysisCharts';
import DetailTable from './components/DetailTable';
import VendorTable from './components/VendorTable';
import ExportButtons from './components/ExportButtons';
import PasswordModal from './components/PasswordModal';
import { parseExcelFile, decryptAndParse, extractMonths, analyzeMonthlyChanges } from './utils/excelParser';
import { useWindowSize } from './hooks/useWindowSize';
import { STEP_UPLOAD, STEP_MAPPING, STEP_SELECT, STEP_RESULT } from './constants/steps';
import './App.css';

function App() {
  const { isMobile } = useWindowSize();
  const [step, setStep] = useState(STEP_UPLOAD); // upload, mapping, select, result
  const [fileData, setFileData] = useState(null);
  const [columnConfig, setColumnConfig] = useState(null);
  const [months, setMonths] = useState([]);
  const [month1, setMonth1] = useState('');
  const [month2, setMonth2] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // 암호 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

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
        // 암호화된 파일 감지 → 모달 표시
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
    const monthList = extractMonths(fileData.rows, config.dateColumn);
    setMonths(monthList);

    if (monthList.length >= 2) {
      setMonth1(monthList[monthList.length - 2]);
      setMonth2(monthList[monthList.length - 1]);
    }

    setStep(STEP_SELECT);
  }, [fileData]);

  const handleAnalyze = useCallback(() => {
    if (!month1 || !month2 || month1 === month2) return;

    const result = analyzeMonthlyChanges(fileData.rows, {
      ...columnConfig,
      month1,
      month2,
    });

    setAnalysisResult(result);
    setStep(STEP_RESULT);
  }, [fileData, columnConfig, month1, month2]);

  const handleReset = useCallback(() => {
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
        <Header isCompact={step !== STEP_UPLOAD} />

        <main style={{ width: '100%', paddingBottom: '64px' }}>
          <FileUpload
            onFileLoaded={handleFileLoaded}
            isLoaded={!!fileData}
          />

          <AnimatePresence mode="wait">
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

                {/* Data preview */}
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
                      데이터 미리보기 (총 {fileData.totalRows}행)
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

            {step === STEP_SELECT && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MonthSelector
                  months={months}
                  month1={month1}
                  month2={month2}
                  onMonth1Change={setMonth1}
                  onMonth2Change={setMonth2}
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
                {/* Back button */}
                <div style={{ position: 'relative', zIndex: 10, marginTop: '24px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '14px',
                      background: 'rgba(51,65,85,0.4)', color: '#cbd5e1',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    ← 다른 월 비교하기
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

          {/* Footer */}
          <footer style={{
            position: 'relative', zIndex: 10,
            textAlign: 'center', padding: '40px 0',
            fontSize: '14px', color: '#64748b',
          }}>
            <p>다비치 재무팀 분석 툴 &copy; {new Date().getFullYear()}</p>
          </footer>
        </main>
      </div>

      {/* Password Modal */}
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
